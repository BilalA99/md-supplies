import { NextResponse } from 'next/server'
import { getResend, FROM_EMAIL, TO_EMAIL } from '@/lib/resend'
import { contactSchema } from '@/lib/forms/schema'
import {
  assertAllowedOrigin,
  readJsonBounded,
  sanitizeHeaderValue,
  fieldErrors,
  isHoneypotFilled,
} from '@/lib/forms/guards'

export async function POST(req: Request) {
  const origin = assertAllowedOrigin(req)
  if (!origin.ok) {
    return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 })
  }

  const read = await readJsonBounded(req)
  if (!read.ok) {
    const error = read.status === 413 ? 'Payload too large' : 'Invalid JSON'
    return NextResponse.json({ error }, { status: read.status })
  }

  // Silently accept (but never send) bot submissions that trip the honeypot,
  // so scrapers can't distinguish a drop from a success.
  if (isHoneypotFilled(read.data)) {
    return NextResponse.json({ ok: true })
  }

  const parsed = contactSchema.safeParse(read.data)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', fields: fieldErrors(parsed.error) },
      { status: 400 },
    )
  }

  const { name, email, subject, message } = parsed.data

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: sanitizeHeaderValue(email),
      subject: subject
        ? sanitizeHeaderValue(`[Contact] ${subject}`)
        : '[Contact] New message from MDSupplies',
      text: [
        `Name:    ${name}`,
        `Email:   ${email}`,
        `Subject: ${subject || '—'}`,
        '',
        message,
      ].join('\n'),
    })
  } catch (err) {
    // Log the failure class only — never the submitted field values.
    console.error('contact email send failed:', (err as Error)?.name ?? 'Error')
    return NextResponse.json({ error: 'Email delivery failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}

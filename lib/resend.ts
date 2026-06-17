import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set — add it to .env.local')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@mdsupplies.com'
export const TO_EMAIL   = process.env.RESEND_TO_EMAIL   ?? 'team@mdsupplies.com'

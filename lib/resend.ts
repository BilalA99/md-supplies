import { Resend } from 'resend'
import { serverEnv } from '@/lib/env.server'

export const FROM_EMAIL = serverEnv.resendFromEmail
export const TO_EMAIL   = serverEnv.resendToEmail

let client: Resend | null = null

export function getResend(): Resend {
  if (!client) {
    client = new Resend(serverEnv.resendApiKey)
  }
  return client
}

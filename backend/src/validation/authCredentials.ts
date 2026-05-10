import { z } from 'zod'

export const CREDENTIALS_ERROR =
  'Invalid email or password. Email must be valid; password must be 8-72 characters.'

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1)
    .max(254)
    .email()
    .transform((s) => s.toLowerCase()),
  password: z.string().min(8).max(72),
})

export type Credentials = z.infer<typeof credentialsSchema>

export function parseCredentials(
  body: unknown,
): { ok: true; data: Credentials } | { ok: false } {
  const result = credentialsSchema.safeParse(body)
  if (!result.success) return { ok: false }
  return { ok: true, data: result.data }
}

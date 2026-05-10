import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { signAccessToken } from '../lib/jwt'
import { prisma } from '../prisma'
import type { Credentials } from '../validation/authCredentials'

export async function registerUser(
  input: Credentials,
): Promise<
  | { outcome: 'created'; user: { id: string; email: string } }
  | { outcome: 'duplicate_email' }
  | { outcome: 'failed'; cause: unknown }
> {
  const { email, password } = input

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    try {
      const user = await prisma.user.create({
        data: { email, passwordHash },
        select: { id: true, email: true },
      })
      return { outcome: 'created', user }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return { outcome: 'duplicate_email' }
      }
      return { outcome: 'failed', cause: err }
    }
  } catch (err) {
    return { outcome: 'failed', cause: err }
  }
}

export async function loginUser(
  input: Credentials,
): Promise<
  | { outcome: 'ok'; token: string }
  | { outcome: 'invalid_credentials' }
  | { outcome: 'jwt_misconfigured' }
  | { outcome: 'failed'; cause: unknown }
> {
  const { email, password } = input

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    })

    const passwordOk =
      user !== null && (await bcrypt.compare(password, user.passwordHash))

    if (!user || !passwordOk) {
      return { outcome: 'invalid_credentials' }
    }

    try {
      const token = signAccessToken(user.id)
      return { outcome: 'ok', token }
    } catch {
      return { outcome: 'jwt_misconfigured' }
    }
  } catch (err) {
    return { outcome: 'failed', cause: err }
  }
}

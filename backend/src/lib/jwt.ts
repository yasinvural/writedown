import jwt from 'jsonwebtoken'

const DEFAULT_EXPIRES_SEC = 86400

/**
 * Signs an access token with HS256. Payload **`sub`** is the user id.
 * `JWT_EXPIRES_IN`: optional seconds (positive integer).
 */
export function signAccessToken(userId: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret?.trim()) {
    throw new Error('JWT_SECRET is not set')
  }

  let expiresIn = DEFAULT_EXPIRES_SEC
  const raw = process.env.JWT_EXPIRES_IN?.trim()
  if (raw) {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) expiresIn = n
  }

  return jwt.sign({ sub: userId }, secret, {
    algorithm: 'HS256',
    expiresIn,
  })
}

import jwt from 'jsonwebtoken'

const DEFAULT_EXPIRES_SEC = 86400

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret?.trim()) {
    throw new Error('JWT_SECRET is not set')
  }
  return secret
}

/**
 * Access token lifetime in seconds (`JWT_EXPIRES_IN` or default 86400).
 */
export function getAccessTokenTtlSeconds(): number {
  let expiresIn = DEFAULT_EXPIRES_SEC
  const raw = process.env.JWT_EXPIRES_IN?.trim()
  if (raw) {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) expiresIn = n
  }
  return expiresIn
}

/**
 * Signs an access token with HS256. Payload **`sub`** is the user id.
 * `JWT_EXPIRES_IN`: optional seconds (positive integer).
 */
export function signAccessToken(userId: string): string {
  const secret = getSecret()
  const expiresIn = getAccessTokenTtlSeconds()

  return jwt.sign({ sub: userId }, secret, {
    algorithm: 'HS256',
    expiresIn,
  })
}

export function verifyAccessToken(token: string): { userId: string } {
  const secret = getSecret()
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] })
  if (
    decoded === null ||
    typeof decoded !== 'object' ||
    typeof (decoded as jwt.JwtPayload).sub !== 'string'
  ) {
    throw new Error('Invalid token')
  }
  return { userId: (decoded as jwt.JwtPayload).sub as string }
}

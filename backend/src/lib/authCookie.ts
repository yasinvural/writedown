import type { Response } from 'express'
import { getAccessTokenTtlSeconds } from './jwt'

export const AUTH_COOKIE_NAME = 'writedown_session'

export function setAuthCookie(res: Response, token: string): void {
  const maxAgeMs = getAccessTokenTtlSeconds() * 1000
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs,
  })
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
}

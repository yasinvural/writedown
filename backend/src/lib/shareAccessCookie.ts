import type { Request, Response } from 'express'
import { getAccessTokenTtlSeconds, verifyShareAccessToken } from './jwt'

export const SHARE_ACCESS_COOKIE_NAME = 'writedown_share_doc'

export function setShareAccessCookie(res: Response, token: string): void {
  const maxAgeMs = getAccessTokenTtlSeconds() * 1000
  res.cookie(SHARE_ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs,
  })
}

export function clearShareAccessCookie(res: Response): void {
  res.clearCookie(SHARE_ACCESS_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
}

/**
 * Validates share cookie belongs to `expectedUserId`. Returns resolved document id or `undefined`.
 */
export function readShareDocumentIdFromCookie(
  cookies: Request['cookies'],
  expectedUserId: string,
): { documentId?: string; clearCookie: boolean } {
  const raw = cookies?.[SHARE_ACCESS_COOKIE_NAME]
  if (typeof raw !== 'string' || !raw.trim()) {
    return { clearCookie: false }
  }

  try {
    const { userId, documentId } = verifyShareAccessToken(raw)
    if (userId !== expectedUserId) {
      return { clearCookie: true }
    }
    return { documentId, clearCookie: false }
  } catch {
    return { clearCookie: true }
  }
}

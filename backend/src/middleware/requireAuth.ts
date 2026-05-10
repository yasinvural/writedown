import type { NextFunction, Request, Response } from 'express'
import { AUTH_COOKIE_NAME, clearAuthCookie } from '../lib/authCookie'
import * as authService from '../services/authService'

/**
 * User id set by `requireAuth` for downstream handlers on this router.
 * Prefer `authedUserId(res)` in handlers over reading `res.locals` directly.
 */
export function authedUserId(res: Response): string {
  const id = res.locals.userId
  if (typeof id !== 'string' || !id) {
    throw new Error('authedUserId: requireAuth must run first')
  }
  return id
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const raw = req.cookies?.[AUTH_COOKIE_NAME]
  const result = await authService.getSessionUser(raw)

  if (result.outcome === 'ok') {
    res.locals.userId = result.user.id
    next()
    return
  }

  if (result.outcome === 'invalid_session') {
    clearAuthCookie(res)
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  if (result.outcome === 'failed') {
    console.error('requireAuth session lookup failed', result.cause)
    res.status(500).json({ error: 'Internal server error' })
    return
  }

  res.status(401).json({ error: 'Not authenticated' })
}

declare global {
  namespace Express {
    interface Locals {
      userId?: string
    }
  }
}

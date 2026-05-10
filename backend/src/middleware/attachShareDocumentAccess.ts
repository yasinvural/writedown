import type { NextFunction, Request, Response } from 'express'
import {
  clearShareAccessCookie,
  readShareDocumentIdFromCookie,
} from '../lib/shareAccessCookie'

/**
 * After `requireAuth`, optionally binds `res.locals.shareDocumentId` from the share cookie.
 */
export function attachShareDocumentAccess(req: Request, res: Response, next: NextFunction): void {
  const userId = res.locals.userId
  if (typeof userId !== 'string' || !userId) {
    next()
    return
  }

  const { documentId, clearCookie } = readShareDocumentIdFromCookie(req.cookies, userId)
  if (clearCookie) {
    clearShareAccessCookie(res)
  }
  if (documentId) {
    res.locals.shareDocumentId = documentId
  }
  next()
}

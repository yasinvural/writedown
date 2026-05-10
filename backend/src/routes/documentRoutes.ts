import { Router, type Request, type Response } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { signShareAccessToken } from '../lib/jwt'
import { allowShareRedeemAttempt } from '../lib/redeemRateLimit'
import { setShareAccessCookie } from '../lib/shareAccessCookie'
import { attachShareDocumentAccess } from '../middleware/attachShareDocumentAccess'
import { authedUserId, requireAuth } from '../middleware/requireAuth'
import { prisma } from '../prisma'
import * as documentService from '../services/documentService'
import {
  createOrReplaceShareForDocument,
  findActiveDocumentIdByShareCode,
  revokeShareForDocument,
} from '../services/documentShareService'
import {
  DOCUMENT_BODY_TOO_LARGE,
  MAX_CONTENT_JSON_BYTES,
  contentJsonByteLength,
  documentCreateSchema,
  documentPatchSchema,
} from '../validation/documentPayload'

const shareRedeemBodySchema = z.object({
  code: z.string().min(1),
})

const router = Router()

router.use(requireAuth)
router.use(attachShareDocumentAccess)

function shareAccessOption(res: Response): string | undefined {
  return typeof res.locals.shareDocumentId === 'string' ? res.locals.shareDocumentId : undefined
}

function redeemLimiterKey(req: Request, userId: string): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  return `${ip}:${userId}`
}

router.post('/share/redeem', async (req: Request, res: Response) => {
  const parsed = shareRedeemBodySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Provide a share code' })
    return
  }

  const userId = authedUserId(res)
  if (!allowShareRedeemAttempt(redeemLimiterKey(req, userId))) {
    res.status(429).json({ error: 'Too many attempts. Try again later.' })
    return
  }

  try {
    const documentId = await findActiveDocumentIdByShareCode(parsed.data.code)
    if (!documentId) {
      res.status(400).json({ error: 'Invalid or expired share code' })
      return
    }

    const token = signShareAccessToken(userId, documentId)
    setShareAccessCookie(res, token)
    res.status(200).json({ documentId })
  } catch (err) {
    console.error('share redeem', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/', async (_req: Request, res: Response) => {
  const userId = authedUserId(res)
  const docs = await documentService.listActiveDocuments(userId)
  res.status(200).json({
    documents: docs.map(({ userId: _u, ...rest }) => rest),
  })
})

router.get('/trash', async (_req: Request, res: Response) => {
  const userId = authedUserId(res)
  const docs = await documentService.listTrashedDocuments(userId)
  res.status(200).json({
    documents: docs.map(({ userId: _u, ...rest }) => rest),
  })
})

router.post('/', async (req: Request, res: Response) => {
  const parsed = documentCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid document body — title optional; content optional JSON object (TipTap document).',
    })
    return
  }

  const content = parsed.data.content
  if (content !== undefined && contentJsonByteLength(content as never) > MAX_CONTENT_JSON_BYTES) {
    res.status(413).json({ error: DOCUMENT_BODY_TOO_LARGE })
    return
  }

  try {
    const { title, content } = parsed.data
    const doc = await documentService.createDocument(authedUserId(res), {
      title,
      ...(content !== undefined ? { content: content as Prisma.InputJsonValue } : {}),
    })
    const { userId: _u, ...body } = doc
    res.status(201).json(body)
  } catch (err) {
    console.error('createDocument', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await documentService.getDocumentForViewer(
      authedUserId(res),
      req.params.id,
      shareAccessOption(res),
    )
    if (doc === 'not_found') {
      res.status(404).json({ error: 'Document not found' })
      return
    }
    const { userId: _u, ...body } = doc
    res.status(200).json(body)
  } catch (err) {
    console.error('getDocument', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', async (req: Request, res: Response) => {
  const parsed = documentPatchSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error:
        'Invalid patch body — supply at least one of title or content; content must be a JSON object.',
    })
    return
  }

  if (
    parsed.data.content !== undefined &&
    contentJsonByteLength(parsed.data.content as never) > MAX_CONTENT_JSON_BYTES
  ) {
    res.status(413).json({ error: DOCUMENT_BODY_TOO_LARGE })
    return
  }

  try {
    const { title, content } = parsed.data
    const doc = await documentService.patchDocument(
      authedUserId(res),
      req.params.id,
      {
        title,
        ...(content !== undefined ? { content: content as Prisma.InputJsonValue } : {}),
      },
      { shareAccessDocumentId: shareAccessOption(res) },
    )
    if (doc === 'not_found') {
      res.status(404).json({ error: 'Document not found' })
      return
    }
    const { userId: _u, ...body } = doc
    res.status(200).json(body)
  } catch (err) {
    console.error('patchDocument', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await documentService.softDeleteDocument(authedUserId(res), req.params.id)
    if (doc === 'not_found') {
      res.status(404).json({ error: 'Document not found' })
      return
    }
    const { userId: _u, ...body } = doc
    res.status(200).json(body)
  } catch (err) {
    console.error('softDeleteDocument', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/restore', async (req: Request, res: Response) => {
  try {
    const doc = await documentService.restoreDocument(authedUserId(res), req.params.id)
    if (doc === 'not_found') {
      res.status(404).json({ error: 'Document not found' })
      return
    }
    const { userId: _u, ...body } = doc
    res.status(200).json(body)
  } catch (err) {
    console.error('restoreDocument', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: authedUserId(res), deletedAt: null },
      select: { id: true },
    })
    if (!doc) {
      res.status(404).json({ error: 'Document not found' })
      return
    }
    const { code } = await createOrReplaceShareForDocument(doc.id)
    res.status(200).json({ code })
  } catch (err) {
    console.error('create share', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id/share', async (req: Request, res: Response) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, userId: authedUserId(res), deletedAt: null },
      select: { id: true },
    })
    if (!doc) {
      res.status(404).json({ error: 'Document not found' })
      return
    }
    await revokeShareForDocument(doc.id)
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('revoke share', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export { router as documentRouter }

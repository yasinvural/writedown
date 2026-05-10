import { createHash, randomBytes } from 'crypto'
import { prisma } from '../prisma'

function getSharePepper(): string {
  const p = process.env.DOCUMENT_SHARE_PEPPER?.trim() || process.env.JWT_SECRET
  if (!p) throw new Error('DOCUMENT_SHARE_PEPPER or JWT_SECRET must be set for share codes')
  return p
}

/** Normalize user input: trim, lowercase, remove internal whitespace. */
export function normalizeShareCodeInput(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '')
}

function lookupHashForNormalizedCode(normalizedPlain: string): string {
  const pepper = getSharePepper()
  return createHash('sha256').update(pepper, 'utf8').update('|').update(normalizedPlain, 'utf8').digest('hex')
}

export function generatePlainShareCode(): string {
  return randomBytes(12).toString('base64url')
}

/**
 * Replace any existing share for this document with a new code. Returns the plaintext code once (not stored).
 */
export async function createOrReplaceShareForDocument(documentId: string): Promise<{ code: string }> {
  const code = generatePlainShareCode()
  const normalized = normalizeShareCodeInput(code)
  const lookupHash = lookupHashForNormalizedCode(normalized)

  await prisma.$transaction(async (tx) => {
    await tx.documentShare.deleteMany({ where: { documentId } })
    await tx.documentShare.create({
      data: { documentId, lookupHash },
    })
  })

  return { code }
}

export async function findActiveDocumentIdByShareCode(rawCode: string): Promise<string | null> {
  const normalized = normalizeShareCodeInput(rawCode)
  if (!normalized) return null

  const lookupHash = lookupHashForNormalizedCode(normalized)
  const row = await prisma.documentShare.findFirst({
    where: {
      lookupHash,
      revokedAt: null,
      document: { deletedAt: null },
    },
    select: { documentId: true },
  })
  return row?.documentId ?? null
}

export async function revokeShareForDocument(documentId: string): Promise<void> {
  await prisma.documentShare.updateMany({
    where: { documentId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function getActiveShareRowForDocument(
  documentId: string,
): Promise<{ id: string; createdAt: Date } | null> {
  const row = await prisma.documentShare.findFirst({
    where: { documentId, revokedAt: null },
    select: { id: true, createdAt: true },
  })
  return row
}

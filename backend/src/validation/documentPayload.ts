import { z } from 'zod'
import type { Prisma } from '@prisma/client'

export const DOCUMENT_BODY_TOO_LARGE =
  'Document content is too large. Reduce size and try again.'

const MAX_TITLE_LEN = 500
/** Approximate serialized JSON size ceiling for TipTap payloads */
export const MAX_CONTENT_JSON_BYTES = 512_000

const jsonLeaf: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonLeaf),
    z.record(z.string(), jsonLeaf),
  ]),
)

const tipTapLikeDoc = jsonLeaf.refine((v) => typeof v === 'object' && v !== null && !Array.isArray(v), {
  message: 'content must be a JSON object',
})

export const documentCreateSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE_LEN).optional(),
  content: tipTapLikeDoc.optional(),
})

export const documentPatchSchema = z
  .object({
    title: z.string().trim().min(1).max(MAX_TITLE_LEN).optional(),
    content: tipTapLikeDoc.optional(),
  })
  .refine((b) => b.title !== undefined || b.content !== undefined, {
    message: 'Expected at least one of title or content',
  })

export type DocumentCreateInput = z.infer<typeof documentCreateSchema>
export type DocumentPatchInput = z.infer<typeof documentPatchSchema>

export function contentJsonByteLength(value: Prisma.InputJsonValue): number {
  return Buffer.byteLength(JSON.stringify(value), 'utf8')
}

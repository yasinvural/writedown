import type { Prisma } from '@prisma/client'
import { prisma } from '../prisma'

const EMPTY_DOC: Prisma.InputJsonValue = { type: 'doc', content: [] }

function documentSelect() {
  return {
    id: true,
    userId: true,
    title: true,
    content: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  } as const
}

export type DocumentDto = {
  id: string
  userId: string
  title: string
  content: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export async function listActiveDocuments(userId: string): Promise<DocumentDto[]> {
  return prisma.document.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    select: documentSelect(),
  })
}

export async function listTrashedDocuments(userId: string): Promise<DocumentDto[]> {
  return prisma.document.findMany({
    where: { userId, deletedAt: { not: null } },
    orderBy: { deletedAt: 'desc' },
    select: documentSelect(),
  })
}

export async function createDocument(
  userId: string,
  input: { title?: string; content?: Prisma.InputJsonValue },
): Promise<DocumentDto> {
  const content = input.content ?? EMPTY_DOC

  return prisma.document.create({
    data: {
      userId,
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      content,
    },
    select: documentSelect(),
  })
}

export async function patchDocument(
  userId: string,
  id: string,
  input: { title?: string; content?: Prisma.InputJsonValue },
): Promise<DocumentDto | 'not_found'> {
  const existing = await prisma.document.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) return 'not_found'

  const data: Prisma.DocumentUpdateInput = {}
  if (input.title !== undefined) data.title = input.title.trim()
  if (input.content !== undefined) data.content = input.content

  return prisma.document.update({
    where: { id },
    data,
    select: documentSelect(),
  })
}

export async function softDeleteDocument(userId: string, id: string): Promise<DocumentDto | 'not_found'> {
  const doc = await prisma.document.findFirst({
    where: { id, userId },
    select: documentSelect(),
  })
  if (!doc) return 'not_found'
  if (doc.deletedAt !== null) return doc

  return prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: documentSelect(),
  })
}

export async function restoreDocument(userId: string, id: string): Promise<DocumentDto | 'not_found'> {
  const doc = await prisma.document.findFirst({
    where: { id, userId },
    select: documentSelect(),
  })
  if (!doc) return 'not_found'
  if (doc.deletedAt === null) return doc

  return prisma.document.update({
    where: { id },
    data: { deletedAt: null },
    select: documentSelect(),
  })
}

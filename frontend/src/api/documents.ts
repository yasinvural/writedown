import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiBase, errorMessageFromBody, readJson } from "./http";

async function readBodyOrThrow(res: Response, fallbackMsg: string): Promise<unknown> {
  const body = await readJson(res)
  if (res.status === 401) {
    throw new ApiError(401, errorMessageFromBody(body, "Not authenticated"), body)
  }
  if (!res.ok) {
    throw new ApiError(res.status, errorMessageFromBody(body, fallbackMsg), body)
  }
  return body
}

/** Document row from `/documents*` (dates as ISO strings in JSON). */
export type DocumentDto = {
  id: string;
  title: string;
  content: unknown;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export const documentKeys = {
  all: ["documents"] as const,
  activeList: () => [...documentKeys.all, "active"] as const,
  trashList: () => [...documentKeys.all, "trash"] as const,
  detail: (id: string) => [...documentKeys.all, "detail", id] as const,
  /** Client-side / optimistic editor buffer (optional consumers) */
  draft: (id: string) => [...documentKeys.all, "draft", id] as const,
};

function isDocumentDto(v: unknown): v is DocumentDto {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    "content" in o &&
    typeof o.createdAt === "string" &&
    typeof o.updatedAt === "string" &&
    (o.deletedAt === null || typeof o.deletedAt === "string")
  );
}

function parseDocumentListBody(body: unknown): DocumentDto[] {
  if (!body || typeof body !== "object" || !("documents" in body)) {
    throw new ApiError(500, "Invalid response", body);
  }
  const list = (body as { documents: unknown }).documents;
  if (!Array.isArray(list) || !list.every(isDocumentDto)) {
    throw new ApiError(500, "Invalid response", body);
  }
  return list;
}

async function credentialsFetch(path: string, init: RequestInit & { method: string }): Promise<Response> {
  const headers = new Headers(init.headers)
  if (init.body !== undefined && init.body !== null && init.body !== "") {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
  }
  return fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers,
  })
}

export async function fetchActiveDocuments(): Promise<DocumentDto[]> {
  const res = await credentialsFetch("/documents", { method: "GET" })
  const body = await readBodyOrThrow(res, "Could not load documents")
  return parseDocumentListBody(body)
}

export async function fetchTrashDocuments(): Promise<DocumentDto[]> {
  const res = await credentialsFetch("/documents/trash", { method: "GET" })
  const body = await readBodyOrThrow(res, "Could not load trash")
  return parseDocumentListBody(body)
}

export async function createDocument(payload?: {
  title?: string;
  content?: unknown;
}): Promise<DocumentDto> {
  const res = await credentialsFetch("/documents", {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  })
  const body = await readBodyOrThrow(res, "Could not create document")
  if (!isDocumentDto(body)) {
    throw new ApiError(500, "Invalid response", body)
  }
  return body
}

export async function patchDocument(
  id: string,
  payload: { title?: string; content?: unknown },
): Promise<DocumentDto> {
  const res = await credentialsFetch(`/documents/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
  const body = await readBodyOrThrow(res, "Could not save document")
  if (!isDocumentDto(body)) {
    throw new ApiError(500, "Invalid response", body)
  }
  return body
}

export async function softDeleteDocument(id: string): Promise<DocumentDto> {
  const res = await credentialsFetch(`/documents/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
  const body = await readBodyOrThrow(res, "Could not delete document")
  if (!isDocumentDto(body)) {
    throw new ApiError(500, "Invalid response", body)
  }
  return body
}

export async function restoreDocument(id: string): Promise<DocumentDto> {
  const res = await credentialsFetch(`/documents/${encodeURIComponent(id)}/restore`, {
    method: "POST",
    body: "{}",
  })
  const body = await readBodyOrThrow(res, "Could not restore document")
  if (!isDocumentDto(body)) {
    throw new ApiError(500, "Invalid response", body)
  }
  return body
}

function useInvalidateDocumentLists() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: documentKeys.activeList() })
    void qc.invalidateQueries({ queryKey: documentKeys.trashList() })
  }
}

export function useActiveDocumentsQuery() {
  return useQuery({
    queryKey: documentKeys.activeList(),
    queryFn: fetchActiveDocuments,
  })
}

export function useTrashDocumentsQuery() {
  return useQuery({
    queryKey: documentKeys.trashList(),
    queryFn: fetchTrashDocuments,
  })
}

export function useCreateDocumentMutation() {
  const invalidate = useInvalidateDocumentLists()
  return useMutation({
    mutationFn: (payload?: { title?: string; content?: unknown }) => createDocument(payload),
    onSuccess: () => invalidate(),
  })
}

export function usePatchDocumentMutation() {
  const qc = useQueryClient()
  const invalidate = useInvalidateDocumentLists()
  return useMutation({
    mutationFn: (args: { id: string; title?: string; content?: unknown }) =>
      patchDocument(args.id, { title: args.title, content: args.content }),
    onSuccess: (_data, vars) => {
      invalidate()
      void qc.invalidateQueries({ queryKey: documentKeys.detail(vars.id) })
    },
  })
}

export function useSoftDeleteDocumentMutation() {
  const invalidate = useInvalidateDocumentLists()
  return useMutation({
    mutationFn: (id: string) => softDeleteDocument(id),
    onSuccess: () => invalidate(),
  })
}

export function useRestoreDocumentMutation() {
  const invalidate = useInvalidateDocumentLists()
  return useMutation({
    mutationFn: (id: string) => restoreDocument(id),
    onSuccess: () => invalidate(),
  })
}

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

export async function fetchDocument(id: string): Promise<DocumentDto> {
  const res = await credentialsFetch(`/documents/${encodeURIComponent(id)}`, { method: "GET" })
  const body = await readBodyOrThrow(res, "Could not load document")
  if (!isDocumentDto(body)) {
    throw new ApiError(500, "Invalid response", body)
  }
  return body
}

export async function createOrReplaceShareCode(documentId: string): Promise<{ code: string }> {
  const res = await credentialsFetch(`/documents/${encodeURIComponent(documentId)}/share`, {
    method: "POST",
    body: "{}",
  })
  const body = await readBodyOrThrow(res, "Could not create share code")
  if (!body || typeof body !== "object" || typeof (body as { code?: unknown }).code !== "string") {
    throw new ApiError(500, "Invalid response", body)
  }
  return { code: (body as { code: string }).code }
}

export async function redeemShareCode(code: string): Promise<{ documentId: string }> {
  const res = await credentialsFetch("/documents/share/redeem", {
    method: "POST",
    body: JSON.stringify({ code }),
  })
  const body = await readBodyOrThrow(res, "Could not open shared document")
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { documentId?: unknown }).documentId !== "string"
  ) {
    throw new ApiError(500, "Invalid response", body)
  }
  return { documentId: (body as { documentId: string }).documentId }
}

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

export function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (typeof raw === "string" && raw.trim()) {
    return raw.replace(/\/$/, "")
  }
  return "http://localhost:3000"
}

export async function readJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text.trim()) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export function errorMessageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const e = (body as { error: unknown }).error
    if (typeof e === "string" && e.trim()) return e
  }
  return fallback
}

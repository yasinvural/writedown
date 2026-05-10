import { ApiError, apiBase, errorMessageFromBody, readJson } from "./http";

export type AuthUser = { id: string; email: string };

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch(`${apiBase()}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  })
  if (res.status === 401) return null
  const body = await readJson(res)
  if (!res.ok) {
    throw new ApiError(res.status, errorMessageFromBody(body, 'Request failed'), body)
  }
  if (!body || typeof body !== 'object' || !('user' in body)) {
    throw new ApiError(res.status, 'Invalid response', body)
  }
  const user = (body as { user: unknown }).user
  if (
    !user ||
    typeof user !== 'object' ||
    typeof (user as { id: unknown }).id !== 'string' ||
    typeof (user as { email: unknown }).email !== 'string'
  ) {
    throw new ApiError(res.status, 'Invalid response', body)
  }
  return { id: (user as AuthUser).id, email: (user as AuthUser).email }
}

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(`${apiBase()}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await readJson(res)
  if (!res.ok) {
    throw new ApiError(
      res.status,
      errorMessageFromBody(body, res.status === 401 ? 'Invalid email or password' : 'Request failed'),
      body,
    )
  }
}

export async function register(email: string, password: string): Promise<void> {
  const res = await fetch(`${apiBase()}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await readJson(res)
  if (!res.ok) {
    if (res.status === 409) {
      throw new ApiError(
        res.status,
        errorMessageFromBody(body, 'Email already registered'),
        body,
      )
    }
    throw new ApiError(
      res.status,
      errorMessageFromBody(body, 'Could not create account'),
      body,
    )
  }
}

export async function logout(): Promise<void> {
  const res = await fetch(`${apiBase()}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  const body = await readJson(res)
  if (!res.ok) {
    throw new ApiError(res.status, errorMessageFromBody(body, 'Request failed'), body)
  }
}

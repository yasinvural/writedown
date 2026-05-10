import { Router, type Request, type Response } from 'express'
import { AUTH_COOKIE_NAME, clearAuthCookie, setAuthCookie } from '../lib/authCookie'
import { clearShareAccessCookie } from '../lib/shareAccessCookie'
import * as authService from '../services/authService'
import { CREDENTIALS_ERROR, parseCredentials } from '../validation/authCredentials'

const router = Router()

router.get('/me', async (req: Request, res: Response) => {
  const raw = req.cookies?.[AUTH_COOKIE_NAME]
  const result = await authService.getSessionUser(raw)

  if (result.outcome === 'ok') {
    res.status(200).json({ user: result.user })
    return
  }

  if (result.outcome === 'anonymous') {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  if (result.outcome === 'invalid_session') {
    clearAuthCookie(res)
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  console.error('getSessionUser failed', result.cause)
  res.status(500).json({ error: 'Internal server error' })
})

router.post('/register', async (req: Request, res: Response) => {
  const parsed = parseCredentials(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: CREDENTIALS_ERROR })
    return
  }

  const result = await authService.registerUser(parsed.data)

  if (result.outcome === 'created') {
    res.status(201).json({ id: result.user.id, email: result.user.email })
    return
  }
  if (result.outcome === 'duplicate_email') {
    res.status(409).json({ error: 'Email already registered' })
    return
  }

  console.error('register failed', result.cause)
  res.status(500).json({ error: 'Internal server error' })
})

router.post('/login', async (req: Request, res: Response) => {
  const parsed = parseCredentials(req.body)
  if (!parsed.ok) {
    res.status(400).json({ error: CREDENTIALS_ERROR })
    return
  }

  const result = await authService.loginUser(parsed.data)

  if (result.outcome === 'ok') {
    setAuthCookie(res, result.token)
    res.status(200).json({ ok: true })
    return
  }
  if (result.outcome === 'invalid_credentials') {
    res.status(401).json({ error: 'Invalid email or password' })
    return
  }
  if (result.outcome === 'jwt_misconfigured') {
    console.error('login failed: JWT_SECRET missing or invalid')
    res.status(500).json({ error: 'Authentication is not configured' })
    return
  }

  console.error('login failed', result.cause)
  res.status(500).json({ error: 'Internal server error' })
})

router.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res)
  clearShareAccessCookie(res)
  res.status(200).json({ ok: true })
})

export { router as authRouter }

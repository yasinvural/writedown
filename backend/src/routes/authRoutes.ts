import { Router, type Request, type Response } from 'express'
import * as authService from '../services/authService'
import { CREDENTIALS_ERROR, parseCredentials } from '../validation/authCredentials'

const router = Router()

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
    res.status(200).json({ token: result.token })
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

export { router as authRouter }

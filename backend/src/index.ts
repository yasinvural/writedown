import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { authRouter } from './routes/authRoutes'
import { prisma } from './prisma'

const app = express()
const port = Number(process.env.PORT) || 3000
const host = '0.0.0.0'

const corsOrigin = process.env.CORS_ORIGIN?.trim() || 'http://localhost:5173'

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(express.json({ limit: '32kb' }))

app.get('/', (_req, res) => {
  res.status(200).send('ok')
})

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.get('/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.status(200).json({ status: 'ok', database: 'connected' })
  } catch (err) {
    console.error('database health check failed', err)
    res.status(503).json({ status: 'error', database: 'disconnected' })
  }
})

app.use('/auth', authRouter)

app.use(
  (err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'Invalid JSON body' })
      return
    }
    next(err)
  },
)

const server = app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`)
})

function shutdown(signal: string) {
  console.log(`received ${signal}, shutting down`)
  server.close(() => {
    prisma
      .$disconnect()
      .then(() => process.exit(0))
      .catch((err: unknown) => {
        console.error(err)
        process.exit(1)
      })
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

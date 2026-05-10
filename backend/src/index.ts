import express from 'express'
import { prisma } from './prisma'

const app = express()
const port = Number(process.env.PORT) || 3000
const host = '0.0.0.0'

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

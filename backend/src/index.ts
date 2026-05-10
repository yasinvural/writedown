import express from 'express'

const app = express()
const port = Number(process.env.PORT) || 3000
const host = '0.0.0.0'

app.get('/', (_req, res) => {
  res.status(200).send('ok')
})

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`)
})

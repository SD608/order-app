const express = require('express')
const cors = require('cors')
const { checkDatabaseConnection } = require('./db')
const apiRouter = require('./api')

const app = express()

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173'

app.use(cors({ origin: clientOrigin }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'cozy-server',
    timestamp: new Date().toISOString(),
  })
})

app.get('/health/db', async (_req, res) => {
  try {
    const database = await checkDatabaseConnection()
    res.status(200).json({ status: 'ok', database })
  } catch (error) {
    console.error('Database health check failed:', error.message)
    res.status(503).json({
      status: 'error',
      message: '데이터베이스에 연결할 수 없습니다.',
    })
  }
})

app.use('/api', apiRouter)

app.get('/api', (_req, res) => {
  res.status(200).json({
    name: 'COZY Coffee Order API',
    version: '1.0.0',
  })
})

app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: '요청한 리소스를 찾을 수 없습니다.',
    },
  })
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(error.status || 500).json({
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.status ? error.message : '서버에서 오류가 발생했습니다.',
    },
  })
})

module.exports = app

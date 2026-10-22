require('dotenv').config()

const app = require('./app')
const { checkDatabaseConnection, initializeDatabase } = require('./db')

const port = Number(process.env.PORT) || 4000

async function startServer() {
  try {
    const database = await checkDatabaseConnection()
    await initializeDatabase()
    console.log(`PostgreSQL connected: ${database.database}`)

    app.listen(port, () => {
      console.log(`COZY server is running at http://127.0.0.1:${port}`)
    })
  } catch (error) {
    console.error('PostgreSQL connection failed:', error.message)
    process.exitCode = 1
  }
}

startServer()

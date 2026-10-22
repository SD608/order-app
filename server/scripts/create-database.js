require('dotenv').config()

const { Client } = require('pg')

const databaseName = process.env.DB_NAME
const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: 'postgres',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function createDatabase() {
  await client.connect()
  const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName])

  if (result.rowCount === 0) {
    const safeName = databaseName.replace(/"/g, '""')
    await client.query(`CREATE DATABASE "${safeName}"`)
    console.log(`Database created: ${databaseName}`)
  } else {
    console.log(`Database already exists: ${databaseName}`)
  }
}

createDatabase()
  .catch((error) => {
    console.error('Database setup failed:', error.message)
    process.exitCode = 1
  })
  .finally(() => client.end())

const test = require('node:test')
const assert = require('node:assert/strict')

const originalPassword = process.env.ADMIN_PASSWORD
const originalSecret = process.env.ADMIN_SESSION_SECRET
const testPassword = 'test-admin-password-2026'
const testSecret = 'test-admin-session-secret-with-more-than-32-characters'
process.env.ADMIN_PASSWORD = testPassword
process.env.ADMIN_SESSION_SECRET = testSecret

const app = require('./app')
const { pool } = require('./db')

test('admin API requires a configured password and a valid signed token', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
  })
  const address = server.address()
  const baseUrl = `http://127.0.0.1:${address.port}`
  const originalQuery = pool.query

  try {
    delete process.env.ADMIN_PASSWORD
    const unconfigured = await fetch(`${baseUrl}/api/admin/dashboard`)
    assert.equal(unconfigured.status, 503)

    process.env.ADMIN_PASSWORD = testPassword
    const wrongPassword = await fetch(`${baseUrl}/api/admin/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' }),
    })
    assert.equal(wrongPassword.status, 401)

    const unauthorized = await fetch(`${baseUrl}/api/admin/dashboard`)
    assert.equal(unauthorized.status, 401)

    const login = await fetch(`${baseUrl}/api/admin/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: testPassword }),
    })
    assert.equal(login.status, 200)
    const { token } = await login.json()
    assert.equal(typeof token, 'string')

    pool.query = async () => ({
      rows: [{ total: 0, received: 0, making: 0, complete: 0, updatedAt: new Date().toISOString() }],
    })
    const authorized = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(authorized.status, 200)
    assert.equal((await authorized.json()).dashboard.total, 0)
  } finally {
    pool.query = originalQuery
    if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD
    else process.env.ADMIN_PASSWORD = originalPassword
    if (originalSecret === undefined) delete process.env.ADMIN_SESSION_SECRET
    else process.env.ADMIN_SESSION_SECRET = originalSecret
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})

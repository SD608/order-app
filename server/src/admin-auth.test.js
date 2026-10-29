const test = require('node:test')
const assert = require('node:assert/strict')
const { createAdminToken, isAdminAuthConfigured, safeCompare, verifyAdminToken } = require('./admin-auth')

const secret = 'a-secure-session-secret-that-is-at-least-32-characters'

test('requires a strong admin password and session secret', () => {
  assert.equal(isAdminAuthConfigured('sixteen-char-pass', secret), true)
  assert.equal(isAdminAuthConfigured('short', secret), false)
  assert.equal(isAdminAuthConfigured('sixteen-char-pass', 'short'), false)
})

test('compares credentials safely without accepting different values', () => {
  assert.equal(safeCompare('correct-password', 'correct-password'), true)
  assert.equal(safeCompare('correct-password', 'incorrect-password'), false)
  assert.equal(safeCompare('short', 'longer'), false)
})

test('accepts a signed admin token before expiry', () => {
  const now = Date.UTC(2026, 0, 1)
  const token = createAdminToken(secret, now)

  assert.equal(verifyAdminToken(token, secret, now), true)
})

test('rejects expired, modified, and differently signed admin tokens', () => {
  const now = Date.UTC(2026, 0, 1)
  const token = createAdminToken(secret, now)

  assert.equal(verifyAdminToken(token, secret, now + 8 * 60 * 60 * 1000), false)
  assert.equal(verifyAdminToken(`${token}x`, secret, now), false)
  assert.equal(verifyAdminToken(token, `${secret}-different`, now), false)
  assert.equal(verifyAdminToken('not-a-token', secret, now), false)
})

const crypto = require('node:crypto')

const ADMIN_TOKEN_LIFETIME_SECONDS = 8 * 60 * 60

function isAdminAuthConfigured(password, secret) {
  return typeof password === 'string'
    && password.length >= 16
    && typeof secret === 'string'
    && secret.length >= 32
}

function safeCompare(actual, expected) {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(actualBuffer, expectedBuffer)
}

function createAdminToken(secret, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + ADMIN_TOKEN_LIFETIME_SECONDS
  const payload = `${expiresAt}.${crypto.randomBytes(16).toString('hex')}`
  const encodedPayload = Buffer.from(payload).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url')
  return `${encodedPayload}.${signature}`
}

function verifyAdminToken(token, secret, now = Date.now()) {
  if (typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 2 || !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return false

  const [encodedPayload, signature] = parts
  const expectedSignature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url')
  if (!safeCompare(signature, expectedSignature)) return false

  const payload = Buffer.from(encodedPayload, 'base64url').toString()
  const match = /^(\d{10})\.([a-f0-9]{32})$/.exec(payload)
  return Boolean(match) && Number(match[1]) > Math.floor(now / 1000)
}

module.exports = {
  ADMIN_TOKEN_LIFETIME_SECONDS,
  createAdminToken,
  isAdminAuthConfigured,
  safeCompare,
  verifyAdminToken,
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:4000/api' : '')

if (!API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL must be configured for production.')
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.error?.message || body.message || '요청을 처리하지 못했습니다.')
    error.code = body.error?.code
    error.status = response.status
    throw error
  }
  return body
}

export const api = {
  getMenus: () => request('/menus'),
  createOrder: (items, clientRequestId) => request('/orders', { method: 'POST', headers: { 'Idempotency-Key': clientRequestId }, body: JSON.stringify({ items, clientRequestId }) }),
  loginAdmin: (password) => request('/admin/session', { method: 'POST', body: JSON.stringify({ password }) }),
  getDashboard: (token) => request('/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
  getInventory: (token) => request('/admin/inventory', { headers: { Authorization: `Bearer ${token}` } }),
  updateInventory: (menuId, delta, token) => request(`/admin/inventory/${menuId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ delta }) }),
  getOrders: (token) => request('/admin/orders', { headers: { Authorization: `Bearer ${token}` } }),
  updateOrderStatus: (orderId, status, token) => request(`/admin/orders/${orderId}/status`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }),
}

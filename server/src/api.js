const express = require('express')
const { pool } = require('./db')

const router = express.Router()
const ORDER_STATUSES = ['received', 'making', 'complete']

function apiError(message, status = 400, code = 'BAD_REQUEST') {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

async function getMenus(client = pool) {
  const result = await client.query(`
    SELECT m.id, m.name, m.description, m.price, m.visual, m.image_url AS "imageUrl",
           m.is_active AS "isActive", m.stock,
           COALESCE(json_agg(json_build_object('id', o.id, 'label', o.label, 'price', o.price)
             ORDER BY o.id) FILTER (WHERE o.id IS NOT NULL), '[]') AS options
    FROM menus m
    LEFT JOIN menu_options o ON o.menu_id = m.id
    WHERE m.is_active = TRUE
    GROUP BY m.id
    ORDER BY m.id
  `)
  return result.rows
}

async function getOrders(client = pool) {
  const result = await client.query(`
    SELECT o.id, o.status, o.total, o.created_at AS "createdAt", o.updated_at AS "updatedAt",
      COALESCE(json_agg(json_build_object(
        'menuId', oi.menu_id, 'name', oi.menu_name, 'quantity', oi.quantity,
        'unitPrice', oi.unit_price, 'lineTotal', oi.line_total,
        'options', COALESCE((SELECT json_agg(json_build_object('id', io.option_id, 'label', io.label, 'price', io.price)
          ORDER BY io.option_id) FROM order_item_options io WHERE io.order_item_id = oi.id), '[]')
      ) ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `)
  return result.rows
}

router.get('/menus', async (_req, res, next) => {
  try { res.json({ menus: await getMenus() }) } catch (error) { next(error) }
})

router.post('/orders', async (req, res, next) => {
  const { items, clientRequestId } = req.body || {}
  if (!Array.isArray(items) || items.length === 0) return next(apiError('주문 항목이 필요합니다.'))

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (clientRequestId) {
      const existing = await client.query('SELECT id FROM orders WHERE client_request_id = $1', [clientRequestId])
      if (existing.rowCount > 0) {
        await client.query('COMMIT')
        const orders = await getOrders()
        return res.status(200).json({ order: orders.find((order) => String(order.id) === String(existing.rows[0].id)) })
      }
    }

    const normalized = []
    for (const item of items) {
      const quantity = Number(item.quantity)
      if (!item.menuId || !Number.isInteger(quantity) || quantity < 1) throw apiError('주문 수량이 올바르지 않습니다.')
      const menuResult = await client.query('SELECT * FROM menus WHERE id = $1 AND is_active = TRUE FOR UPDATE', [item.menuId])
      if (menuResult.rowCount === 0) throw apiError('주문할 수 없는 메뉴가 포함되어 있습니다.', 409, 'MENU_UNAVAILABLE')
      const menu = menuResult.rows[0]
      if (menu.stock < quantity) throw apiError(`${menu.name}의 재고가 부족합니다.`, 409, 'INSUFFICIENT_STOCK')

      const optionIds = [...new Set(Array.isArray(item.optionIds) ? item.optionIds : [])]
      const optionResult = optionIds.length > 0
        ? await client.query('SELECT id, label, price FROM menu_options WHERE menu_id = $1 AND id = ANY($2::text[])', [item.menuId, optionIds])
        : { rows: [] }
      if (optionResult.rows.length !== optionIds.length) throw apiError('선택한 옵션을 확인할 수 없습니다.', 409, 'OPTION_UNAVAILABLE')
      const unitPrice = menu.price + optionResult.rows.reduce((sum, option) => sum + option.price, 0)
      normalized.push({ menu, quantity, options: optionResult.rows, unitPrice, lineTotal: unitPrice * quantity })
      await client.query('UPDATE menus SET stock = stock - $1, updated_at = NOW() WHERE id = $2', [quantity, item.menuId])
    }

    const total = normalized.reduce((sum, item) => sum + item.lineTotal, 0)
    const orderResult = await client.query(
      'INSERT INTO orders (client_request_id, total) VALUES ($1, $2) RETURNING id', [clientRequestId || null, total],
    )
    const orderId = orderResult.rows[0].id
    for (const item of normalized) {
      const itemResult = await client.query(
        `INSERT INTO order_items (order_id, menu_id, menu_name, base_price, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [orderId, item.menu.id, item.menu.name, item.menu.price, item.quantity, item.unitPrice, item.lineTotal],
      )
      for (const option of item.options) {
        await client.query(
          'INSERT INTO order_item_options (order_item_id, option_id, label, price) VALUES ($1, $2, $3, $4)',
          [itemResult.rows[0].id, option.id, option.label, option.price],
        )
      }
    }
    await client.query('COMMIT')
    const orders = await getOrders()
    res.status(201).json({ order: orders.find((order) => String(order.id) === String(orderId)) })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally { client.release() }
})

router.get('/admin/dashboard', async (_req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'received')::int AS received,
        COUNT(*) FILTER (WHERE status = 'making')::int AS making,
        COUNT(*) FILTER (WHERE status = 'complete')::int AS complete,
        NOW() AS "updatedAt"
      FROM orders
    `)
    res.json({ dashboard: result.rows[0] })
  } catch (error) { next(error) }
})

router.get('/admin/inventory', async (_req, res, next) => {
  try { res.json({ inventory: await getMenus() }) } catch (error) { next(error) }
})

router.patch('/admin/inventory/:menuId', async (req, res, next) => {
  const delta = Number(req.body?.delta)
  if (!Number.isInteger(delta) || delta === 0) return next(apiError('재고 변경량은 0이 아닌 정수여야 합니다.'))
  try {
    const result = await pool.query(
      `UPDATE menus SET stock = GREATEST(0, stock + $1), updated_at = NOW()
       WHERE id = $2 AND is_active = TRUE RETURNING id, stock`, [delta, req.params.menuId],
    )
    if (result.rowCount === 0) throw apiError('메뉴를 찾을 수 없습니다.', 404, 'MENU_NOT_FOUND')
    res.json({ menuId: result.rows[0].id, stock: result.rows[0].stock })
  } catch (error) { next(error) }
})

router.get('/admin/orders', async (_req, res, next) => {
  try { res.json({ orders: await getOrders() }) } catch (error) { next(error) }
})

router.patch('/admin/orders/:orderId/status', async (req, res, next) => {
  const nextStatus = req.body?.status
  if (!ORDER_STATUSES.includes(nextStatus)) return next(apiError('유효하지 않은 주문 상태입니다.'))
  try {
    const result = await pool.query('SELECT status FROM orders WHERE id = $1', [req.params.orderId])
    if (result.rowCount === 0) throw apiError('주문을 찾을 수 없습니다.', 404, 'ORDER_NOT_FOUND')
    const currentStatus = result.rows[0].status
    const valid = (currentStatus === 'received' && nextStatus === 'making') || (currentStatus === 'making' && nextStatus === 'complete')
    if (!valid) throw apiError('주문 상태는 다음 단계로만 변경할 수 있습니다.', 409, 'INVALID_STATUS_TRANSITION')
    await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [nextStatus, req.params.orderId])
    const orders = await getOrders()
    res.json({ order: orders.find((order) => String(order.id) === String(req.params.orderId)) })
  } catch (error) { next(error) }
})

module.exports = router

export const ORDER_STATUSES = {
  RECEIVED: 'received',
  MAKING: 'making',
  COMPLETE: 'complete',
}

export const getStockState = (quantity) => {
  if (quantity === 0) return { label: '품절', className: 'sold-out' }
  if (quantity < 5) return { label: '주의', className: 'warning' }
  return { label: '정상', className: 'normal' }
}

export const canChangeOrderStatus = (currentStatus, nextStatus) => (
  (currentStatus === ORDER_STATUSES.RECEIVED && nextStatus === ORDER_STATUSES.MAKING)
  || (currentStatus === ORDER_STATUSES.MAKING && nextStatus === ORDER_STATUSES.COMPLETE)
)

export const canPlaceOrder = (cart, inventory) => cart.every((item) => (
  item.quantity > 0 && (inventory[item.menuId] ?? 0) >= item.quantity
))

export const calculateInventoryAfterCompletion = (inventory, order) => {
  const nextInventory = { ...inventory }
  order.items.forEach((item) => {
    if (item.menuId && nextInventory[item.menuId] !== undefined) {
      nextInventory[item.menuId] = Math.max(0, nextInventory[item.menuId] - item.quantity)
    }
  })
  return nextInventory
}

export const orderCounts = (orders) => ({
  total: orders.length,
  received: orders.filter((order) => order.status === ORDER_STATUSES.RECEIVED).length,
  making: orders.filter((order) => order.status === ORDER_STATUSES.MAKING).length,
  complete: orders.filter((order) => order.status === ORDER_STATUSES.COMPLETE).length,
})

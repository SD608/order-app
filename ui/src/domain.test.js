import test from 'node:test'
import assert from 'node:assert/strict'
import { ORDER_STATUSES, calculateInventoryAfterCompletion, canChangeOrderStatus, canPlaceOrder, getStockState, orderCounts } from './domain.js'

test('재고 상태를 수량에 따라 계산한다', () => {
  assert.equal(getStockState(10).label, '정상')
  assert.equal(getStockState(4).label, '주의')
  assert.equal(getStockState(0).label, '품절')
})

test('재고보다 많은 수량은 주문할 수 없다', () => {
  const cart = [{ menuId: 'coffee', quantity: 2 }]
  assert.equal(canPlaceOrder(cart, { coffee: 2 }), true)
  assert.equal(canPlaceOrder(cart, { coffee: 1 }), false)
})

test('주문 상태는 순서대로만 변경할 수 있다', () => {
  assert.equal(canChangeOrderStatus(ORDER_STATUSES.RECEIVED, ORDER_STATUSES.MAKING), true)
  assert.equal(canChangeOrderStatus(ORDER_STATUSES.MAKING, ORDER_STATUSES.COMPLETE), true)
  assert.equal(canChangeOrderStatus(ORDER_STATUSES.RECEIVED, ORDER_STATUSES.COMPLETE), false)
  assert.equal(canChangeOrderStatus(ORDER_STATUSES.COMPLETE, ORDER_STATUSES.MAKING), false)
})

test('제조 완료 시 주문 수량만큼 재고를 차감한다', () => {
  const inventory = { coffee: 5 }
  const order = { items: [{ menuId: 'coffee', quantity: 2 }] }
  assert.deepEqual(calculateInventoryAfterCompletion(inventory, order), { coffee: 3 })
})

test('대시보드 주문 상태별 집계를 계산한다', () => {
  const orders = [{ status: 'received' }, { status: 'making' }, { status: 'complete' }, { status: 'received' }]
  assert.deepEqual(orderCounts(orders), { total: 4, received: 2, making: 1, complete: 1 })
})

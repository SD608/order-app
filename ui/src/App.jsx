import { useMemo, useState } from 'react'
import './App.css'

const menus = [
  { id: 'americano-ice', name: '아메리카노(ICE)', price: 4000, description: '깔끔하고 시원한 산미의 아이스 아메리카노', visual: 'ice' },
  { id: 'americano-hot', name: '아메리카노(HOT)', price: 4000, description: '깊고 고소한 향을 담은 따뜻한 아메리카노', visual: 'hot' },
  { id: 'cafe-latte', name: '카페라떼', price: 5000, description: '부드러운 우유와 에스프레소의 조화', visual: 'latte' },
  { id: 'vanilla-latte', name: '바닐라라떼', price: 5500, description: '은은한 바닐라 향을 더한 달콤한 라떼', visual: 'vanilla' },
]

const options = [{ id: 'shot', label: '샷 추가', price: 500 }, { id: 'syrup', label: '시럽 추가', price: 0 }]
const formatPrice = (price) => `${price.toLocaleString('ko-KR')}원`
const formatDate = (date) => new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))

function CoffeeVisual({ type }) {
  return <div className={`coffee-visual coffee-visual--${type}`} aria-hidden="true"><span className="coffee-steam coffee-steam--one" /><span className="coffee-steam coffee-steam--two" /><div className="coffee-cup"><span className="coffee-liquid" /><span className="coffee-foam" /></div><span className="coffee-handle" /><span className="coffee-shadow" /></div>
}

function MenuCard({ menu, onAdd }) {
  const [selectedOptions, setSelectedOptions] = useState([])
  const menuPrice = menu.price + selectedOptions.reduce((sum, id) => sum + (options.find((item) => item.id === id)?.price ?? 0), 0)
  const toggleOption = (optionId) => setSelectedOptions((current) => current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId])

  return <article className="menu-card"><CoffeeVisual type={menu.visual} /><div className="menu-card__body"><div className="menu-card__heading"><h2>{menu.name}</h2><strong>{formatPrice(menu.price)}</strong></div><p className="menu-card__description">{menu.description}</p><div className="menu-card__options" aria-label={`${menu.name} 옵션`}>{options.map((option) => <label className="option-row" key={option.id}><input type="checkbox" checked={selectedOptions.includes(option.id)} onChange={() => toggleOption(option.id)} /><span>{option.label}</span><small>{option.price ? `+${formatPrice(option.price)}` : '+0원'}</small></label>)}</div><div className="menu-card__footer"><span className="menu-card__selected-price">{formatPrice(menuPrice)}</span><button className="button button--primary button--full" type="button" onClick={() => onAdd(menu, selectedOptions)}>담기</button></div></div></article>
}

function CartItem({ item, onQuantityChange, onRemove }) {
  return <li className="cart-item"><div className="cart-item__info"><strong>{item.name}</strong>{item.optionLabels.length > 0 && <span className="cart-item__options">{item.optionLabels.join(' · ')}</span>}</div><div className="cart-item__controls"><div className="quantity-control" aria-label={`${item.name} 수량 조절`}><button type="button" onClick={() => onQuantityChange(item.key, -1)} aria-label="수량 줄이기">−</button><span>{item.quantity}</span><button type="button" onClick={() => onQuantityChange(item.key, 1)} aria-label="수량 늘리기">+</button></div><strong className="cart-item__price">{formatPrice(item.unitPrice * item.quantity)}</strong><button className="remove-button" type="button" onClick={() => onRemove(item.key)} aria-label={`${item.name} 삭제`}>×</button></div></li>
}

function StatusBadge({ status }) {
  const labels = { received: '주문 접수', making: '제조 중', complete: '제조 완료' }
  return <span className={`status-badge status-badge--${status}`}>{labels[status]}</span>
}

function AdminScreen({ inventory, onInventoryChange, orders, onOrderStatusChange }) {
  const counts = useMemo(() => ({ total: orders.length, received: orders.filter((order) => order.status === 'received').length, making: orders.filter((order) => order.status === 'making').length, complete: orders.filter((order) => order.status === 'complete').length }), [orders])
  const getStockState = (quantity) => quantity === 0 ? { label: '품절', className: 'sold-out' } : quantity < 5 ? { label: '주의', className: 'warning' } : { label: '정상', className: 'normal' }

  return <main className="page-content admin-page"><section className="admin-intro"><div><p className="eyebrow">COZY MANAGEMENT</p><h1>관리자 <span>대시보드</span></h1></div><p className="admin-intro__description">오늘의 매장 운영 현황을<br />한눈에 확인하고 관리하세요.</p></section>
    <section className="admin-section dashboard-section" aria-labelledby="dashboard-title"><div className="admin-section__heading"><div><p className="eyebrow">OVERVIEW</p><h2 id="dashboard-title">관리자 대시보드</h2></div><span className="updated-time">방금 전 업데이트</span></div><div className="dashboard-grid"><div className="dashboard-card dashboard-card--total"><span className="dashboard-card__label">총 주문</span><strong>{counts.total}<small>건</small></strong><span className="dashboard-card__hint">전체 주문</span></div><div className="dashboard-card dashboard-card--received"><span className="dashboard-card__label">주문 접수</span><strong>{counts.received}<small>건</small></strong><span className="dashboard-card__hint">확인 대기 중</span></div><div className="dashboard-card dashboard-card--making"><span className="dashboard-card__label">제조 중</span><strong>{counts.making}<small>건</small></strong><span className="dashboard-card__hint">준비 중인 주문</span></div><div className="dashboard-card dashboard-card--complete"><span className="dashboard-card__label">제조 완료</span><strong>{counts.complete}<small>건</small></strong><span className="dashboard-card__hint">완료된 주문</span></div></div></section>
    <section className="admin-section inventory-section" aria-labelledby="inventory-title"><div className="admin-section__heading"><div><p className="eyebrow">INVENTORY</p><h2 id="inventory-title">재고 현황</h2></div><span className="section-caption">메뉴별 현재 재고</span></div><div className="inventory-grid">{menus.map((menu) => { const stock = inventory[menu.id]; const state = getStockState(stock); return <article className="inventory-card" key={menu.id}><div className={`inventory-card__visual inventory-card__visual--${menu.visual}`}><span>☕</span></div><div className="inventory-card__main"><div className="inventory-card__title"><h3>{menu.name}</h3></div><div className="inventory-card__stock-line"><div className="inventory-card__quantity"><strong>{stock}</strong><span>개</span></div><span className={`stock-state stock-state--${state.className}`}><i />{state.label}</span></div><div className="inventory-card__controls"><button type="button" onClick={() => onInventoryChange(menu.id, -1)} disabled={stock === 0} aria-label={`${menu.name} 재고 줄이기`}>−</button><span>재고 조정</span><button type="button" onClick={() => onInventoryChange(menu.id, 1)} aria-label={`${menu.name} 재고 늘리기`}>+</button></div></div></article> })}</div></section>
    <section className="admin-section orders-section" aria-labelledby="orders-title"><div className="admin-section__heading"><div><p className="eyebrow">ORDERS</p><h2 id="orders-title">주문 현황</h2></div><span className="section-caption">최신 주문순</span></div>{orders.length === 0 ? <div className="admin-empty">현재 접수된 주문이 없습니다.</div> : <div className="orders-table-wrap"><div className="orders-table orders-table--header"><span>주문 일시</span><span>주문 메뉴</span><span>금액</span><span>상태</span><span>관리</span></div>{orders.map((order) => <div className="orders-table" key={order.id}><span className="order-date">{formatDate(order.createdAt)}</span><span className="order-menu">{order.items.map((item) => <strong key={item.name}>{item.name} <small>× {item.quantity}</small></strong>)}</span><strong className="order-total">{formatPrice(order.total)}</strong><StatusBadge status={order.status} /><span>{order.status === 'received' ? <button className="button button--primary order-action" type="button" onClick={() => onOrderStatusChange(order.id, 'making')}>제조 시작</button> : order.status === 'making' ? <button className="button button--secondary order-action" type="button" onClick={() => onOrderStatusChange(order.id, 'complete')}>제조 완료</button> : <span className="order-done">완료됨</span>}</span></div>)}</div>}</section>
  </main>
}

function App() {
  const [view, setView] = useState('order')
  const [cart, setCart] = useState([])
  const [notice, setNotice] = useState('')
  const [inventory, setInventory] = useState({ 'americano-ice': 10, 'americano-hot': 7, 'cafe-latte': 4, 'vanilla-latte': 0 })
  const [orders, setOrders] = useState([{ id: 'order-1', createdAt: '2026-10-15T13:00:00', items: [{ menuId: 'americano-ice', name: '아메리카노(ICE)', quantity: 1 }], total: 4500, status: 'received' }, { id: 'order-2', createdAt: '2026-10-15T12:42:00', items: [{ menuId: 'cafe-latte', name: '카페라떼', quantity: 2 }], total: 10000, status: 'making' }, { id: 'order-3', createdAt: '2026-10-15T12:10:00', items: [{ menuId: 'americano-hot', name: '아메리카노(HOT)', quantity: 1 }], total: 4000, status: 'complete' }])
  const totalPrice = useMemo(() => cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0), [cart])
  const totalQuantity = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart])
  const showNotice = (message) => { setNotice(message); window.setTimeout(() => setNotice(''), 2400) }
  const addToCart = (menu, selectedOptionIds) => { const selected = options.filter((option) => selectedOptionIds.includes(option.id)); const key = `${menu.id}-${[...selectedOptionIds].sort().join('-') || 'plain'}`; const item = { key, menuId: menu.id, name: menu.name, optionLabels: selected.map((option) => option.label), unitPrice: menu.price + selected.reduce((sum, option) => sum + option.price, 0), quantity: 1 }; setCart((current) => { const existing = current.find((cartItem) => cartItem.key === key); return existing ? current.map((cartItem) => cartItem.key === key ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem) : [...current, item] }); showNotice(`${menu.name}을(를) 장바구니에 담았습니다.`) }
  const changeQuantity = (key, amount) => setCart((current) => current.map((item) => item.key === key ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0))
  const removeItem = (key) => setCart((current) => current.filter((item) => item.key !== key))
  const placeOrder = () => { if (cart.length === 0) return; setOrders((current) => [{ id: `order-${Date.now()}`, createdAt: new Date().toISOString(), items: cart.map((item) => ({ menuId: item.menuId, name: item.name, quantity: item.quantity })), total: totalPrice, status: 'received' }, ...current]); setCart([]); showNotice('주문이 접수되었습니다. 맛있게 준비할게요!') }
  const changeInventory = (menuId, amount) => setInventory((current) => ({ ...current, [menuId]: Math.max(0, current[menuId] + amount) }))
  const changeOrderStatus = (orderId, status) => {
    setOrders((current) => {
      const target = current.find((order) => order.id === orderId)
      if (!target || target.status === 'complete') return current

      if (status === 'complete') {
        setInventory((currentInventory) => {
          const nextInventory = { ...currentInventory }
          target.items.forEach((item) => {
            if (item.menuId && nextInventory[item.menuId] !== undefined) {
              nextInventory[item.menuId] = Math.max(0, nextInventory[item.menuId] - item.quantity)
            }
          })
          return nextInventory
        })
      }

      return current.map((order) => order.id === orderId ? { ...order, status } : order)
    })
  }

  return <div className="app-shell"><header className="site-header"><button className="brand brand-button" type="button" onClick={() => setView('order')} aria-label="COZY 주문 화면">COZY</button><nav className="site-nav" aria-label="주요 메뉴"><button className={`site-nav__link ${view === 'order' ? 'site-nav__link--active' : ''}`} type="button" onClick={() => setView('order')}>주문하기</button><button className={`site-nav__link ${view === 'admin' ? 'site-nav__link--active' : ''}`} type="button" onClick={() => setView('admin')}>관리자</button></nav></header>{view === 'admin' ? <AdminScreen inventory={inventory} onInventoryChange={changeInventory} orders={orders} onOrderStatusChange={changeOrderStatus} /> : <main id="order" className="page-content"><section className="hero-copy" aria-labelledby="page-title"><div><p className="eyebrow">COZY COFFEE BAR</p><h1 id="page-title">오늘의 커피를<br /><span>편안하게</span> 주문하세요</h1></div><p className="hero-copy__description">신선하게 준비한 커피와 함께<br />당신의 하루를 시작해보세요.</p></section><section className="menu-section" aria-labelledby="menu-title"><div className="section-heading"><div><p className="eyebrow">OUR MENU</p><h2 id="menu-title">커피 메뉴</h2></div><span className="menu-count">{menus.length}개의 메뉴</span></div><div className="menu-grid">{menus.map((menu) => <MenuCard key={menu.id} menu={menu} onAdd={addToCart} />)}</div></section><section className="cart-section" aria-labelledby="cart-title"><div className="cart-heading"><div><p className="eyebrow">YOUR ORDER</p><h2 id="cart-title">장바구니 <span>{totalQuantity}</span></h2></div>{cart.length > 0 && <span className="cart-status">총 {cart.length}개 메뉴</span>}</div>{cart.length === 0 ? <div className="cart-empty"><div className="cart-empty__icon">☕</div><p>아직 담긴 메뉴가 없어요.</p><span>마음에 드는 커피를 장바구니에 담아보세요.</span></div> : <div className="cart-content"><ul className="cart-list">{cart.map((item) => <CartItem key={item.key} item={item} onQuantityChange={changeQuantity} onRemove={removeItem} />)}</ul><div className="cart-summary"><div className="summary-row"><span>주문 금액</span><strong>{formatPrice(totalPrice)}</strong></div><div className="summary-row summary-row--total"><span>총 금액</span><strong>{formatPrice(totalPrice)}</strong></div><button className="button button--primary order-button" type="button" onClick={placeOrder}>주문하기</button></div></div>}</section></main>}{notice && <div className="toast" role="status">{notice}</div>}<footer className="site-footer">COZY COFFEE BAR · 좋은 커피, 편안한 순간</footer></div>
}

export default App

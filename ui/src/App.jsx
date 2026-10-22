import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { api } from './api'
import { ORDER_STATUSES, getStockState, orderCounts } from './domain'
import americanoHotImage from './assets/menu/americano-hot.png'
import americanoIceImage from './assets/menu/americano-ice.png'
import cafeLatteImage from './assets/menu/cafe-latte.png'
import vanillaLatteImage from './assets/menu/vanilla-latte.png'

const formatPrice = (price) => `${Number(price).toLocaleString('ko-KR')}원`
const formatDate = (date) => new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
const menuImages = {
  'americano-hot': americanoHotImage,
  'americano-ice': americanoIceImage,
  'cafe-latte': cafeLatteImage,
  'vanilla-latte': vanillaLatteImage,
}

function CoffeeVisual({ type }) {
  return <div className={`coffee-visual coffee-visual--${type}`} aria-hidden="true"><span className="coffee-steam coffee-steam--one" /><span className="coffee-steam coffee-steam--two" /><div className="coffee-cup"><span className="coffee-liquid" /><span className="coffee-foam" /></div><span className="coffee-handle" /><span className="coffee-shadow" /></div>
}

function MenuCard({ menu, onAdd }) {
  const [selectedOptions, setSelectedOptions] = useState([])
  const menuPrice = menu.price + selectedOptions.reduce((sum, id) => sum + (menu.options.find((option) => option.id === id)?.price ?? 0), 0)
  const unavailable = !menu.isActive || menu.stock === 0
  const toggleOption = (id) => setSelectedOptions((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  return <article className="menu-card">{menuImages[menu.id] ? <img className="menu-card__image" src={menuImages[menu.id]} alt={`${menu.name} 이미지`} /> : <CoffeeVisual type={menu.visual} />}<div className="menu-card__body"><div className="menu-card__heading"><h2>{menu.name}</h2><strong>{formatPrice(menu.price)}</strong></div><p className="menu-card__description">{menu.description}</p><div className="menu-card__options" aria-label={`${menu.name} 옵션`}>{menu.options.map((option) => <label className="option-row" key={option.id}><input type="checkbox" checked={selectedOptions.includes(option.id)} onChange={() => toggleOption(option.id)} disabled={unavailable} /><span>{option.label}</span><small>{option.price ? `+${formatPrice(option.price)}` : '+0원'}</small></label>)}</div><div className="menu-card__footer"><span className="menu-card__selected-price">{formatPrice(menuPrice)}</span><button className="button button--primary button--full" type="button" disabled={unavailable} onClick={() => onAdd(menu, selectedOptions)}>{unavailable ? '품절' : '담기'}</button></div></div></article>
}

function CartItem({ item, onQuantityChange, onRemove }) {
  return <li className="cart-item"><div className="cart-item__info"><strong>{item.name}</strong>{item.optionLabels.length > 0 && <span className="cart-item__options">{item.optionLabels.join(' · ')}</span>}</div><div className="cart-item__controls"><div className="quantity-control" aria-label={`${item.name} 수량 조절`}><button type="button" onClick={() => onQuantityChange(item.key, -1)} aria-label="수량 줄이기">−</button><span>{item.quantity}</span><button type="button" onClick={() => onQuantityChange(item.key, 1)} aria-label="수량 늘리기">+</button></div><strong className="cart-item__price">{formatPrice(item.unitPrice * item.quantity)}</strong><button className="remove-button" type="button" onClick={() => onRemove(item.key)} aria-label={`${item.name} 삭제`}>×</button></div></li>
}

function StatusBadge({ status }) {
  const labels = { received: '주문 접수', making: '제조 중', complete: '제조 완료' }
  return <span className={`status-badge status-badge--${status}`}>{labels[status]}</span>
}

function AdminScreen({ menus, inventory, orders, dashboard, onInventoryChange, onOrderStatusChange, busyKey }) {
  const counts = dashboard || orderCounts(orders)
  return <main className="page-content admin-page"><section className="admin-intro"><div><p className="eyebrow">COZY MANAGEMENT</p><h1>관리자 <span>대시보드</span></h1></div><p className="admin-intro__description">오늘의 매장 운영 현황을<br />한눈에 확인하고 관리하세요.</p></section>
    <section className="admin-section dashboard-section" aria-labelledby="dashboard-title"><div className="admin-section__heading"><div><p className="eyebrow">OVERVIEW</p><h2 id="dashboard-title">관리자 대시보드</h2></div><span className="updated-time">방금 전 업데이트</span></div><div className="dashboard-grid"><div className="dashboard-card dashboard-card--total"><span className="dashboard-card__label">총 주문</span><strong>{counts.total}<small>건</small></strong><span className="dashboard-card__hint">전체 주문</span></div><div className="dashboard-card dashboard-card--received"><span className="dashboard-card__label">주문 접수</span><strong>{counts.received}<small>건</small></strong><span className="dashboard-card__hint">확인 대기 중</span></div><div className="dashboard-card dashboard-card--making"><span className="dashboard-card__label">제조 중</span><strong>{counts.making}<small>건</small></strong><span className="dashboard-card__hint">준비 중인 주문</span></div><div className="dashboard-card dashboard-card--complete"><span className="dashboard-card__label">제조 완료</span><strong>{counts.complete}<small>건</small></strong><span className="dashboard-card__hint">완료된 주문</span></div></div></section>
    <section className="admin-section inventory-section" aria-labelledby="inventory-title"><div className="admin-section__heading"><div><p className="eyebrow">INVENTORY</p><h2 id="inventory-title">재고 현황</h2></div><span className="section-caption">데이터베이스 기준 현재 재고</span></div><div className="inventory-grid">{inventory.map((stockItem) => { const menu = menus.find((item) => item.id === stockItem.id) || stockItem; const stock = Number(stockItem.stock) || 0; const state = getStockState(stock); return <article className="inventory-card" key={stockItem.id}><div className="inventory-card__main"><div className="inventory-card__title"><h3>{menu.name}</h3></div><div className="inventory-card__stock-line"><div className="inventory-card__quantity"><strong className="inventory-card__stock-value">{stock}</strong><span>개</span></div><span className={`stock-state stock-state--${state.className}`}><i />{state.label}</span></div><div className="inventory-card__controls"><button type="button" onClick={() => onInventoryChange(stockItem.id, -1)} disabled={stock === 0 || busyKey === `inventory-${stockItem.id}`} aria-label={`${menu.name} 재고 줄이기`}>−</button><span>재고 조정</span><button type="button" onClick={() => onInventoryChange(stockItem.id, 1)} disabled={busyKey === `inventory-${stockItem.id}`} aria-label={`${menu.name} 재고 늘리기`}>+</button></div></div></article> })}</div></section>
    <section className="admin-section orders-section" aria-labelledby="orders-title"><div className="admin-section__heading"><div><p className="eyebrow">ORDERS</p><h2 id="orders-title">주문 현황</h2></div><span className="section-caption">최신 주문순</span></div>{orders.length === 0 ? <div className="admin-empty">현재 접수된 주문이 없습니다.</div> : <div className="orders-table-wrap"><div className="orders-table orders-table--header"><span>주문 일시</span><span>주문 메뉴</span><span>금액</span><span>상태</span><span>관리</span></div>{orders.map((order) => <div className="orders-table" key={order.id}><span className="order-date">{formatDate(order.createdAt)}</span><span className="order-menu">{order.items.map((item, index) => <strong key={`${item.menuId}-${index}`}>{item.name} <small>× {item.quantity}</small>{item.options?.length > 0 && <small> · {item.options.map((option) => option.label).join(', ')}</small>}</strong>)}</span><strong className="order-total">{formatPrice(order.total)}</strong><StatusBadge status={order.status} /><span>{order.status === ORDER_STATUSES.RECEIVED ? <button className="button button--primary order-action" type="button" disabled={busyKey === `order-${order.id}`} onClick={() => onOrderStatusChange(order.id, ORDER_STATUSES.MAKING)}>제조 시작</button> : order.status === ORDER_STATUSES.MAKING ? <button className="button button--secondary order-action" type="button" disabled={busyKey === `order-${order.id}`} onClick={() => onOrderStatusChange(order.id, ORDER_STATUSES.COMPLETE)}>제조 완료</button> : <span className="order-done">완료됨</span>}</span></div>)}</div>}</section>
  </main>
}

function App() {
  const [view, setView] = useState('order')
  const [menus, setMenus] = useState([])
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [cart, setCart] = useState([])
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyKey, setBusyKey] = useState('')
  const noticeTimer = useRef(null)
  const totalPrice = useMemo(() => cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0), [cart])
  const totalQuantity = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart])

  const refreshData = async () => {
    setError('')
    const [menuResult, inventoryResult, orderResult, dashboardResult] = await Promise.all([api.getMenus(), api.getInventory(), api.getOrders(), api.getDashboard()])
    setMenus(menuResult.menus)
    setInventory(inventoryResult.inventory)
    setOrders(orderResult.orders)
    setDashboard(dashboardResult.dashboard)
  }
  useEffect(() => { refreshData().catch((err) => setError(err.message)).finally(() => setLoading(false)); return () => window.clearTimeout(noticeTimer.current) }, [])
  const showNotice = (message) => { setNotice(message); window.clearTimeout(noticeTimer.current); noticeTimer.current = window.setTimeout(() => setNotice(''), 2400) }
  const addToCart = (menu, optionIds) => { const selected = menu.options.filter((option) => optionIds.includes(option.id)); const key = `${menu.id}-${[...optionIds].sort().join('-') || 'plain'}`; const item = { key, menuId: menu.id, name: menu.name, optionIds, optionLabels: selected.map((option) => option.label), unitPrice: menu.price + selected.reduce((sum, option) => sum + option.price, 0), quantity: 1 }; setCart((current) => { const existing = current.find((cartItem) => cartItem.key === key); return existing ? current.map((cartItem) => cartItem.key === key ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem) : [...current, item] }); showNotice(`${menu.name}을(를) 장바구니에 담았습니다.`) }
  const changeQuantity = (key, amount) => setCart((current) => current.map((item) => item.key === key ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0))
  const removeItem = (key) => setCart((current) => current.filter((item) => item.key !== key))
  const placeOrder = async () => { if (cart.length === 0 || busyKey === 'order-submit') return; if (!window.confirm(`총 ${formatPrice(totalPrice)}을(를) 주문할까요?`)) return; setBusyKey('order-submit'); try { const result = await api.createOrder(cart.map((item) => ({ menuId: item.menuId, optionIds: item.optionIds, quantity: item.quantity })), `order-${crypto.randomUUID()}`); setCart([]); await refreshData(); showNotice(`주문이 접수되었습니다. 주문번호 #${result.order.id}`) } catch (err) { showNotice(err.message) } finally { setBusyKey('') } }
  const changeInventory = async (menuId, delta) => { setBusyKey(`inventory-${menuId}`); try { await api.updateInventory(menuId, delta); await refreshData() } catch (err) { showNotice(err.message) } finally { setBusyKey('') } }
  const changeOrderStatus = async (orderId, status) => { setBusyKey(`order-${orderId}`); try { await api.updateOrderStatus(orderId, status); await refreshData() } catch (err) { showNotice(err.message) } finally { setBusyKey('') } }
  const retry = () => { setLoading(true); refreshData().catch((err) => setError(err.message)).finally(() => setLoading(false)) }

  if (loading) return <div className="app-shell"><div className="page-content"><div className="loading-state">메뉴와 주문 정보를 불러오는 중입니다.</div></div></div>
  if (error) return <div className="app-shell"><div className="page-content"><div className="error-state" role="alert"><p>{error}</p><button className="button button--primary" type="button" onClick={retry}>다시 시도</button></div></div></div>
  return <div className="app-shell"><header className="site-header"><button className="brand brand-button" type="button" onClick={() => setView('order')} aria-label="COZY 주문 화면">COZY</button><nav className="site-nav" aria-label="주요 메뉴"><button className={`site-nav__link ${view === 'order' ? 'site-nav__link--active' : ''}`} type="button" onClick={() => setView('order')}>주문하기</button><button className={`site-nav__link ${view === 'admin' ? 'site-nav__link--active' : ''}`} type="button" onClick={() => setView('admin')}>관리자</button></nav></header>{view === 'admin' ? <AdminScreen menus={menus} inventory={inventory} orders={orders} dashboard={dashboard} onInventoryChange={changeInventory} onOrderStatusChange={changeOrderStatus} busyKey={busyKey} /> : <main id="order" className="page-content"><section className="hero-copy" aria-labelledby="page-title"><div><p className="eyebrow">COZY COFFEE BAR</p><h1 id="page-title">오늘의 커피를<br /><span>편안하게</span> 주문하세요</h1></div><p className="hero-copy__description">신선하게 준비한 커피와 함께<br />당신의 하루를 시작해보세요.</p></section><section className="menu-section" aria-labelledby="menu-title"><div className="section-heading"><div><p className="eyebrow">OUR MENU</p><h2 id="menu-title">커피 메뉴</h2></div><span className="menu-count">{menus.length}개의 메뉴</span></div>{menus.length === 0 ? <div className="admin-empty">등록된 메뉴가 없습니다.</div> : <div className="menu-grid">{menus.map((menu) => <MenuCard key={menu.id} menu={menu} onAdd={addToCart} />)}</div>}</section><section className="cart-section" aria-labelledby="cart-title"><div className="cart-heading"><div><p className="eyebrow">YOUR ORDER</p><h2 id="cart-title">장바구니 <span>{totalQuantity}</span></h2></div>{cart.length > 0 && <span className="cart-status">총 {cart.length}개 메뉴</span>}</div>{cart.length === 0 ? <div className="cart-empty"><div className="cart-empty__icon">☕</div><p>아직 담긴 메뉴가 없어요.</p><span>마음에 드는 커피를 장바구니에 담아보세요.</span></div> : <div className="cart-content"><ul className="cart-list">{cart.map((item) => <CartItem key={item.key} item={item} onQuantityChange={changeQuantity} onRemove={removeItem} />)}</ul><div className="cart-summary"><div className="summary-row"><span>주문 금액</span><strong>{formatPrice(totalPrice)}</strong></div><div className="summary-row summary-row--total"><span>총 금액</span><strong>{formatPrice(totalPrice)}</strong></div><button className="button button--primary order-button" type="button" disabled={busyKey === 'order-submit'} onClick={placeOrder}>{busyKey === 'order-submit' ? '주문 접수 중...' : '주문하기'}</button></div></div>}</section></main>}{notice && <div className="toast" role="status">{notice}</div>}<footer className="site-footer">COZY COFFEE BAR · 좋은 커피, 편안한 순간</footer></div>
}

export default App

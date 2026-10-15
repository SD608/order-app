import { useMemo, useState } from 'react'
import './App.css'

const menus = [
  { id: 'americano-ice', name: '아메리카노(ICE)', price: 4000, description: '깔끔하고 시원한 산미의 아이스 아메리카노', visual: 'ice' },
  { id: 'americano-hot', name: '아메리카노(HOT)', price: 4000, description: '깊고 고소한 향을 담은 따뜻한 아메리카노', visual: 'hot' },
  { id: 'cafe-latte', name: '카페라떼', price: 5000, description: '부드러운 우유와 에스프레소의 조화', visual: 'latte' },
  { id: 'vanilla-latte', name: '바닐라라떼', price: 5500, description: '은은한 바닐라 향을 더한 달콤한 라떼', visual: 'vanilla' },
]

const options = [
  { id: 'shot', label: '샷 추가', price: 500 },
  { id: 'syrup', label: '시럽 추가', price: 0 },
]

const formatPrice = (price) => `${price.toLocaleString('ko-KR')}원`

function CoffeeVisual({ type }) {
  return (
    <div className={`coffee-visual coffee-visual--${type}`} aria-hidden="true">
      <span className="coffee-steam coffee-steam--one" />
      <span className="coffee-steam coffee-steam--two" />
      <div className="coffee-cup"><span className="coffee-liquid" /><span className="coffee-foam" /></div>
      <span className="coffee-handle" /><span className="coffee-shadow" />
    </div>
  )
}

function MenuCard({ menu, onAdd }) {
  const [selectedOptions, setSelectedOptions] = useState([])
  const menuPrice = menu.price + selectedOptions.reduce((sum, id) => sum + (options.find((item) => item.id === id)?.price ?? 0), 0)

  const toggleOption = (optionId) => {
    setSelectedOptions((current) => current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId])
  }

  return (
    <article className="menu-card">
      <CoffeeVisual type={menu.visual} />
      <div className="menu-card__body">
        <div className="menu-card__heading"><h2>{menu.name}</h2><strong>{formatPrice(menu.price)}</strong></div>
        <p className="menu-card__description">{menu.description}</p>
        <div className="menu-card__options" aria-label={`${menu.name} 옵션`}>
          {options.map((option) => (
            <label className="option-row" key={option.id}>
              <input type="checkbox" checked={selectedOptions.includes(option.id)} onChange={() => toggleOption(option.id)} />
              <span>{option.label}</span><small>{option.price ? `+${formatPrice(option.price)}` : '+0원'}</small>
            </label>
          ))}
        </div>
        <div className="menu-card__footer"><span className="menu-card__selected-price">{formatPrice(menuPrice)}</span><button className="button button--primary button--full" type="button" onClick={() => onAdd(menu, selectedOptions)}>담기</button></div>
      </div>
    </article>
  )
}

function CartItem({ item, onQuantityChange, onRemove }) {
  return (
    <li className="cart-item">
      <div className="cart-item__info"><strong>{item.name}</strong>{item.optionLabels.length > 0 && <span className="cart-item__options">{item.optionLabels.join(' · ')}</span>}</div>
      <div className="cart-item__controls">
        <div className="quantity-control" aria-label={`${item.name} 수량 조절`}>
          <button type="button" onClick={() => onQuantityChange(item.key, -1)} aria-label="수량 줄이기">−</button><span>{item.quantity}</span><button type="button" onClick={() => onQuantityChange(item.key, 1)} aria-label="수량 늘리기">+</button>
        </div>
        <strong className="cart-item__price">{formatPrice(item.unitPrice * item.quantity)}</strong>
        <button className="remove-button" type="button" onClick={() => onRemove(item.key)} aria-label={`${item.name} 삭제`}>×</button>
      </div>
    </li>
  )
}

function App() {
  const [cart, setCart] = useState([])
  const [notice, setNotice] = useState('')
  const totalPrice = useMemo(() => cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0), [cart])
  const totalQuantity = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart])

  const showNotice = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2400)
  }

  const addToCart = (menu, selectedOptionIds) => {
    const selected = options.filter((option) => selectedOptionIds.includes(option.id))
    const key = `${menu.id}-${[...selectedOptionIds].sort().join('-') || 'plain'}`
    const item = { key, name: menu.name, optionLabels: selected.map((option) => option.label), unitPrice: menu.price + selected.reduce((sum, option) => sum + option.price, 0), quantity: 1 }
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.key === key)
      return existing ? current.map((cartItem) => cartItem.key === key ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem) : [...current, item]
    })
    showNotice(`${menu.name}을(를) 장바구니에 담았습니다.`)
  }

  const changeQuantity = (key, amount) => setCart((current) => current.map((item) => item.key === key ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0))
  const removeItem = (key) => setCart((current) => current.filter((item) => item.key !== key))
  const placeOrder = () => { if (cart.length === 0) return; setCart([]); showNotice('주문이 접수되었습니다. 맛있게 준비할게요!') }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="COZY 홈">COZY</a>
        <nav className="site-nav" aria-label="주요 메뉴"><a className="site-nav__link site-nav__link--active" href="#order">주문하기</a><button className="site-nav__link" type="button" onClick={() => showNotice('관리자 화면은 준비 중입니다.')}>관리자</button></nav>
      </header>
      <main id="order" className="page-content">
        <section className="hero-copy" aria-labelledby="page-title"><div><p className="eyebrow">COZY COFFEE BAR</p><h1 id="page-title">오늘의 커피를<br /><span>편안하게</span> 주문하세요</h1></div><p className="hero-copy__description">신선하게 준비한 커피와 함께<br />당신의 하루를 시작해보세요.</p></section>
        <section className="menu-section" aria-labelledby="menu-title"><div className="section-heading"><div><p className="eyebrow">OUR MENU</p><h2 id="menu-title">커피 메뉴</h2></div><span className="menu-count">{menus.length}개의 메뉴</span></div><div className="menu-grid">{menus.map((menu) => <MenuCard key={menu.id} menu={menu} onAdd={addToCart} />)}</div></section>
        <section className="cart-section" aria-labelledby="cart-title"><div className="cart-heading"><div><p className="eyebrow">YOUR ORDER</p><h2 id="cart-title">장바구니 <span>{totalQuantity}</span></h2></div>{cart.length > 0 && <span className="cart-status">총 {cart.length}개 메뉴</span>}</div>
          {cart.length === 0 ? <div className="cart-empty"><div className="cart-empty__icon">☕</div><p>아직 담긴 메뉴가 없어요.</p><span>마음에 드는 커피를 장바구니에 담아보세요.</span></div> : <div className="cart-content"><ul className="cart-list">{cart.map((item) => <CartItem key={item.key} item={item} onQuantityChange={changeQuantity} onRemove={removeItem} />)}</ul><div className="cart-summary"><div className="summary-row"><span>주문 금액</span><strong>{formatPrice(totalPrice)}</strong></div><div className="summary-row summary-row--total"><span>총 금액</span><strong>{formatPrice(totalPrice)}</strong></div><button className="button button--primary order-button" type="button" onClick={placeOrder}>주문하기</button></div></div>}
        </section>
      </main>
      {notice && <div className="toast" role="status">{notice}</div>}<footer className="site-footer">COZY COFFEE BAR · 좋은 커피, 편안한 순간</footer>
    </div>
  )
}

export default App

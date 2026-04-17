import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import ThemeToggle from './ThemeToggle'
import { fetchCategories } from '../store/actions/AuctionsActions'
import './BuyerSideDrawer.css'

const BuyerSideDrawer = ({ isOpen, onClose }) => {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [buyExpanded, setBuyExpanded] = useState(false)
  const { categories } = useSelector((state) => state.buyer)

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/signin', { replace: true })
  }

  useEffect(() => {
    if (location.pathname !== '/buyer/buy') setBuyExpanded(false)
  }, [location.pathname])

  const isOnBuy = location.pathname === '/buyer/buy'
  const searchParams = new URLSearchParams(location.search || '')
  const selectedCategoryId = searchParams.get('category') || ''
  const activeCategories = (categories || []).filter((c) => c.is_active !== false)
  const showBuySubTabs = buyExpanded || (isOnBuy && selectedCategoryId)

  const navItems = [
    { path: '/buyer/dashboard', label: 'Live Auction', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/buyer/buy', label: 'Buy', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: '/buyer/sell', label: 'Sell', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { path: '/buyer/bids', label: 'My Bids', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { path: '/buyer/won-items', label: 'Won Auctions', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { path: '/buyer/favorite-items', label: 'Favorite Auctions', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { path: '/buyer/wallet', label: 'Wallet', icon: 'M21 7H3a2 2 0 00-2 2v9a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2zM16 15h.01' },
    { path: '/buyer/profile', label: 'Profile', icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  ]

  const isActive = (path) => {
    if (path === '/buyer/dashboard') return location.pathname === '/buyer/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <div
        className={`buyer-side-drawer__overlay ${isOpen ? 'open' : ''}`}
        aria-hidden="true"
      />
      <aside className={`buyer-side-drawer ${isOpen ? 'open' : ''}`} role="dialog" aria-label="Buyer navigation">
        <div className="buyer-side-drawer__header">
          <Link to="/buyer/dashboard" className="buyer-side-drawer__logo">
            <img src={logo} alt="Hammer & Tongues" />
            <span>HT Buyer</span>
          </Link>
          <button className="buyer-side-drawer__close" onClick={onClose} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <ThemeToggle className="buyer-side-drawer__theme-toggle" />

        <nav className="buyer-side-drawer__nav">
          {navItems.map((item) => (
            <React.Fragment key={item.path}>
              {item.path === '/buyer/buy' ? (
                <button
                  type="button"
                  className={`buyer-side-drawer__link buyer-side-drawer__link--btn ${showBuySubTabs ? 'active' : ''}`}
                  onClick={() => setBuyExpanded((prev) => !prev)}
                  aria-expanded={showBuySubTabs}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.label}
                </button>
              ) : (
                <Link
                  to={item.path}
                  className={`buyer-side-drawer__link ${isActive(item.path) ? 'active' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.label}
                </Link>
              )}
              {item.path === '/buyer/buy' && showBuySubTabs && activeCategories.length > 0 && (
                <div className="buyer-side-drawer__sub-tabs">
                  {activeCategories.map((cat) => {
                    const isCategoryActive = String(cat.id) === selectedCategoryId
                    return (
                      <Link
                        key={cat.id}
                        to={`/buyer/buy?category=${cat.id}`}
                        className={`buyer-side-drawer__sub-tab ${isCategoryActive ? 'active' : ''}`}
                      >
                        {cat.name || cat.slug || `Category #${cat.id}`}
                      </Link>
                    )
                  })}
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>

        <div className="buyer-side-drawer__actions">
          <span className="buyer-side-drawer__badge">Buyer</span>
          <button
            type="button"
            className="buyer-side-drawer__logout"
            onClick={handleLogout}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

export default BuyerSideDrawer

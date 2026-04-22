import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import ThemeToggle from './ThemeToggle'
import logo from '../assets/logo.png'
import { fetchCategories } from '../store/actions/AuctionsActions'
import './SideDrawer.css'

const SideDrawer = ({ isOpen, onClose }) => {
  const location = useLocation()
  const dispatch = useDispatch()
  const [buyExpanded, setBuyExpanded] = useState(false)
  const { token, user } = useSelector(state => state.auth)
  const { categories } = useSelector(state => state.buyer)
  // is_staff=true means admin (use admin profile, not manager)
  const isStaff = user?.is_staff === true || user?.is_staff === 1 || String(user?.is_staff).toLowerCase() === 'true'
  const profileRole = isStaff ? 'admin' : (user?.role || 'buyer')

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  useEffect(() => {
    if (location.pathname !== '/buy') setBuyExpanded(false)
  }, [location.pathname])

  const isOnBuy = location.pathname === '/buy'
  const searchParams = new URLSearchParams(location.search || '')
  const selectedCategoryId = searchParams.get('category') || ''

  const activeCategories = (categories || []).filter((c) => c.is_active !== false)
  const showBuySubTabs = buyExpanded || (isOnBuy && selectedCategoryId)

  const navItems = [
    { path: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/buy', label: 'Buy', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: '/sell', label: 'Sell', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { path: '/about', label: 'About', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { path: '/contact', label: 'Contact', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
  ]

  return (
    <>
      <div
        className={`side-drawer__overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`side-drawer ${isOpen ? 'open' : ''}`} role="dialog" aria-label="Navigation menu">
        <div className="side-drawer__header">
          <Link to="/" className="side-drawer__logo">
            <img src={logo} alt="Hammer & Tongues" />
            <span>Hammer & Tongues</span>
          </Link>
          <button className="side-drawer__close" onClick={onClose} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <ThemeToggle className="side-drawer__theme-toggle" />

        <nav className="side-drawer__nav">
          {navItems.map((item) => (
            <React.Fragment key={item.path}>
              {item.path === '/buy' ? (
                <button
                  type="button"
                  className={`side-drawer__link button ${showBuySubTabs ? 'active' : ''}`}
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
                  className={`side-drawer__link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.label}
                </Link>
              )}
              {item.path === '/buy' && showBuySubTabs && activeCategories.length > 0 && (
                <div className="side-drawer__sub-tabs">
                  {activeCategories.map((cat) => {
                    const isActive = String(cat.id) === selectedCategoryId
                    return (
                      <Link
                        key={cat.id}
                        to={`/buy?category=${cat.id}`}
                        className={`side-drawer__sub-tab ${isActive ? 'active' : ''}`}
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

        <div className="side-drawer__actions">
          {token ? (
            <Link
              to={`/${profileRole}/profile`}
              className="side-drawer__btn side-drawer__btn--primary"
            >
              Profile
            </Link>
          ) : (
            <>
              <Link to="/signin" className="side-drawer__btn side-drawer__btn--outline">
                Sign In
              </Link>
              <Link to="/register" className="side-drawer__btn side-drawer__btn--primary">
                Create Account
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

export default SideDrawer

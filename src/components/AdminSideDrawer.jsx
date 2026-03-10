import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import ThemeToggle from './ThemeToggle'
import { fetchCategories } from '../store/actions/AuctionsActions'
import './AdminSideDrawer.css'

const AdminSideDrawer = ({ isOpen, onClose }) => {
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
    if (location.pathname !== '/admin/buy') setBuyExpanded(false)
  }, [location.pathname])

  const isOnBuy = location.pathname === '/admin/buy'
  const searchParams = new URLSearchParams(location.search || '')
  const selectedCategoryId = searchParams.get('category') || ''
  const activeCategories = (categories || []).filter((c) => c.is_active !== false)
  const showBuySubTabs = buyExpanded || (isOnBuy && selectedCategoryId)

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/admin/buy', label: 'Buy', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: '/admin/sell', label: 'Sell', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { path: '/admin/users', label: 'User Management', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a3.5 3.5 0 01-5.5 2.696' },
    { path: '/admin/category', label: 'Category Management', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { path: '/admin/finance', label: 'Finance', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]

  const isActive = (path) => {
    if (path === '/admin/dashboard') return location.pathname === '/admin/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <div
        className={`admin-side-drawer__overlay ${isOpen ? 'open' : ''}`}
        aria-hidden="true"
      />
      <aside className={`admin-side-drawer ${isOpen ? 'open' : ''}`} role="dialog" aria-label="Admin navigation">
        <div className="admin-side-drawer__header">
          <Link to="/admin/dashboard" className="admin-side-drawer__logo">
            <img src={logo} alt="Hammer & Tongues" />
            <span>HT Admin</span>
          </Link>
          <button className="admin-side-drawer__close" onClick={onClose} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <ThemeToggle className="admin-side-drawer__theme-toggle" />

        <nav className="admin-side-drawer__nav">
          {navItems.map((item) => (
            <React.Fragment key={item.path}>
              {item.path === '/admin/buy' ? (
                <button
                  type="button"
                  className={`admin-side-drawer__link admin-side-drawer__link--btn ${showBuySubTabs ? 'active' : ''}`}
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
                  className={`admin-side-drawer__link ${isActive(item.path) ? 'active' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.label}
                </Link>
              )}
              {item.path === '/admin/buy' && showBuySubTabs && activeCategories.length > 0 && (
                <div className="admin-side-drawer__sub-tabs">
                  {activeCategories.map((cat) => {
                    const isCategoryActive = String(cat.id) === selectedCategoryId
                    return (
                      <Link
                        key={cat.id}
                        to={`/admin/buy?category=${cat.id}`}
                        className={`admin-side-drawer__sub-tab ${isCategoryActive ? 'active' : ''}`}
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

        <div className="admin-side-drawer__actions">
          <span className="admin-side-drawer__badge">Admin</span>
          <button
            type="button"
            className="admin-side-drawer__logout"
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

export default AdminSideDrawer

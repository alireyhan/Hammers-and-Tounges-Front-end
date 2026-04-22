import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import ThemeToggle from './ThemeToggle'
import './SellerSideDrawer.css'

const SellerSideDrawer = ({ isOpen, onClose }) => {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/signin', { replace: true })
  }

  const navItems = [
    { path: '/seller/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  ]

  const isActive = (path) => {
    if (path === '/seller/dashboard') return location.pathname === '/seller/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <div
        className={`seller-side-drawer__overlay ${isOpen ? 'open' : ''}`}
        aria-hidden="true"
      />
      <aside className={`seller-side-drawer ${isOpen ? 'open' : ''}`} role="dialog" aria-label="Seller navigation">
        <div className="seller-side-drawer__header">
          <Link to="/seller/dashboard" className="seller-side-drawer__logo">
            <img src={logo} alt="Hammer & Tongues" />
            <span>HT Seller</span>
          </Link>
          <button className="seller-side-drawer__close" onClick={onClose} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <ThemeToggle className="seller-side-drawer__theme-toggle" />

        <nav className="seller-side-drawer__nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`seller-side-drawer__link ${isActive(item.path) ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="seller-side-drawer__actions">
          <span className="seller-side-drawer__badge">Seller</span>
          <button
            type="button"
            className="seller-side-drawer__logout"
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

export default SellerSideDrawer

import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import logo from '../assets/logo.png'
import './AdminHeader.css'

function AdminHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const mobileMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen &&
        !mobileMenuRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/signin', { replace: true })
  }

  const navItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      desktopLabel: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/admin/users',
      label: 'User Management',
      desktopLabel: 'User Management',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a3.5 3.5 0 01-5.5 2.696" />
        </svg>
      )
    },
    {
      path: '/admin/category',
      label: 'Category Management',
      desktopLabel: 'Category Management',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      path: '/admin/unsold-inventory',
      label: 'Unsold Inventory',
      desktopLabel: 'Unsold Inventory',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      path: '/admin/goods-received-verification',
      label: 'GRV',
      desktopLabel: 'Goods Received Verification',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      path: '/admin/finance',
      label: 'Finance',
      desktopLabel: 'Finance',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }

  ]

  return (
    <>
      <header className="admin-header">
        <div className="admin-header__container" ref={menuRef}>
          <Link to="/" className="admin-header__logo">
            <img src={logo} alt="Hammer & Tongues Logo" />
            <span>Hammer & Tongues</span>
          </Link>

          <nav className="admin-header__nav">
            {navItems.map((item) => {
              const financeActive =
                item.path === '/admin/finance' && location.pathname.startsWith('/admin/finance')
              const exactActive = location.pathname === item.path
              const isActive = financeActive || (item.path !== '/admin/finance' && exactActive)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`admin-header__nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.desktopLabel}
                </Link>
              )
            })}
          </nav>

          <div className="admin-header__right">
            <div className="admin-header__admin-badge">
              <span className="admin-header__admin-text">Admin</span>
            </div>

            <button
              className="admin-header__logout-btn"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/>
              </svg>
            </button>

            <button
              className="admin-header__mobile-toggle"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* <Link to="/admin/profile" className="admin-header__profile-btn" aria-label="Profile">
              <div className="admin-header__avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="7"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </Link> */}
          </div>
        </div>

        <div
          className={`admin-header__mobile-overlay ${mobileMenuOpen ? 'open' : ''}`}
          onClick={closeMobileMenu}
        />

        <div className={`admin-header__mobile-menu ${mobileMenuOpen ? 'open' : ''}`} ref={mobileMenuRef}>
          <div className="admin-header__mobile-header">
            <div className="admin-header__mobile-logo">
              <img src={logo} alt="Hammer & Tongues Logo" />
              <span>Hammer & Tongues</span>
            </div>
            <div className="admin-header__mobile-badge">
              <span>Admin Panel</span>
            </div>
          </div>

          <nav className="admin-header__mobile-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-header__mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="admin-header__mobile-nav-icon">
                  {item.icon}
                </span>
                <span className="admin-header__mobile-nav-text">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="admin-header__mobile-footer">
            <button
              className="admin-header__mobile-logout-btn"
              onClick={() => {
                handleLogout()
                closeMobileMenu()
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/>
              </svg>
              <span>Logout</span>
            </button>
          </div>

        </div>
      </header>
    </>
  )
}

export default AdminHeader;
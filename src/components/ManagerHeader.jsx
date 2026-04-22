import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import logo from '../assets/logo.png'
import './ManagerHeader.css'

function ManagerHeader() {
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
      path: '/manager/dashboard',
      label: 'Dashboard',
      desktopLabel: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/manager/live-auctions',
      label: 'Completed Auctions',
      desktopLabel: 'Completed Auctions',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    }
    // Category Management moved to admin flow
   
  ]

  return (
    <>
      <header className="manager-header">
        <div className="manager-header__container" ref={menuRef}>
          <Link to="/manager/dashboard" className="manager-header__logo">
            <img src={logo} alt="Hammer & Tongues Logo" />
            <span>Hammer & Tongues</span>
          </Link>

          <nav className="manager-header__nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`manager-header__nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.desktopLabel}
              </Link>
            ))}
          </nav>

          <div className="manager-header__right">
            <div className="manager-header__manager-badge">
              <span className="manager-header__manager-text">Manager</span>
            </div>

            <button
              className="manager-header__mobile-toggle"
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

            <button
              className="manager-header__logout-btn"
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
          </div>
        </div>

        <div
          className={`manager-header__mobile-overlay ${mobileMenuOpen ? 'open' : ''}`}
          onClick={closeMobileMenu}
        />

        <div className={`manager-header__mobile-menu ${mobileMenuOpen ? 'open' : ''}`} ref={mobileMenuRef}>
          <div className="manager-header__mobile-header">
            <div className="manager-header__mobile-logo">
              <img src={logo} alt="Hammer & Tongues Logo" />
              <span>Hammer & Tongues</span>
            </div>
            <div className="manager-header__mobile-badge">
              <span>Manager Panel</span>
            </div>
          </div>

          <nav className="manager-header__mobile-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`manager-header__mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="manager-header__mobile-nav-icon">
                  {item.icon}
                </span>
                <span className="manager-header__mobile-nav-text">{item.label}</span>
              </Link>
            ))}
          </nav>

        </div>
      </header>
    </>
  )
}

export default ManagerHeader;
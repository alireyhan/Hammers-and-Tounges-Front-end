import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'
import './BuyerHeader.css'
import { useSelector } from 'react-redux'

function BuyerHeader() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { token } = useSelector(state => state.auth)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <header className="buyer-header">
        <div className="buyer-header__container">
          <Link to="/buyer/dashboard" className="buyer-header__logo">
            <img src={logo} alt="Hammer & Tongues Logo" />
            <span>Hammer & Tongues</span>
          </Link>

          <nav className="buyer-header__nav">
            <Link
              to="/buyer/dashboard"
              className={`buyer-header__nav-link ${location.pathname === '/buyer/dashboard' ? 'active' : ''
                }`}
            >
              Dashboard
            </Link>
            <Link
              to="/buyer/bids"
              className={`buyer-header__nav-link ${location.pathname === '/buyer/bids' ? 'active' : ''
                }`}
            >
              My Bids
            </Link>
            <Link
              to="/buyer/won-items"
              className={`buyer-header__nav-link ${location.pathname === '/buyer/won-items' ? 'active' : ''
                }`}
            >
              Won Auctions
            </Link>
            <Link
              to="/buyer/favorite-items"
              className={`buyer-header__nav-link ${location.pathname === '/buyer/favorite-items' ? 'active' : ''
                }`}
            >
              Favorite Auctions
            </Link>
          </nav>

          <div className="buyer-header__right">
            <button
              className="buyer-header__mobile-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link to="/buyer/profile" className="buyer-header__profile-btn" aria-label="Profile">
              <div className="buyer-header__avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
            </Link>
          </div>
        </div>

        <div
          className={`buyer-header__mobile-overlay ${mobileMenuOpen ? 'open' : ''}`}
          onClick={closeMobileMenu}
        />

        <div className={`buyer-header__mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <nav className="buyer-header__mobile-nav">
            <Link
              to="/buyer/dashboard"
              className={`buyer-header__mobile-nav-link ${location.pathname === '/buyer/dashboard' ? 'active' : ''
                }`}
              onClick={closeMobileMenu}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link
              to="/buyer/bids"
              className={`buyer-header__mobile-nav-link ${location.pathname === '/buyer/bids' ? 'active' : ''
                }`}
              onClick={closeMobileMenu}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Bids
            </Link>
            <Link
              to="/buyer/won-items"
              className={`buyer-header__mobile-nav-link ${location.pathname === '/buyer/won-items' ? 'active' : ''
                }`}
              onClick={closeMobileMenu}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Won Auctions
            </Link>
            <Link
              to="/buyer/favorite-items"
              className={`buyer-header__mobile-nav-link ${location.pathname === '/buyer/favorite-items' ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favorite Auctions
            </Link>
          </nav>
        </div>
      </header>
    </>
  )
}

export default BuyerHeader
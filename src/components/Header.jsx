import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'
import './Header.css'
// import { getLocalStorage } from '../utils/localStorage';
import { FaSignInAlt } from "react-icons/fa";
import { useSelector } from 'react-redux';


function Header() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // const [user, setUser] = useState(() =>
  //   getLocalStorage('user', { name: '', email: '', isAuth: false, role: 'buyer' })
  // )
  const { token, user } = useSelector(state => state.auth)
  // is_staff=true means admin (use admin profile, not manager)
  const isStaff = user?.is_staff === true || user?.is_staff === 1 || String(user?.is_staff).toLowerCase() === 'true'
  const profileRole = isStaff ? 'admin' : (user?.role || 'buyer')

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
          <Link to="/" className="buyer-header__logo">
            <img src={logo} alt="Hammer & Tongues Logo" />
            <span>Hammer & Tongues</span>
          </Link>
          <nav className="buyer-header__nav">
            <Link
              to="/"
              className={`buyer-header__nav-link ${location.pathname === '/' ? 'active' : ''
                }`}
            >
              Home
            </Link>
            <Link
              to="/auctions"
              className={`buyer-header__nav-link ${location.pathname === '/auctions' ? 'active' : ''
                }`}
            >
              Auctions
            </Link>
            <Link
              to="/about"
              className={`buyer-header__nav-link ${location.pathname === '/about' ? 'active' : ''
                }`}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`buyer-header__nav-link ${location.pathname === '/contact' ? 'active' : ''
                }`}
            >
              Contact
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
            {
              token ? (
                <Link to={`/${profileRole}/profile`} className="buyer-header__profile-btn" aria-label="Profile">
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
              ) : (
                <Link to={'/signin'} className="buyer-header__profile-btn" aria-label="Sign Up">
                  <div className="buyer-header__avatar">
                    {/* <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M11 16l4-4-4-4M15 12H3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg> */}
                    <FaSignInAlt/>
                  </div>
                  <span> Sign In </span>
                </Link>

              )
            }
          </div>
        </div>

        <div
          className={`buyer-header__mobile-overlay ${mobileMenuOpen ? 'open' : ''}`}
          onClick={closeMobileMenu}
        />

        <div className={`buyer-header__mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <nav className="buyer-header__mobile-nav">
            <Link
              to="/"
              className={`buyer-header__mobile-nav-link ${location.pathname === '/' ? 'active' : ''
                }`}
              onClick={closeMobileMenu}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            <Link
              to="/auctions"
              className={`buyer-header__mobile-nav-link ${location.pathname === '/auctions' ? 'active' : ''
                }`}
              onClick={closeMobileMenu}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Auctions
            </Link>
            <Link
              to="/about"
              className={`buyer-header__mobile-nav-link ${location.pathname === '/about' ? 'active' : ''
                }`}
              onClick={closeMobileMenu}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              About
            </Link>
            <Link
              to="/contact"
              className={`buyer-header__mobile-nav-link ${location.pathname === '/contact' ? 'active' : ''
                }`}
              onClick={closeMobileMenu}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 7l-7.89 5.26a2 2 0 01-2.22 0L3 7" />
              </svg>
              Contact
            </Link>

          </nav>
        </div>
      </header>
    </>
  )
}

export default Header
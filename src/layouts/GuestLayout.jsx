import React, { useState } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import SideDrawer from '../components/SideDrawer'
import Footer from '../components/Footer'
import './GuestLayout.css'

const getDashboardForRole = (user) => {
  if (!user) return '/'
  const role = (user.role || '').toLowerCase()
  const isStaff = user.is_staff === true || user.is_staff === 1 || String(user?.is_staff).toLowerCase() === 'true'

  // Buyer and seller always go to their dashboards regardless of is_staff
  if (role === 'buyer') return '/buyer/dashboard'
  if (role === 'seller') return '/seller/dashboard'
  // is_staff = admin; otherwise manager
  if (isStaff) return '/admin/dashboard'
  if (role === 'manager') return '/manager/dashboard'
  return '/'
}

const GuestLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(true)
  const { pathname } = useLocation()
  const hideFooter = pathname === '/signin' || pathname === '/register'

  const { isAuthenticated, user } = useSelector((state) => state.auth)

  // Redirect authenticated users to their role dashboard (persists across tab close/reopen)
  if (isAuthenticated && user) {
    const dashboard = getDashboardForRole(user)
    if (dashboard !== '/') {
      return <Navigate to={dashboard} replace />
    }
  }

  return (
    <div className={`guest-layout ${drawerOpen ? 'drawer-open' : ''}`}>
      {/* No navbar - drawer has all nav + Sign In. Only show reopen button when drawer is closed */}
      {!drawerOpen && (
        <button
          className="guest-drawer-toggle"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <main className="guest-main">
        <Outlet />
      </main>

      {!hideFooter && <Footer />}

      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

export default GuestLayout

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import ThemeToggle from './ThemeToggle'
// import { fetchCategories } from '../store/actions/AuctionsActions'
import './ManagerSideDrawer.css'

const ManagerSideDrawer = ({ isOpen, onClose }) => {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const features = useSelector((state) => state.permissions?.features)
  const permissionsLoading = useSelector((state) => state.permissions?.isLoading)
  const lastFetchedUserId = useSelector((state) => state.permissions?.lastFetchedUserId)
  const authUserId = useSelector((state) => state.auth?.user?.id)
  const manageUsers = features?.manage_users || {}
  const manageCategories = features?.manage_categories || {}
  const depositExemptPerm = features?.deposit_exempt || {}

  // Show tabs only when the user can read AND has at least one write permission.
  const canShowManageUsersTab =
    !permissionsLoading &&
    lastFetchedUserId != null &&
    String(lastFetchedUserId) === String(authUserId) &&
    manageUsers?.read === true &&
    (manageUsers?.create === true ||
      manageUsers?.update === true ||
      manageUsers?.delete === true)

  const canShowManageCategoriesTab =
    !permissionsLoading &&
    lastFetchedUserId != null &&
    String(lastFetchedUserId) === String(authUserId) &&
    manageCategories?.read === true &&
    (manageCategories?.create === true ||
      manageCategories?.update === true ||
      manageCategories?.delete === true)

  // Deposit Exemption feature has create toggle only in role management.
  const canShowDepositExemptionTab =
    !permissionsLoading &&
    lastFetchedUserId != null &&
    String(lastFetchedUserId) === String(authUserId) &&
    depositExemptPerm?.create === true

  // Buy/Sell tabs commented out
  // const [buyExpanded, setBuyExpanded] = useState(false)
  // const { categories } = useSelector((state) => state.buyer)

  // useEffect(() => {
  //   dispatch(fetchCategories())
  // }, [dispatch])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/signin', { replace: true })
  }

  // useEffect(() => {
  //   if (location.pathname !== '/manager/buy') setBuyExpanded(false)
  // }, [location.pathname])

  // const isOnBuy = location.pathname === '/manager/buy'
  // const searchParams = new URLSearchParams(location.search || '')
  // const selectedCategoryId = searchParams.get('category') || ''
  // const activeCategories = (categories || []).filter((c) => c.is_active !== false)
  // const showBuySubTabs = buyExpanded || (isOnBuy && selectedCategoryId)

  const navItems = [
    { path: '/manager/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/manager/users', label: 'User Management', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a3.5 3.5 0 01-5.5 2.696' },
    { path: '/manager/category', label: 'Category Management', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { path: '/manager/unsold-inventory', label: 'Unsold Inventory', icon: 'M3 3h18v18H3V3zm4 12h10M7 7h10m-10 4h6' },
    { path: '/manager/deposit-exemption', label: 'Deposit Exemption', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6' },
    // { path: '/manager/buy', label: 'Buy', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    // { path: '/manager/sell', label: 'Sell', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { path: '/manager/live-auctions', label: 'Completed Auctions', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  ]

  const isActive = (path) => {
    if (path === '/manager/dashboard') return location.pathname === '/manager/dashboard'
    if (path === '/manager/users') {
      return (
        location.pathname.startsWith('/manager/users') ||
        location.pathname.startsWith('/manager/seller') ||
        location.pathname.startsWith('/manager/manager') ||
        location.pathname.startsWith('/manager/role-management')
      )
    }
    if (path === '/manager/category') {
      return (
        location.pathname.startsWith('/manager/category') ||
        location.pathname.startsWith('/manager/add-category') ||
        location.pathname.startsWith('/manager/edit-category') ||
        location.pathname.startsWith('/manager/product-fields')
      )
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <div
        className={`manager-side-drawer__overlay ${isOpen ? 'open' : ''}`}
        aria-hidden="true"
      />
      <aside className={`manager-side-drawer ${isOpen ? 'open' : ''}`} role="dialog" aria-label="Manager navigation">
        <div className="manager-side-drawer__header">
          <Link to="/manager/dashboard" className="manager-side-drawer__logo">
            <img src={logo} alt="Hammer & Tongues" />
            <span>HT Manager</span>
          </Link>
          <button className="manager-side-drawer__close" onClick={onClose} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <ThemeToggle className="manager-side-drawer__theme-toggle" />

        <nav className="manager-side-drawer__nav">
          {navItems.map((item) => {
            if (item.path === '/manager/users') {
              if (permissionsLoading || !features) {
                return (
                  <div
                    key={item.path}
                    className="manager-side-drawer__link"
                    style={{ opacity: 0.65, pointerEvents: 'none' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item.label}
                  </div>
                );
              }

              if (!canShowManageUsersTab) return null;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`manager-side-drawer__link ${isActive(item.path) ? 'active' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.label}
                </Link>
              );
            }

            if (item.path === '/manager/category') {
              if (permissionsLoading || !features) {
                return (
                  <div
                    key={item.path}
                    className="manager-side-drawer__link"
                    style={{ opacity: 0.65, pointerEvents: 'none' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item.label}
                  </div>
                );
              }

              if (!canShowManageCategoriesTab) return null;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`manager-side-drawer__link ${isActive(item.path) ? 'active' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.label}
                </Link>
              );
            }

            if (item.path === '/manager/deposit-exemption') {
              if (permissionsLoading || !features) {
                return (
                  <div
                    key={item.path}
                    className="manager-side-drawer__link"
                    style={{ opacity: 0.65, pointerEvents: 'none' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item.label}
                  </div>
                );
              }

              if (!canShowDepositExemptionTab) return null;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`manager-side-drawer__link ${isActive(item.path) ? 'active' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`manager-side-drawer__link ${isActive(item.path) ? 'active' : ''}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="manager-side-drawer__actions">
          <span className="manager-side-drawer__badge">Manager</span>
          <button
            type="button"
            className="manager-side-drawer__logout"
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

export default ManagerSideDrawer

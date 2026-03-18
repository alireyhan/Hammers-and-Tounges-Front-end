import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import ManagerSideDrawer from '../components/ManagerSideDrawer'
import './ManagerLayout.css'
import { fetchUserPermissions } from '../store/actions/permissionsActions'
import { clearPermissions } from '../store/slices/permissionsSlice'

const ManagerLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(true)
  const dispatch = useDispatch()
  const authUserId = useSelector((state) => state.auth?.user?.id)

  useEffect(() => {
    if (!authUserId) return
    // Always re-fetch for manager flow, so drawer never relies on stale Redux permissions.
    dispatch(clearPermissions())
    dispatch(fetchUserPermissions(authUserId))
  }, [dispatch, authUserId])

  return (
    <div className={`manager-layout ${drawerOpen ? 'drawer-open' : ''}`}>
      {!drawerOpen && (
        <button
          className="manager-layout__toggle"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <main className="manager-layout__main">
        <Outlet />
      </main>

      <ManagerSideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

export default ManagerLayout

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { deleteUser, fetchUsersList } from "../../store/actions/adminActions";
import "./UserManagement.css";

const UserManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { users, isLoading, isPerformingAction } = useSelector(
    (state) => state.admin
  );

  const basePath = location.pathname.startsWith("/manager") ? "/manager" : "/admin";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(() => {
    const role = location.state?.role;
    return role && ["manager", "seller", "buyer", "clerk"].includes(role) ? role : "manager";
  });

  // Restore role filter when returning from edit/create (e.g. Edit Seller → seller, Edit Manager → manager)
  useEffect(() => {
    const role = location.state?.role;
    if (role && ["manager", "seller", "buyer", "clerk"].includes(role)) {
      setRoleFilter(role);
      setPage(1);
      setSearch("");
    }
  }, [location.state]);
  const [page, setPage] = useState(1);
  const [localUsers, setLocalUsers] = useState([]);

  // When switching roles, always start at page 1 to avoid "empty page" scenarios
  useEffect(() => {
    setPage(1);
    setLocalUsers([]);
  }, [roleFilter]);

  // Fetch users on component mount, when page or role filter changes
  useEffect(() => {
    dispatch(fetchUsersList({ page, role: roleFilter }));
  }, [dispatch, page, roleFilter]);

  // Update localUsers when users data changes from API
  useEffect(() => {
    if (users?.results && Array.isArray(users.results)) {
      setLocalUsers(users.results);
      if (roleFilter === "clerk") {
        // Debug: inspect backend payload for clerk fields (name, first_name, last_name, etc.)
        // eslint-disable-next-line no-console
        console.log("[UserManagement] clerk users response:", users);
        // eslint-disable-next-line no-console
        console.log("[UserManagement] clerk users sample:", users.results.slice(0, 3));
      }
    } else {
      setLocalUsers([]);
    }
  }, [users?.results]);

  // // Refresh users list after successful action
  // useEffect(() => {
  //   dispatch(fetchUsersList());
  // }, []);


  // Get user status based on role and verification
  const getUserStatus = (user) => {
    if (user.role === 'manager') {
      return user.is_active ? "Active" : "Inactive";
    }
    if (user.is_suspended) return "Suspended";
    if (user.role === 'seller' && user?.seller_details) {
      if (user.seller_details.is_rejected) return "Rejected";
      if (!user.seller_details.verified) return "Pending";
    }
    return "Active";
  };

  // Check if seller has KYC images attached
  const hasKYCImages = (user) => {
    if (user.role !== 'seller' || !user?.seller_details) return false;
    
    const sellerDetails = user.seller_details;
    const kycImageFields = [
      'id_front',
      'id_back',
      'driving_license_front',
      'driving_license_back',
      'passport_front'
    ];
    
    // Check if at least one KYC image field exists and is not null/empty
    return kycImageFields.some(field => {
      const value = sellerDetails[field];
      if (!value) return false;
      // Handle both string and non-string values
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      return value !== null && value !== undefined;
    });
  };

  // Filter and paginate users
  // const filteredUsers = useMemo(() => {
  //   if (!users?.results) return [];

  //   return users?.results.filter((user) => {
  //     const searchableText = `${user.full_name || ''} ${user.email || ''} ${user.role || ''} ${getUserStatus(user) || ''}`.toLowerCase();
  //     const matchesSearch = searchableText.includes(search.toLowerCase());
  //     const matchesRole = user.role ? roleFilter : user.role === roleFilter && user.is_staff == 'false' ;
  //     return matchesSearch && matchesRole;
  //   });
  // }, [users, search, roleFilter]);

  // console.log('Filtered Data: ', filteredUsers);
  
const filteredUsers = useMemo(() => {
  if (!localUsers || localUsers.length === 0) return [];

  return localUsers.filter((user) => {
    // Soft-deleted users are removed from the list (backend sets is_active=false).
    // We only hide them for seller/clerk screens to avoid interfering with manager status logic.
    const isSoftDeleted =
      user?.is_active === false ||
      user?.is_active === "false" ||
      user?.is_active === 0;

    if (
      (roleFilter === "seller" || roleFilter === "clerk") &&
      isSoftDeleted
    ) {
      return false;
    }

    const searchableText = `
      ${user.full_name || ""}
      ${user.first_name || ""}
      ${user.last_name || ""}
      ${user.email || ""}
      ${user.role || ""}
      ${getUserStatus(user) || ""}
    `.toLowerCase();

    const matchesSearch = searchableText.includes(search.toLowerCase());

    // Future-safe is_staff normalization
    const isStaff =
      user?.is_staff === true ||
      user?.is_staff === "true" ||
      user?.is_staff === 1 ||
      false;

    // Role-based filtering
    let matchesRole;
    if (roleFilter === "manager") {
      matchesRole = user.role === "manager" && !isStaff;
    } else if (roleFilter === "seller") {
      // Seller filtering: Only show if verified OR (pending with images)
      const isVerified = user?.seller_details?.verified === true;
      const isPending = !isVerified;
      
      if (user.role !== 'seller') {
        matchesRole = false;
      } else if (isPending && !hasKYCImages(user)) {
        matchesRole = false;
      } else {
        matchesRole = true;
      }
    } else {
      matchesRole = user.role === roleFilter;
    }

    return matchesSearch && matchesRole;
  });
}, [localUsers, search, roleFilter]);




  // Use API pagination data for "all" filter, show all filtered users for other filters
  const totalPages = users?.total_pages || 1;
  const hasNext = users?.has_next || false;
  const hasPrevious = users?.has_previous || false;
  const totalCount = users?.count || 0;
  const currentPage = users?.current_page || 1;
  
  // For "all" filter, use filteredUsers directly (API already paginates)
  // For other filters, show all filtered users without pagination
  const displayUsers = filteredUsers;

  // Get status class
  const getStatusClass = (user) => {
    if (user.role === 'manager') {
      return user.is_active ? "active" : "suspended";
    }
    if (user.is_suspended) return "suspended";
    if (user.role === 'seller' && user?.seller_details) {
      if (user.seller_details.is_rejected) return "rejected";
      if (!user.seller_details.verified) return "pending";
    }
    return "active";
  };

  // Handle user action
  // const handleUserAction = async (userId, actionType, role = null) => {
  //   const actionData = {
  //     type: actionType,
  //     target_id: userId,
  //   };

  //   if (role) {
  //     actionData.role = role;
  //   }

  //   await dispatch(performUserAction(actionData));
  // };

  // Get role display name
  const getRoleDisplayName = (role) => {
    const roleMap = {
      'admin': 'Administrator',
      'seller': 'Seller',
      'buyer': 'Buyer',
      'manager': 'Manager',
      'clerk': 'Clerk',
    };
    return roleMap[role] || role;
  };

  // Get display name: full_name, or first_name + last_name (backend may return these when full_name is empty after create)
  const getDisplayName = (user) => {
    const safeTrim = (v) => (typeof v === "string" ? v.trim() : "");

    const full =
      safeTrim(user?.full_name) ||
      safeTrim(user?.fullName) ||
      safeTrim(user?.display_name) ||
      safeTrim(user?.displayName) ||
      safeTrim(user?.name);
    if (full) return full;

    // Some APIs may nest staff/clerk details
    const first =
      safeTrim(user?.first_name) ||
      safeTrim(user?.firstName) ||
      safeTrim(user?.staff_details?.first_name) ||
      safeTrim(user?.staff_details?.firstName);
    const last =
      safeTrim(user?.last_name) ||
      safeTrim(user?.lastName) ||
      safeTrim(user?.staff_details?.last_name) ||
      safeTrim(user?.staff_details?.lastName);

    const combined = [first, last].filter(Boolean).join(" ");
    return combined || safeTrim(user?.email) || "N/A";
  };

  const handleDeleteUser = async (userId) => {
    const currentRole = roleFilter;
    const confirmMsg = `Are you sure you want to delete this ${currentRole}? This will soft-delete the account.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await dispatch(deleteUser(userId)).unwrap();
      // Refresh list so the soft-deleted user (is_active=false) disappears.
      await dispatch(fetchUsersList({ page, role: roleFilter })).unwrap();
    } catch (err) {
      // Errors are handled by the thunk + toast.
    }
  };

  const handleOpenRoleManagement = (user) => {
    navigate(`${basePath}/role-management/${user.id}`, {
      state: { role: user.role, user },
    });
  };

  return (
    <div className="user-management-container">
      {/* Page Header */}
      <header className="user-management-header">
        <div>
          <h1 className="user-management-title">User Management</h1>
          <p className="user-management-subtitle">Manage all users on the Hammer & Tongues platform.</p>
        </div>
        {(roleFilter === 'manager' || roleFilter === 'seller' || roleFilter === 'clerk') && (
          <button 
            className="user-management-create-btn"
            onClick={() =>
              navigate(
                roleFilter === 'manager'
                  ? `${basePath}/manager/create`
                  : roleFilter === 'seller'
                  ? `${basePath}/seller/create`
                  : `${basePath}/clerk/create`
              )
            }
            disabled={isLoading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {roleFilter === 'manager' ? 'Create Manager' : roleFilter === 'seller' ? 'Create Seller' : 'Create Clerk'}
          </button>
        )}
      </header>

      {/* Filters Section */}
      <div className="user-management-filters">
        <div className="user-management-search-wrapper">
          <button className='user-management-search-btn'>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <input
            type="text"
            className="user-management-search-input"
            placeholder="Search by name, email, role or status..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            disabled={isLoading}
          />
          {search && (
            <button
              className="user-management-clear-search"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              aria-label="Clear search"
              disabled={isLoading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        <select
          className="user-management-role-filter"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          disabled={isLoading}
        >
          <option value="manager">Manager</option>
          <option value="seller">Seller</option>
          <option value="buyer">Buyer</option>
          <option value="clerk">Clerk</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="user-management-loading">
          <div className="user-management-loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        /* Users Table */
        <div className="user-management-table-container">
          <table className="user-management-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                {(roleFilter === 'seller' || roleFilter === 'clerk' || roleFilter === 'manager') && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {displayUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="user-management-table-row" 
                  onClick={
                    roleFilter === 'seller' && user.role === 'seller' 
                      ? () => navigate(`${basePath}/seller/edit/${user.id}`, { state: { user } })
                      : roleFilter === 'manager' && user.role === 'manager'
                      ? () => navigate(`${basePath}/manager/${user.id}`)
                      : undefined
                  }
                  style={
                    (roleFilter === 'seller' && user.role === 'seller') || 
                    (roleFilter === 'manager' && user.role === 'manager')
                      ? { cursor: 'pointer' } 
                      : { cursor: 'default' }
                  }
                >
                  <td className="user-management-name-cell">
                    <div className="user-management-name-cell-inner">
                      <div className="user-management-avatar">
                        {getDisplayName(user)?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </div>
                      <span>{getDisplayName(user)}</span>
                    </div>
                  </td>
                  <td className="user-management-email-cell">
                    {user.email || 'N/A'}
                  </td>
                  <td className="user-management-role-cell">
                    {getRoleDisplayName(user.role) || 'N/A'}
                  </td>
                  <td className="user-management-status-cell">
                    <span className={`user-management-status user-management-status-${getStatusClass(user)}`}>
                      {getUserStatus(user)}
                    </span>
                  </td>
                  {(
                    (roleFilter === 'seller' && user.role === 'seller') ||
                    (roleFilter === 'clerk' && user.role === 'clerk') ||
                    (roleFilter === 'manager' && user.role === 'manager')
                  ) && (
                    <td className="user-management-actions-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="user-management-actions-dropdown">
                        {(roleFilter === 'manager' || roleFilter === 'clerk') && (
                          <button
                            className="user-management-action-btn user-management-action-roles"
                            onClick={() => handleOpenRoleManagement(user)}
                            title="Role Management"
                            disabled={isPerformingAction}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M12 6V2m0 4l-2 2m2-2l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M6 14l-2 2m2-2l2 2m-2-2h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18 14l2 2m-2-2l-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Role Management
                          </button>
                        )}

                        {roleFilter === 'seller' && user.role === 'seller' && (
                          <button
                            className="user-management-action-btn user-management-action-edit"
                            onClick={() => navigate(`${basePath}/seller/edit/${user.id}`, { state: { user } })}
                            title="Edit Seller"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Edit
                          </button>
                        )}

                        {(roleFilter === 'seller' || roleFilter === 'clerk') && (
                          <button
                            className="user-management-action-btn user-management-action-delete"
                            onClick={() => handleDeleteUser(user.id)}
                            title={`Delete ${user.role}`}
                            disabled={isPerformingAction}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Delete
                          </button>
                        )}
                          {/* <div className="user-management-actions-menu">
                          {user.role === 'seller' && !user.is_verified && (
                            <button
                              className="user-management-action-btn user-management-action-verify"
                              onClick={() => handleUserAction(user.id, 'VERIFY_SELLER')}
                              disabled={isPerformingAction}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Verify Seller
                            </button>
                          )}
                          {user.role === 'seller' && (
                            <button
                              className="user-management-action-btn user-management-action-promote"
                              onClick={() => handleUserAction(user.id, 'PROMOTE_TO_MANAGER')}
                              disabled={isPerformingAction}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Promote to Manager
                            </button>
                          )}
                          {user.role === 'manager' && (
                            <button
                              className="user-management-action-btn user-management-action-suspend"
                              onClick={() => handleUserAction(user.id, 'SUSPEND_MANAGER')}
                              disabled={isPerformingAction}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              Suspend Manager
                            </button>
                          )}
                          <button
                            className="user-management-action-btn user-management-action-change"
                            onClick={() => handleUserAction(user.id, 'SPECIFIC_ROLE_ACTION', 'buyer')}
                            disabled={isPerformingAction}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M17 8l4 4m0 0l-4 4m4-4H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Change to Buyer
                          </button>
                        </div> */}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination - shown for all filters using API response */}
          <div className="user-management-pagination">
            <div className="user-management-pagination-info">
              {displayUsers.length === 0 
                ? `No ${roleFilter}s on this page. Try other pages.`
                : `Showing ${displayUsers.length} ${roleFilter}${displayUsers.length !== 1 ? 's' : ''} on page ${currentPage} of ${totalPages}`
              }
            </div>

            <div className="user-management-pagination-controls">
              <button
                className="user-management-pagination-btn user-management-pagination-prev"
                onClick={() => setPage(p => p - 1)}
                disabled={!hasPrevious || isLoading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>

              <div className="user-management-page-numbers">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`user-management-page-number ${page === i + 1 ? "user-management-page-active" : ""}`}
                    onClick={() => setPage(i + 1)}
                    disabled={isLoading}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                className="user-management-pagination-btn user-management-pagination-next"
                onClick={() => setPage(p => p + 1)}
                disabled={!hasNext || isLoading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
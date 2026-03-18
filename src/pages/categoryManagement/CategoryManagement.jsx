import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, deleteCategory } from '../../store/actions/adminActions';
import { fetchCategories as fetchCategoriesForBuyer } from '../../store/actions/AuctionsActions';
import { adminService } from '../../services/interceptors/admin.service';
import { toast } from 'react-toastify';
import './CategoryManagement.css';

export default function CategoryManagement() {
  const dispatch = useDispatch();
  const { categories: categoriesFromStore, isLoading } = useSelector((state) => state.admin);
  const features = useSelector((state) => state.permissions?.features);
  const manageCategoriesPerm = features?.manage_categories || {};

  const canCreateCategories = manageCategoriesPerm?.create === true;
  const canUpdateCategories = manageCategoriesPerm?.update === true;
  const canDeleteCategories = manageCategoriesPerm?.delete === true;

  const shouldShowActionsColumn = canUpdateCategories || canDeleteCategories;
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/manager') ? '/manager' : '/admin';

  // Fetch categories on component mount
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Transform API data to match component structure
  const categories = Array.isArray(categoriesFromStore) ? categoriesFromStore.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || '',
    status: cat.is_active !== undefined ? cat.is_active : true,
    items: 0, // API doesn't provide items count
    icon: '📦'
  })) : [];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [togglingCategoryId, setTogglingCategoryId] = useState(null);

  const handleStatusToggle = async (id) => {
    if (!canUpdateCategories) return;
    const category = categories.find(cat => cat.id === id);
    console.log("category: ", category);
    
    if (!category) return;

    // Prevent multiple toggles
    if (togglingCategoryId === id) return;

    setTogglingCategoryId(id);
    const newStatus = !category.status;

    try {
      await adminService.toggleCategory(id, {
        id: id,
        name: category.name,
        is_active: newStatus
      });
      
      toast.success(`Category ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      // Refresh categories in both admin and buyer stores (Buy tab uses state.buyer.categories)
      dispatch(fetchCategories());
      dispatch(fetchCategoriesForBuyer());
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error ||
                     'Failed to toggle category status';
      toast.error(message);
    } finally {
      setTogglingCategoryId(null);
    }
  };

  const handleEdit = (id) => {
    if (!canUpdateCategories) return;
    // Store category ID in localStorage to pass to edit flow
    localStorage.setItem('editingCategoryId', id.toString());
    // Find the category to get its name
    const category = categories.find(cat => cat.id === id);
    if (category) {
      localStorage.setItem('pendingCategoryName', category.name);
    }
    navigate(`${basePath}/edit-category`);
  };

  const handleDelete = async (id) => {
    if (!canDeleteCategories) return;
    if (window.confirm('Are you sure you want to delete this category?\n\nThis will permanently remove the category and all associated products and auctions.'
)) {
      try {
        await dispatch(deleteCategory(id)).unwrap();
        // Refresh categories in both admin and buyer stores (Buy tab uses state.buyer.categories)
        dispatch(fetchCategories());
        dispatch(fetchCategoriesForBuyer());
      } catch (error) {
        // Error is already handled by the action (toast notification)
        console.error('Failed to delete category:', error);
      }
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

  

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="category-dashboard-page">
      <main className="category-dashboard-main">
        <div className="category-dashboard-container">
          <div className="category-section-header">
            <div className="category-header-content">
              <h1 className="category-page-title">Category Management</h1>
              <p className="category-page-subtitle">Manage auction categories and their visibility status</p>
            </div>
            <div className="category-header-actions">
              {canCreateCategories && (
                <button className="category-primary-action-btn" onClick={() => navigate(`${basePath}/add-category`)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  New Category
                </button>
              )}
            </div>
          </div>

          <div className="category-stats-grid">
            <div className="category-stat-card">
              <div className="category-card-bg-gradient" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)' }}></div>
              <div className="category-card-icon-container">
                <div className="category-card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 17L12 22L22 17" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 12L12 17L22 12" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div className="category-card-content">
                <span className="card-label">Total Categories</span>
                <h3 className="category-card-value">{categories.length}</h3>
              </div>
            </div>

            <div className="category-stat-card">
              <div className="category-card-bg-gradient" style={{ background: 'linear-gradient(135deg, rgba(140, 198, 63, 0.2) 0%, rgba(140, 198, 63, 0.05) 100%)' }}></div>
              <div className="category-card-icon-container">
                <div className="category-card-icon" style={{ backgroundColor: 'rgba(140, 198, 63, 0.15)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#8CC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="22 4 12 14.01 9 11.01" stroke="#8CC63F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div className="category-card-content">
                <span className="card-label">Active Categories</span>
                <h3 className="category-card-value">{categories.filter(cat => cat.status).length}</h3>
              </div>
            </div>

            <div className="category-stat-card">
              <div className="category-card-bg-gradient" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)' }}></div>
              <div className="category-card-icon-container">
                <div className="category-card-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div className="category-card-content">
                <span className="card-label">Inactive Categories</span>
                <h3 className="category-card-value">{categories.filter(cat => !cat.status).length}</h3>
              </div>
            </div>

            {/* Total Items box commented out */}
            {/* <div className="category-stat-card">
              <div className="category-card-bg-gradient" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.05) 100%)' }}></div>
              <div className="category-card-icon-container">
                <div className="category-card-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="14" y="3" width="7" height="7" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="14" y="14" width="7" height="7" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="3" y="14" width="7" height="7" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div className="category-card-content">
                <span className="card-label">Total Items</span>
                <h3 className="category-card-value">{categories.reduce((sum, cat) => sum + cat.items, 0)}</h3>
                <span className="category-card-change positive">0%</span>
              </div>
            </div> */}
          </div>

          <div className="category-data-table-section">
            <div className="category-table-header">
              <div className="category-search-container">
                <div className="category-search-input-wrapper">
                  <button className='admin-search-btn'>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="category-search-input"
                  />
                  {searchQuery && (
                    <button
                      className="category-clear-search"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="category-table-info">
                <span className="category-table-count">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCategories.length)} of {filteredCategories.length}
                </span>
              </div>
            </div>

            <div className="category-table-wrapper">
              <table className="category-data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>ID</th>
                    <th>Status</th>
                    {shouldShowActionsColumn && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentCategories.length > 0 ? (
                    currentCategories.map((category) => (
                      <tr key={category.id} className="category-table-row">
                        <td>
                          <div className="category-info">
                            <div className="category-icon-cell">
                              <span className="category-icon-emoji">{category.icon}</span>
                            </div>
                            <div className="category-details">
                              <h4 className="category-name">{category.name}</h4>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="category-id-cell">
                            <span className="category-id-text">CAT-{category.id.toString().padStart(3, '0')}</span>
                          </div>
                        </td>
                        <td>
                          <div className="category-status-cell">
                            <div
                              className={`category-status-toggle ${category.status ? 'active' : ''} ${togglingCategoryId === category.id ? 'toggling' : ''}`}
                              onClick={() => canUpdateCategories && handleStatusToggle(category.id)}
                              style={{
                                cursor: !canUpdateCategories
                                  ? 'not-allowed'
                                  : togglingCategoryId === category.id
                                    ? 'wait'
                                    : 'pointer',
                                opacity: !canUpdateCategories ? 0.6 : 1,
                              }}
                            >
                              <div className="category-toggle-handle"></div>
                            </div>
                            <span className={`category-status-label ${category.status ? 'active' : 'inactive'}`}>
                              {togglingCategoryId === category.id ? 'Updating...' : (category.status ? 'Active' : 'Inactive')}
                            </span>
                          </div>
                        </td>
                        {shouldShowActionsColumn && (
                          <td>
                            <div className="category-action-buttons">
                              {canUpdateCategories && (
                                <button
                                  className="category-action-btn category-edit-btn"
                                  onClick={() => handleEdit(category.id)}
                                  title="Edit category"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                              )}
                              {canDeleteCategories && (
                                <button
                                  className="category-action-btn category-delete-btn"
                                  onClick={() => handleDelete(category.id)}
                                  title="Delete category"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={shouldShowActionsColumn ? 4 : 3}>
                        <div className="category-empty-state">
                          <div className="category-empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <h3>No categories found</h3>
                          <p>Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredCategories.length > itemsPerPage && (
              <div className="category-pagination">
                <button
                  className="category-pagination-btn category-prev-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Previous
                </button>

                <div className="category-page-numbers">
                  {generatePageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`dots-${index}`} className="category-page-dots">...</span>
                    ) : (
                      <button
                        key={page}
                        className={`category-page-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                <button
                  className="category-pagination-btn category-next-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
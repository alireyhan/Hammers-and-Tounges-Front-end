import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ManagerCreateCategory.css';

const ManagerCreateCategory = () => {
    const [categoryData, setCategoryData] = useState({
        name: ''
    });

    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const location = useLocation();

    const basePath = location.pathname.startsWith('/manager') ? '/manager' : '/admin';
    
    // Check if we're in edit mode
    const isEditMode = location.pathname === `${basePath}/edit-category`;
    const editingCategoryId = isEditMode ? localStorage.getItem('editingCategoryId') : null;

    // Load category name if in edit mode
    useEffect(() => {
        if (isEditMode && editingCategoryId) {
            const pendingName = localStorage.getItem('pendingCategoryName');
            if (pendingName) {
                setCategoryData({ name: pendingName });
            }
        } else {
            // Clear any edit mode data if in create mode
            localStorage.removeItem('editingCategoryId');
            localStorage.removeItem('pendingCategoryName');
        }
    }, [isEditMode, editingCategoryId]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCategoryData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };


    const handleNext = () => {
        // Validate name field
        if (!categoryData.name.trim()) {
            setErrors({ name: 'Category name is required' });
            return;
        }

        // Store category name in localStorage to pass to next step
        localStorage.setItem('pendingCategoryName', categoryData.name);
        navigate(`${basePath}/product-fields`);
    };

    return (
        <div className="create-category-page">
            <main className="create-category-main">
                <div className="create-category-container">
                    <div className="add-category-header">
                        <div className="header-content">
                            <h1 className="add-category-page-title">
                                {isEditMode ? 'Edit Category' : 'Create New Category'}
                            </h1>
                            <p className="add-category-page-subtitle">
                                {isEditMode 
                                    ? 'Update the category name and manage its product fields'
                                    : 'Add a new auction category with custom settings and product fields'
                                }
                            </p>
                        </div>
                        <div className="header-actions">
                            <button className="add-category-secondary-btn" onClick={() => {
                                // Clear edit mode data when canceling
                                if (isEditMode) {
                                    localStorage.removeItem('editingCategoryId');
                                    localStorage.removeItem('pendingCategoryName');
                                }
                                navigate(`${basePath}/category`);
                            }}>
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div className="category-form-section">
                        <div className="form-card">
                            <div className="form-content">
                                <div className="form-grid">
                                    <div>
                                        <label className="form-label required">Category Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={categoryData.name}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Vehicles, Electronics, Furniture"
                                            className={`form-input ${errors.name ? 'error' : ''}`}
                                        />
                                        {errors.name && (
                                            <span className="error-message">{errors.name}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="primary-action-btn"
                                        onClick={handleNext}
                                        disabled={!categoryData.name.trim()}
                                    >
                                        Next
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ManagerCreateCategory;
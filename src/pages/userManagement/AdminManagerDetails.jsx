import React, { useEffect, useState, useMemo } from "react";
import "./AdminManagerDetails.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsersList, performUserAction } from "../../store/actions/adminActions";
import { clearActionSuccess } from "../../store/slices/adminSlice";
import { adminService } from "../../services/interceptors/admin.service";
import { toast } from "react-toastify";
import { getMediaUrl } from "../../config/api.config";

const AdminManagerDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const { users, isLoading, isPerformingAction, actionSuccess } = useSelector((state) => state.admin);

  const basePath = location.pathname.startsWith("/manager") ? "/manager" : "/admin";

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    image: null,
    imagePreview: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);

  // Fetch users on component mount - fetch all pages to find user
  useEffect(() => {
    const fetchAllUsers = async () => {
      setIsFetchingUsers(true);
      let allResults = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const result = await dispatch(fetchUsersList({ page: currentPage })).unwrap();
        if (result?.results) {
          allResults = [...allResults, ...result.results];
          // Check if the user is found in current results
          const foundUser = allResults.find(user => user.id === parseInt(id));
          if (foundUser) {
            // User found, no need to fetch more pages
            break;
          }
        }
        hasMore = result?.has_next || false;
        currentPage++;
      }
      
      setAllUsers(allResults);
      setIsFetchingUsers(false);
    };

    fetchAllUsers();
  }, [dispatch, id]);

  // Refresh users list after successful action
  useEffect(() => {
    if (actionSuccess) {
      dispatch(fetchUsersList());
      dispatch(clearActionSuccess());
    }
  }, [actionSuccess, dispatch]);

  // Find the selected manager by ID from all fetched users
  const selectedManager = useMemo(() => {
    if (!allUsers || allUsers.length === 0) return null;
    return allUsers.find((user) => user.id === parseInt(id));
  }, [allUsers, id]);

  // Initialize form data when manager is loaded
  useEffect(() => {
    if (selectedManager) {
      const fullName = selectedManager.full_name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData({
        first_name: firstName,
        last_name: lastName,
        email: selectedManager.email || '',
        password: '',
        image: null,
        imagePreview: getMediaUrl(selectedManager.profile?.image) || null,
      });
    }
  }, [selectedManager]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);
    try {
      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        // Email is not included as it cannot be edited
      };

      if (formData.password.trim()) {
        updateData.password = formData.password.trim();
      }

      if (formData.image) {
        updateData.image = formData.image;
      }

      await adminService.updateUser(selectedManager.id, updateData);
      toast.success('Manager details updated successfully!');
      await dispatch(fetchUsersList({ page: 1 })).unwrap();
      navigate(`${basePath}/users`, { state: { role: "manager" } });
    } catch (error) {
      const message = error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update manager details';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (selectedManager) {
      const fullName = selectedManager.full_name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData({
        first_name: firstName,
        last_name: lastName,
        email: selectedManager.email || '',
        password: '',
        image: null,
        imagePreview: getMediaUrl(selectedManager.profile?.image) || null,
      });
    }
    setIsEditing(false);
    setFormErrors({});
  };

  const handleSuspendManager = async () => {
    if (window.confirm('Are you sure you want to suspend this manager?')) {
      try {
        await dispatch(performUserAction({
          type: 'SUSPEND_MANAGER',
          target_id: selectedManager.id,
        })).unwrap();
        await dispatch(fetchUsersList({ page: 1 })).unwrap();
        navigate(`${basePath}/users`, { state: { role: "manager" } });
      } catch (err) {
        // Toast already shown by performUserAction
      }
    }
  };

  const handleActivateManager = async () => {
    if (window.confirm('Are you sure you want to activate this manager?')) {
      try {
        await dispatch(performUserAction({
          type: 'PROMOTE_TO_MANAGER',
          target_id: selectedManager.id,
        })).unwrap();
        await dispatch(fetchUsersList({ page: 1 })).unwrap();
        navigate(`${basePath}/users`, { state: { role: "manager" } });
      } catch (err) {
        // Toast already shown by performUserAction
      }
    }
  };

  // Loading state
  if (isLoading || isFetchingUsers) {
    return (
      <div className="manager-details-page">
        <div className="manager-details-loading">
          <div className="manager-details-loading-spinner"></div>
          <p>Loading manager data...</p>
        </div>
      </div>
    );
  }

  // Manager not found state
  if (!selectedManager) {
    return (
      <div className="manager-details-page">
        <div className="manager-details-not-found">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="currentColor"
            />
          </svg>
          <h3>Manager Not Found</h3>
          <p>The selected manager could not be found. Please return to the user list and try again.</p>
          <button className="manager-details-btn-primary" onClick={() => navigate(`${basePath}/users`, { state: { role: "manager" } })}>
            Back to Users List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-details-page">
      <header className="manager-details-header">
        <div>
          <h1 className="manager-details-title">Manager Details</h1>
          <p className="manager-details-subtitle">
            View and manage manager information and account settings.
          </p>
        </div>
        <span className={`manager-details-status ${selectedManager.is_active ? "active" : "inactive"}`}>
          {selectedManager.is_active ? "ACTIVE" : "INACTIVE"}
        </span>
      </header>

      <div className="manager-details-content">
        <div className="manager-details-card">
          <div className="manager-details-card-header">
            <h3>Manager Information</h3>
            {!isEditing && (
              <button
                className="manager-details-edit-btn"
                onClick={() => setIsEditing(true)}
                disabled={isPerformingAction}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" />
                </svg>
                Edit Details
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="manager-details-edit-form">
              <div className="manager-details-form-row">
                <div className="manager-details-form-group">
                  <label>First Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={formErrors.first_name ? 'error' : ''}
                    disabled={isUpdating}
                  />
                  {formErrors.first_name && (
                    <span className="error-message">{formErrors.first_name}</span>
                  )}
                </div>
                <div className="manager-details-form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div className="manager-details-form-group">
                <label>Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="read-only-field"
                />
                <small className="form-hint">Email cannot be edited</small>
              </div>

              <div className="manager-details-form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Leave blank to keep current password"
                  disabled={isUpdating}
                />
                <small className="form-hint">Leave blank to keep current password</small>
              </div>

              <div className="manager-details-form-group">
                <label>Profile Image</label>
                <div className="manager-details-image-upload">
                  {formData.imagePreview && (
                    <div className="manager-details-image-preview">
                      <img src={formData.imagePreview} alt="Preview" />
                    </div>
                  )}
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isUpdating}
                    className="manager-details-file-input"
                  />
                  <label htmlFor="image-upload" className="manager-details-file-label">
                    {formData.imagePreview ? 'Change Image' : 'Upload Image'}
                  </label>
                </div>
              </div>

              <div className="manager-details-form-actions">
                <button
                  className="manager-details-btn-primary"
                  onClick={handleSave}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <span className="manager-details-spinner"></span>
                      Saving...
                    </>
                  ) : "Save Changes"}
                </button>
                <button
                  className="manager-details-btn-secondary"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="manager-details-info-grid">
              <div className="manager-details-info-item">
                <label>Full Name</label>
                <span>{selectedManager.full_name || "N/A"}</span>
              </div>
              <div className="manager-details-info-item">
                <label>Email Address</label>
                <span>{selectedManager.email || "N/A"}</span>
              </div>
              <div className="manager-details-info-item">
                <label>Account Status</label>
                <span className={selectedManager.is_active ? "status-active" : "status-inactive"}>
                  {selectedManager.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="manager-details-info-item">
                <label>Email Verified</label>
                <span className={selectedManager.is_email_verified ? "status-active" : "status-inactive"}>
                  {selectedManager.is_email_verified ? "Yes" : "No"}
                </span>
              </div>
              <div className="manager-details-info-item">
                <label>Account Creation</label>
                <span>{formatDate(selectedManager.date_joined)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="manager-details-card">
          <h3>Account Actions</h3>
          <div className="manager-details-actions">
            {selectedManager.is_active ? (
              <button
                className="manager-details-btn-danger"
                onClick={handleSuspendManager}
                disabled={isPerformingAction || isEditing}
              >
                {isPerformingAction ? (
                  <>
                    <span className="manager-details-spinner white"></span>
                    Suspending...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Suspend Manager
                  </>
                )}
              </button>
            ) : (
              <button
                className="manager-details-btn-success"
                onClick={handleActivateManager}
                disabled={isPerformingAction || isEditing}
              >
                {isPerformingAction ? (
                  <>
                    <span className="manager-details-spinner white"></span>
                    Activating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Activate Manager
                  </>
                )}
              </button>
            )}
            <button
              className="manager-details-btn-secondary"
              onClick={() => navigate(`${basePath}/users`, { state: { role: "manager" } })}
              disabled={isPerformingAction || isEditing}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManagerDetails;

import React, { useState } from "react";
import "./AdminCreateSeller.css";
import { useNavigate, useLocation } from "react-router-dom";
import { adminService } from "../../services/interceptors/admin.service";
import { toast } from "react-toastify";

const AdminCreateSeller = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    display_name: "",
    phone: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.password.trim()) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
    }
    if (!formData.display_name.trim()) {
      errors.display_name = "Display name is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const sellerData = {
        ...formData,
        image: imageFile,
      };
      await adminService.createSeller(sellerData);
      toast.success("Seller created successfully!");
      const basePath = location.pathname.startsWith("/manager") ? "/manager" : "/admin";
      navigate(`${basePath}/users`, { state: { role: "seller" } });
    } catch (error) {
      const apiMsg = error.response?.data?.message ||
        error.response?.data?.error ||
        (typeof error.response?.data?.detail === 'string' ? error.response.data.detail : null) ||
        (Array.isArray(error.response?.data?.detail) ? error.response.data.detail.map(d => d.msg || JSON.stringify(d)).join(', ') : null);
      const message = apiMsg || (error.message || "Failed to create seller");
      if (error.isNetworkError) {
        toast.error("Unable to connect to server. Please check your network and that the API is running.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    const basePath = location.pathname.startsWith("/manager") ? "/manager" : "/admin";
    navigate(`${basePath}/users`, { state: { role: "seller" } });
  };

  return (
    <div className="create-seller-page">
      <header className="create-seller-header">
        <div>
          <h1 className="create-seller-title">Create Seller</h1>
          <p className="create-seller-subtitle">
            Add a new seller to the platform. All fields marked with * are
            required.
          </p>
        </div>
      </header>

      <div className="create-seller-content">
        <div className="create-seller-card">
          <form onSubmit={handleSubmit} className="create-seller-form">
            <div className="create-seller-form-row">
              <div className="create-seller-form-group">
                <label>
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={formErrors.first_name ? "error" : ""}
                  disabled={isCreating}
                  placeholder="Enter first name"
                />
                {formErrors.first_name && (
                  <span className="error-message">{formErrors.first_name}</span>
                )}
              </div>
              <div className="create-seller-form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  disabled={isCreating}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="create-seller-form-group">
              <label>
                Display Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                className={formErrors.display_name ? "error" : ""}
                disabled={isCreating}
                placeholder="Business or display name"
              />
              {formErrors.display_name && (
                <span className="error-message">
                  {formErrors.display_name}
                </span>
              )}
            </div>

            <div className="create-seller-form-row">
              <div className="create-seller-form-group">
                <label>
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={formErrors.email ? "error" : ""}
                  disabled={isCreating}
                  placeholder="Enter email address"
                />
                {formErrors.email && (
                  <span className="error-message">{formErrors.email}</span>
                )}
              </div>
              <div className="create-seller-form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={isCreating}
                  placeholder="e.g. +923001234567"
                />
              </div>
            </div>

            <div className="create-seller-form-group">
              <label>Password <span className="required">*</span></label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={formErrors.password ? "error" : ""}
                disabled={isCreating}
                placeholder="Enter password (min. 8 characters)"
              />
              {formErrors.password && (
                <span className="error-message">{formErrors.password}</span>
              )}
              <small className="form-hint">
                Password must be at least 8 characters long
              </small>
            </div>

            <div className="create-seller-form-group">
              <label>Profile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isCreating}
                className="create-seller-file-input"
              />
              {imageFile && (
                <small className="form-hint">
                  Selected: {imageFile.name}
                </small>
              )}
            </div>

            <div className="create-seller-form-actions">
              <button
                type="submit"
                className="create-seller-btn-primary"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <span className="create-seller-spinner"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 5V19M5 12H19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Create Seller
                  </>
                )}
              </button>
              <button
                type="button"
                className="create-seller-btn-secondary"
                onClick={handleCancel}
                disabled={isCreating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateSeller;

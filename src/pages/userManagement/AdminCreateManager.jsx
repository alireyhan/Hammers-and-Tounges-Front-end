import React, { useState } from "react";
import "./AdminCreateManager.css";
import { useNavigate, useLocation } from "react-router-dom";
import { adminService } from "../../services/interceptors/admin.service";
import { toast } from "react-toastify";

const AdminCreateManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    display_name: "",
    phone: ""
  });
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    try {
      const managerData = {
        email: formData.email.trim(),
        password: formData.password.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        display_name: formData.display_name.trim(),
        phone: formData.phone.trim()
      };
      await adminService.createManager(managerData);
      toast.success("Manager created successfully!");
      const basePath = location.pathname.startsWith("/manager") ? "/manager" : "/admin";
      navigate(`${basePath}/users`, { state: { role: "manager" } });
    } catch (error) {
      const data = error.response?.data;
      let message = "Failed to create manager";

      if (data) {
        // Django-style field errors: { email: ["A user with that email already exists."] }
        if (data.email) {
          message = Array.isArray(data.email) ? data.email[0] : data.email;
        } else if (data.phone) {
          message = Array.isArray(data.phone) ? data.phone[0] : data.phone;
        } else if (data.detail) {
          message = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        } else if (data.message) {
          message = data.message;
        } else if (data.error) {
          message = data.error;
        }
      }

      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    const basePath = location.pathname.startsWith("/manager") ? "/manager" : "/admin";
    navigate(`${basePath}/users`, { state: { role: "manager" } });
  };

  return (
    <div className="create-manager-page">
      <header className="create-manager-header">
        <div>
          <h1 className="create-manager-title">Create Manager</h1>
          <p className="create-manager-subtitle">
            Add a new manager to the platform. All fields marked with * are
            required.
          </p>
        </div>
      </header>

      <div className="create-manager-content">
        <div className="create-manager-card">
          <form onSubmit={handleSubmit} className="create-manager-form">
            <div className="create-manager-form-row">
              <div className="create-manager-form-group">
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
              <div className="create-manager-form-group">
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

            <div className="create-manager-form-group">
              <label>Display Name</label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                disabled={isCreating}
                placeholder="e.g. Hamza Traders"
              />
            </div>

            <div className="create-manager-form-group">
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

            <div className="create-manager-form-group">
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

            <div className="create-manager-form-group">
              <label>
                Password <span className="required">*</span>
              </label>
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

            <div className="create-manager-form-actions">
              <button
                type="submit"
                className="create-manager-btn-primary"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <span className="create-manager-spinner"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Create Manager
                  </>
                )}
              </button>
              <button
                type="button"
                className="create-manager-btn-secondary"
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

export default AdminCreateManager;

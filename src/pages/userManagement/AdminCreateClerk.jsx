import React, { useState, useCallback } from "react";
import "./AdminCreateManager.css";
import { useNavigate, useLocation } from "react-router-dom";
import { adminService } from "../../services/interceptors/admin.service";
import { toast } from "react-toastify";

const AdminCreateClerk = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    display_name: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (formErrors[name]) {
        setFormErrors((prev) => ({ ...prev, [name]: "" }));
      }
    },
    [formErrors]
  );

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
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const first = formData.first_name.trim();
      const last = formData.last_name.trim();
      const displayName = formData.display_name.trim() || [first, last].filter(Boolean).join(" ");

      await adminService.createClerk({
        email: formData.email.trim(),
        password: formData.password.trim(),
        first_name: first,
        last_name: last,
        display_name: displayName,
      });

      toast.success("Clerk created successfully!");
      const basePath = location.pathname.startsWith("/manager") ? "/manager" : "/admin";
      navigate(`${basePath}/users`, { state: { role: "clerk" } });
    } catch (error) {
      const data = error?.response?.data;
      let message = "Failed to create clerk";
      if (data) {
        if (data.email) {
          message = Array.isArray(data.email) ? data.email[0] : data.email;
        } else if (data.password) {
          message = Array.isArray(data.password) ? data.password[0] : data.password;
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
    navigate(`${basePath}/users`, { state: { role: "clerk" } });
  };

  return (
    <div className="create-manager-page">
      <header className="create-manager-header">
        <div>
          <h1 className="create-manager-title">Create Clerk</h1>
          <p className="create-manager-subtitle">
            Add a new clerk to the platform. All fields marked with * are required.
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
                placeholder="e.g. John Clerk"
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
                    Create Clerk
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

export default AdminCreateClerk;


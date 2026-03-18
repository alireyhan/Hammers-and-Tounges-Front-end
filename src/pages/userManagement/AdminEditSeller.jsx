import React, { useState, useEffect } from "react";
import "./AdminEditSeller.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { adminService } from "../../services/interceptors/admin.service";
import { fetchUsersList } from "../../store/actions/adminActions";
import { getMediaUrl } from "../../config/api.config";
import { toast } from "react-toastify";

const AdminEditSeller = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.admin);

  const basePath = location.pathname.startsWith("/manager") ? "/manager" : "/admin";

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    phone: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [seller, setSeller] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Resolve seller from location state or fetch from users list
  useEffect(() => {
    const stateUser = location.state?.user;
    if (stateUser && stateUser.id === parseInt(id)) {
      setSeller(stateUser);
      setFormData({
        first_name: stateUser.full_name?.split(" ")[0] || stateUser.profile?.display_name?.split(" ")[0] || "",
        last_name: stateUser.full_name?.split(" ").slice(1).join(" ") || stateUser.profile?.display_name?.split(" ").slice(1).join(" ") || "",
        display_name: stateUser.profile?.display_name || "",
        phone: stateUser.profile?.phone || "",
      });
      setIsLoading(false);
      return;
    }

    const fetchUser = async () => {
      let allResults = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const result = await dispatch(fetchUsersList({ page: currentPage })).unwrap();
        if (result?.results) {
          allResults = [...allResults, ...result.results];
          const found = allResults.find((u) => u.id === parseInt(id));
          if (found) {
            setSeller(found);
            setFormData({
              first_name: found.full_name?.split(" ")[0] || found.profile?.display_name?.split(" ")[0] || "",
              last_name: found.full_name?.split(" ").slice(1).join(" ") || found.profile?.display_name?.split(" ").slice(1).join(" ") || "",
              display_name: found.profile?.display_name || "",
              phone: found.profile?.phone || "",
            });
            break;
          }
        }
        hasMore = result?.has_next || false;
        currentPage++;
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [dispatch, id, location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files?.[0] || null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.display_name.trim()) {
      errors.display_name = "Display name is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const patchData = {
        email: seller.email,
        role: "seller",
      };
      if (formData.first_name.trim()) patchData.first_name = formData.first_name.trim();
      if (formData.last_name.trim()) patchData.last_name = formData.last_name.trim();
      if (formData.display_name.trim()) patchData.display_name = formData.display_name.trim();
      if (formData.phone.trim()) patchData.phone = formData.phone.trim();
      if (imageFile) patchData.image = imageFile;

      await adminService.updateSeller(id, patchData);
      toast.success("Seller updated successfully!");
      navigate(`${basePath}/users`, { state: { role: "seller" } });
    } catch (error) {
      const apiData = error.response?.data;
      let message = apiData?.message || apiData?.error;
      if (!message && typeof apiData?.detail === 'string') message = apiData.detail;
      if (!message && Array.isArray(apiData?.detail)) {
        message = apiData.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      }
      if (!message && apiData && typeof apiData === 'object' && !Array.isArray(apiData)) {
        const fieldErrors = Object.entries(apiData)
          .filter(([, v]) => v && (Array.isArray(v) ? v.length : true))
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        if (fieldErrors.length) message = fieldErrors.join('; ');
      }
      toast.error(message || "Failed to update seller");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`${basePath}/users`, { state: { role: "seller" } });
  };

  if (isLoading) {
    return (
      <div className="edit-seller-page">
        <div className="edit-seller-loading">
          <div className="edit-seller-spinner"></div>
          <p>Loading seller...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="edit-seller-page">
        <div className="edit-seller-error">
          <p>Seller not found.</p>
          <button className="edit-seller-btn-secondary" onClick={() => navigate(`${basePath}/users`, { state: { role: "seller" } })}>
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-seller-page">
      <header className="edit-seller-header">
        <div>
          <h1 className="edit-seller-title">Edit Seller</h1>
          <p className="edit-seller-subtitle">
            Update seller profile. Email: {seller.email}
          </p>
        </div>
      </header>

      <div className="edit-seller-content">
        <div className="edit-seller-card">
          <form onSubmit={handleSubmit} className="edit-seller-form">
            <div className="edit-seller-form-row">
              <div className="edit-seller-form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  placeholder="Enter first name"
                />
              </div>
              <div className="edit-seller-form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="edit-seller-form-group">
              <label>
                Display Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                className={formErrors.display_name ? "error" : ""}
                disabled={isSaving}
                placeholder="Business or display name"
              />
              {formErrors.display_name && (
                <span className="error-message">{formErrors.display_name}</span>
              )}
            </div>

            <div className="edit-seller-form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={isSaving}
                placeholder="e.g. +923001234567"
              />
            </div>

            <div className="edit-seller-form-group">
              <label>Profile Image</label>
              {seller.profile?.image && (
                <div className="edit-seller-current-image">
                  <img
                    src={getMediaUrl(seller.profile.image)}
                    alt="Current"
                    width="80"
                    height="80"
                  />
                  <span>Current image</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSaving}
                className="edit-seller-file-input"
              />
              {imageFile && (
                <small className="form-hint">New: {imageFile.name}</small>
              )}
            </div>

            <div className="edit-seller-form-actions">
              <button
                type="submit"
                className="edit-seller-btn-primary"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="edit-seller-spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                className="edit-seller-btn-secondary"
                onClick={handleCancel}
                disabled={isSaving}
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

export default AdminEditSeller;

import React, { useState, useEffect, useCallback } from "react";
import "./BuyerProfile.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchProfile, updateProfile } from "../store/actions/profileActions";

const BuyerProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get profile data from Redux store
  const {
    profile: profileData,
    loading,
    error
  } = useSelector((state) => state.profile);
  const authUser = useSelector((state) => state.auth.user);
  const effectiveProfile = profileData || authUser || null;

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  // State for image preview
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch profile on component mount
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // If a payment gateway redirects back to Profile with `?payment=...`,
  // forward it to the dedicated Wallet tab.
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const payment = params.get("payment");
    if (!payment) return;
    navigate(`/buyer/wallet${location.search || ""}`, { replace: true });
  }, [location.search, navigate]);

  const handleRetry = useCallback(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Update formData when profileData changes from API
  useEffect(() => {
    if (effectiveProfile) {
      setFormData({
        firstName: effectiveProfile.first_name || effectiveProfile.firstName || "",
        lastName: effectiveProfile.last_name || effectiveProfile.lastName || "",
        email: effectiveProfile.email || "",
        phone: effectiveProfile.phone || ""
      });
    }
  }, [effectiveProfile]);

  const getDisplayName = useCallback(() => {
    return `${formData.firstName} ${formData.lastName}`.trim() || "Buyer";
  }, [formData.firstName, formData.lastName]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSecurityChange = (e) => {
    setSecurityData({
      ...securityData,
      [e.target.name]: e.target.value
    });
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle save - saves everything in one call
  const handleSave = useCallback(async () => {
    try {
      // Prepare data for API - convert camelCase to snake_case
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        email: formData.email
      };

      await dispatch(updateProfile(updateData));
      setIsEditing(false);

      // Refresh profile data
      dispatch(fetchProfile());
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }, [formData, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Saving profile:", formData);
    setIsEditing(false);
  };

  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    console.log("Updating security:", securityData);
    setSecurityData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  // Loading/error states - must be after all hooks to avoid "fewer hooks" error
  if (loading && !effectiveProfile) {
    return (
      <>
        <div className="buyer-profile-container">
          <div className="buyer-profile-loading">
            <div className="buyer-profile-spinner" />
            <p>Loading your profile...</p>
          </div>
        </div>
      </>
    );
  }
  if (error && !effectiveProfile) {
    return (
      <>
        <div className="buyer-profile-container">
          <div className="buyer-profile-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3>Unable to load profile</h3>
            <p>{error?.message || error?.detail || 'Failed to fetch your profile. Please check your connection and try again.'}</p>
            <button className="b-action-btn b-primary" onClick={handleRetry}>
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <div className="buyer-profile-container">
      <div className="profile-header">
        <div className="header-content">
          <h1 className="profile-title">Buyer Profile</h1>
          <p className="profile-subtitle">
            Manage your account, track bids, and grow your collection
          </p>
        </div>
        <div className="header-actions">
          {isEditing && (
            <button
              className="b-action-btn b-secondary"
              onClick={() => setIsEditing(false)}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Go back to profile
            </button>
          )}
          <button
            className={`b-action-btn ${isEditing ? "b-primary" : "b-primary"}`}
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={loading}
          >
            {isEditing ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Save Changes
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                Edit Profile
              </>
            )}
          </button>
        </div>
      </div>

      <div className="profile-main">
        <div className="profile-left">
          <div className="profile-card">
            <div className="profile-avatar-section">
              <div className="profile-info">
                <h2 className="profile-name">{getDisplayName()}</h2>
                <p className="profile-email">{formData.email}</p>
                {/* <div className="verification-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Gold Buyer
                </div> */}
              </div>
            </div>

            {/* <div className="profile-stats-grid">
              <div className="stat-card">
                <div className="stat-icon bids">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 19H7C5.89543 19 5 18.1046 5 17V10C5 8.89543 5.89543 8 7 8H9M15 19H17C18.1046 19 19 18.1046 19 17V10C19 8.89543 18.1046 8 17 8H15M9 19V5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V19M9 19H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formData.totalBids}</div>
                  <div className="stat-label">Total Bids</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon won">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formData.wonAuctions}</div>
                  <div className="stat-label">Won Auctions</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon success">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formData.successRate}</div>
                  <div className="stat-label">Success Rate</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon spent">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-value">$24,580</div>
                  <div className="stat-label">Total Spent</div>
                </div>
              </div>
            </div> */}
          </div>

          {/* <div className="quick-stats-card">
            <h3 className="card-title">Activity Overview</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Active Bids</span>
                <span className="stat-value primary">12</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Won This Month</span>
                <span className="stat-value">8</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Saved Items</span>
                <span className="stat-value success">15</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Member Since</span>
                <span className="stat-value warning">{formData.memberSince}</span>
              </div>
            </div>
          </div> */}
        </div>

        <div className="profile-right">
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            {/* <button
              className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              Contact Info
            </button>
            <button
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button
              className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </button> */}
            <button
              className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "overview" && (
              <div className="overview-content">
                <div className="info-section">
                  <h3 className="section-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle
                        cx="12"
                        cy="7"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    Personal Information
                  </h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>First Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={formData.firstName}
                          onChange={(e) =>
                            handleInputChange("firstName", e.target.value)
                          }
                        />
                      ) : (
                        <div className="info-value">
                          {formData.firstName || "-"}
                        </div>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Last Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={formData.lastName}
                          onChange={(e) =>
                            handleInputChange("lastName", e.target.value)
                          }
                        />
                      ) : (
                        <div className="info-value">
                          {formData.lastName || "-"}
                        </div>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Email Address</label>
                      {isEditing ? (
                        <input
                          type="email"
                          className="edit-input"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                        />
                      ) : (
                        <div className="info-value">
                          {formData.email || "-"}
                        </div>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Phone Number</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          className="edit-input"
                          value={formData.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                        />
                      ) : (
                        <div className="info-value">
                          {formData.phone || "-"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* <div className="info-section">
                  <h3 className="section-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Recent Activity
                  </h3>
                  <div className="activity-list">
                    {recentActivity.map(activity => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-icon">
                          <div className={`icon-circle ${activity.status}`}>
                            {activity.status === 'active' && '🔄'}
                            {activity.status === 'won' && '✓'}
                            {activity.status === 'lost' && '✗'}
                            {activity.status === 'saved' && '💾'}
                            {activity.status === 'joined' && '👥'}
                          </div>
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">{activity.action} {activity.item}</div>
                          <div className="activity-meta">
                            {activity.amount && <span>{activity.amount}</span>}
                            <span className="activity-time">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div> */}
              </div>
            )}

            {activeTab === "security" && (
              <div className="security-content">
                <div className="info-section">
                  <h3 className="section-title">Password & Security</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Current Password</label>
                      <input
                        type="password"
                        className="edit-input"
                        value={securityData.currentPassword}
                        onChange={handleSecurityChange}
                        name="currentPassword"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="info-item">
                      <label>New Password</label>
                      <input
                        type="password"
                        className="edit-input"
                        value={securityData.newPassword}
                        onChange={handleSecurityChange}
                        name="newPassword"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="info-item">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        className="edit-input"
                        value={securityData.confirmPassword}
                        onChange={handleSecurityChange}
                        name="confirmPassword"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <button
                    className="b-action-btn primary-button b-primary"
                    onClick={handleSecuritySubmit}
                    style={{ marginTop: "1rem" }}
                  >
                    Update Password
                  </button>
                </div>

                <div className="info-section">
                  <h3 className="section-title">Two-Factor Authentication</h3>
                  <div className="settings-grid">
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>SMS Authentication</h4>
                        <p>Receive a code via SMS when signing in</p>
                      </div>
                      <label className="switch">
                        <input type="checkbox" defaultChecked />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Authenticator App</h4>
                        <p>Use Google Authenticator or similar app</p>
                      </div>
                      <button className="action-btn outline small">
                        Set Up
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="activity-content">
                <div className="info-section">
                  <h3 className="section-title">Bidding History</h3>
                  <div className="activity-list">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-icon">
                          <div className={`icon-circle ${activity.status}`}>
                            {activity.status === "active" && "🔄"}
                            {activity.status === "won" && "✓"}
                            {activity.status === "lost" && "✗"}
                            {activity.status === "saved" && "💾"}
                            {activity.status === "joined" && "👥"}
                          </div>
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">
                            {activity.action} {activity.item}
                          </div>
                          <div className="activity-meta">
                            {activity.amount && <span>{activity.amount}</span>}
                            <span className="activity-time">
                              {activity.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="settings-content">
                {/* <div className="info-section">
                  <h3 className="section-title">Account Settings</h3>
                  <div className="settings-grid">
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Email Notifications</h4>
                        <p>Receive email updates about bids and auctions</p>
                      </div>
                      <label className="switch">
                        <input type="checkbox" defaultChecked />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>SMS Notifications</h4>
                        <p>Get SMS alerts for important updates</p>
                      </div>
                      <label className="switch">
                        <input type="checkbox" />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Bid Reminders</h4>
                        <p>Get notified before auctions end</p>
                      </div>
                      <label className="switch">
                        <input type="checkbox" defaultChecked />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3 className="section-title">Preferences</h3>
                  <div className="preferences-grid">
                    <div className="preference-item">
                      <label>Currency</label>
                      <select className="preference-select">
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                      </select>
                    </div>
                    <div className="preference-item">
                      <label>Timezone</label>
                      <select className="preference-select">
                        <option>Eastern Time (ET)</option>
                        <option>Central Time (CT)</option>
                        <option>Pacific Time (PT)</option>
                      </select>
                    </div>
                    <div className="preference-item">
                      <label>Language</label>
                      <select className="preference-select">
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                    </div>
                  </div>
                </div> */}

                <div className="danger-zone">
                  <h3 className="section-title">Danger Zone</h3>
                  <div className="danger-actions">
                    <button className="b-danger-btn red">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M10 11v6M14 11v6M5 7h14M6 7l1-4h10l1 4M8 7v-4h8v4"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default BuyerProfile;

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import "./BuyerProfile.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchProfile, updateProfile } from "../store/actions/profileActions";
import { profileService } from "../services/interceptors/profile.service";

function listFromPaymentsHistoryPayload(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.results)) return raw.results;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.history)) return raw.history;
  if (Array.isArray(raw.payments)) return raw.payments;
  if (raw.data && typeof raw.data === "object" && Array.isArray(raw.data.results)) {
    return raw.data.results;
  }
  return [];
}

function pickPaymentRow(item, index) {
  if (!item || typeof item !== "object") return null;
  const amount =
    item.amount ??
    item.value ??
    item.total ??
    item.payment_amount ??
    item.paid_amount;
  const status = (item.status ?? item.state ?? item.payment_status ?? "").toString();
  const created =
    item.created_at ??
    item.created ??
    item.date ??
    item.timestamp ??
    item.updated_at;
  const title =
    item.description ??
    item.type ??
    item.payment_type ??
    item.reference ??
    (item.transaction_id != null ? String(item.transaction_id) : null) ??
    (item.id != null ? `Payment #${item.id}` : "Payment");
  return {
    key: String(item.id ?? item.uuid ?? item.reference ?? `row-${index}`),
    title: String(title),
    amount: amount != null && !Number.isNaN(Number(amount)) ? Number(amount) : null,
    status,
    created,
  };
}

function formatWalletCurrency(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return "$0.00";
  return `$${v.toFixed(2)}`;
}

function formatPaymentWhen(isoOrStr) {
  if (isoOrStr == null || isoOrStr === "") return "—";
  const d = new Date(isoOrStr);
  if (Number.isNaN(d.getTime())) return String(isoOrStr);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function paymentStatusClass(status) {
  const s = String(status).toLowerCase();
  if (/(success|completed|paid|complete|confirmed)/i.test(s)) return "wallet-history-status--success";
  if (/(pending|processing|init)/i.test(s)) return "wallet-history-status--pending";
  if (/(fail|error|cancel|declin)/i.test(s)) return "wallet-history-status--failed";
  return "wallet-history-status--neutral";
}

/**
 * Reads `payment` from the URL after a third-party checkout redirect.
 * Providers often append their own segment (e.g. `?payment=cancelled?ref=...`); we only
 * need the leading status token for the modal.
 */
function parsePaymentFromSearch(search) {
  const raw = (search && search.startsWith("?") ? search.slice(1) : search) || "";
  const params = new URLSearchParams(raw);
  let paymentRaw = params.get("payment");

  if (paymentRaw && paymentRaw.includes("?")) {
    paymentRaw = paymentRaw.slice(0, paymentRaw.indexOf("?")).trim();
  }

  const payment = (paymentRaw || "").trim().toLowerCase();
  if (!payment) return { modal: null };

  const successTokens = ["success", "completed", "complete", "paid", "succeeded", "ok"];
  const cancelTokens = ["cancelled", "canceled", "cancel"];
  const failTokens = ["failed", "fail", "error", "declined", "rejected"];

  if (successTokens.includes(payment)) return { modal: "success" };
  if (cancelTokens.includes(payment)) return { modal: "cancelled" };
  if (failTokens.includes(payment)) return { modal: "fail" };

  return { modal: null };
}

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

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  const [wallet, setWallet] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(true);
  const [paymentHistoryError, setPaymentHistoryError] = useState(null);
  /** Shown after payment redirect: success | fail | cancelled */
  const [paymentResultModal, setPaymentResultModal] = useState(null);
  const paymentModalPrimaryRef = useRef(null);

  // State for image preview
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const closePaymentModal = useCallback(() => {
    setPaymentResultModal(null);
  }, []);

  // Fetch profile on component mount
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    profileService
      .getWallet()
      .then((data) => {
        if (!cancelled) setWallet(data);
      })
      .catch(() => {
        if (!cancelled) setWallet(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPaymentHistoryLoading(true);
    setPaymentHistoryError(null);
    profileService
      .getPaymentsHistory()
      .then((raw) => {
        if (cancelled) return;
        const rows = listFromPaymentsHistoryPayload(raw)
          .map((item, i) => pickPaymentRow(item, i))
          .filter(Boolean);
        setPaymentHistory(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setPaymentHistory([]);
          setPaymentHistoryError(
            err?.response?.data?.detail ||
              err?.response?.data?.message ||
              err?.message ||
              "Could not load payment history."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPaymentHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const { modal } = parsePaymentFromSearch(location.search);
    if (!modal) return undefined;

    setPaymentResultModal(modal);
    setPaymentHistoryLoading(true);

    let cancelled = false;
    profileService
      .getWallet()
      .then((data) => {
        if (!cancelled) setWallet(data);
      })
      .catch(() => {
        if (!cancelled) setWallet(null);
      });
    profileService
      .getPaymentsHistory()
      .then((raw) => {
        if (cancelled) return;
        const rows = listFromPaymentsHistoryPayload(raw)
          .map((item, i) => pickPaymentRow(item, i))
          .filter(Boolean);
        setPaymentHistory(rows);
        setPaymentHistoryError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          setPaymentHistory([]);
          setPaymentHistoryError(
            err?.response?.data?.detail ||
              err?.response?.data?.message ||
              err?.message ||
              "Could not load payment history."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPaymentHistoryLoading(false);
      });

    navigate(location.pathname, { replace: true });

    return () => {
      cancelled = true;
    };
  }, [location.search, location.pathname, navigate]);

  useEffect(() => {
    if (!paymentResultModal) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closePaymentModal();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      paymentModalPrimaryRef.current?.focus();
    }, 0);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [paymentResultModal, closePaymentModal]);

  const handleRetry = useCallback(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Update formData when profileData changes from API
  useEffect(() => {
    if (profileData) {
      setFormData({
        firstName: profileData.first_name || "",
        lastName: profileData.last_name || "",
        email: profileData.email || "",
        phone: profileData.phone || ""
      });
    }
  }, [profileData]);

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

  const paymentModalCopy =
    paymentResultModal === "success"
      ? {
          title: "Payment successful",
          message:
            "Your funds are on the way. Wallet balances usually update within a few moments.",
          variant: "success",
        }
      : paymentResultModal === "cancelled"
        ? {
            title: "Payment cancelled",
            message:
              "You left checkout before completing payment. You have not been charged.",
            variant: "fail",
          }
        : paymentResultModal === "fail"
        ? {
            title: "Payment failed",
            message:
              "We could not complete this payment. Check your payment method and try again, or contact support if the issue continues.",
            variant: "fail",
          }
        : null;

  const paymentModalPortal =
    paymentModalCopy && typeof document !== "undefined"
      ? createPortal(
          <div
            className="buyer-payment-modal-overlay"
            role="presentation"
            onClick={closePaymentModal}
          >
            <div
              className={`buyer-payment-modal buyer-payment-modal--${paymentModalCopy.variant}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="buyer-payment-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="buyer-payment-modal__dismiss"
                aria-label="Close"
                onClick={closePaymentModal}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              <div
                className={`buyer-payment-modal__icon buyer-payment-modal__icon--${paymentModalCopy.variant}`}
                aria-hidden
              >
                {paymentModalCopy.variant === "success" ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>

              <h2 id="buyer-payment-modal-title" className="buyer-payment-modal__title">
                {paymentModalCopy.title}
              </h2>
              <p className="buyer-payment-modal__message">{paymentModalCopy.message}</p>

              <div className="buyer-payment-modal__actions">
                <button
                  ref={paymentModalPrimaryRef}
                  type="button"
                  className={`buyer-payment-modal__primary buyer-payment-modal__primary--${paymentModalCopy.variant}`}
                  onClick={closePaymentModal}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  // Loading/error states - must be after all hooks to avoid "fewer hooks" error
  if (loading && !profileData) {
    return (
      <>
        <div className="buyer-profile-container">
          <div className="buyer-profile-loading">
            <div className="buyer-profile-spinner" />
            <p>Loading your profile...</p>
          </div>
        </div>
        {paymentModalPortal}
      </>
    );
  }
  if (error && !profileData) {
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
        {paymentModalPortal}
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

                <div className="info-section buyer-wallet-section">
                  <div className="buyer-wallet-panel">
                    <div className="buyer-wallet-panel__top">
                      <h3 className="section-title buyer-wallet-panel__title">
                        <span className="buyer-wallet-panel__title-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        Wallet
                      </h3>
                      <div className="buyer-wallet-actions">
                        <button
                          className="b-action-btn b-primary buyer-wallet-add-btn"
                          type="button"
                          onClick={() => navigate("/buyer/add-balance")}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M12 5v14M5 12h14"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                          Add Balance
                        </button>
                      </div>
                    </div>

                    {wallet ? (
                      <div className="buyer-wallet-overview">
                        <div className="buyer-wallet-stat">
                          <span className="buyer-wallet-stat__label">Available</span>
                          <span className="buyer-wallet-stat__value">
                            {formatWalletCurrency(wallet.available_balance ?? 0)}
                          </span>
                          <span className="buyer-wallet-stat__hint">Ready to bid or withdraw</span>
                        </div>
                        <div className="buyer-wallet-stat">
                          <span className="buyer-wallet-stat__label">Locked</span>
                          <span className="buyer-wallet-stat__value buyer-wallet-stat__value--muted">
                            {formatWalletCurrency(wallet.locked_balance ?? 0)}
                          </span>
                          <span className="buyer-wallet-stat__hint">Held on active bids</span>
                        </div>
                        <div className="buyer-wallet-stat">
                          <span className="buyer-wallet-stat__label">Bidding power</span>
                          <span className="buyer-wallet-stat__value">
                            {formatWalletCurrency(wallet.bidding_power ?? 0)}
                          </span>
                          <span className="buyer-wallet-stat__hint">Total limit you can use</span>
                        </div>
                      </div>
                    ) : (
                      <p className="buyer-wallet-empty-overview">
                        Wallet details could not be loaded. You can still add balance or view history
                        below.
                      </p>
                    )}

                    <div className="buyer-wallet-history">
                      <div className="buyer-wallet-history__head">
                        <h4 className="buyer-wallet-history__title">Payment history</h4>
                        {paymentHistory.length > 0 && (
                          <span className="buyer-wallet-history__count">
                            {paymentHistory.length} record{paymentHistory.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>

                      {paymentHistoryLoading && (
                        <div className="buyer-wallet-history__state">
                          <div className="buyer-profile-spinner buyer-wallet-history__spinner" />
                          <span>Loading history…</span>
                        </div>
                      )}

                      {!paymentHistoryLoading && paymentHistoryError && (
                        <div className="buyer-wallet-history__state buyer-wallet-history__state--error">
                          {paymentHistoryError}
                        </div>
                      )}

                      {!paymentHistoryLoading && !paymentHistoryError && paymentHistory.length === 0 && (
                        <div className="buyer-wallet-history__state buyer-wallet-history__state--empty">
                          No payments yet. Use Add Balance to fund your wallet.
                        </div>
                      )}

                      {!paymentHistoryLoading && !paymentHistoryError && paymentHistory.length > 0 && (
                        <ul className="buyer-wallet-history__list" role="list">
                          {paymentHistory.map((row) => (
                            <li key={row.key} className="buyer-wallet-history__row">
                              <div className="buyer-wallet-history__row-main">
                                <span className="buyer-wallet-history__row-title">{row.title}</span>
                                {row.status ? (
                                  <span
                                    className={`wallet-history-status ${paymentStatusClass(row.status)}`}
                                  >
                                    {row.status}
                                  </span>
                                ) : null}
                              </div>
                              <div className="buyer-wallet-history__row-meta">
                                <span
                                  className={
                                    row.amount != null && row.amount < 0
                                      ? "buyer-wallet-history__amount buyer-wallet-history__amount--out"
                                      : "buyer-wallet-history__amount"
                                  }
                                >
                                  {row.amount != null ? formatWalletCurrency(row.amount) : "—"}
                                </span>
                                <time
                                  className="buyer-wallet-history__when"
                                  dateTime={row.created ? String(row.created) : undefined}
                                >
                                  {formatPaymentWhen(row.created)}
                                </time>
                              </div>
                            </li>
                          ))}
                        </ul>
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

    {paymentModalPortal}
    </>
  );
};

export default BuyerProfile;

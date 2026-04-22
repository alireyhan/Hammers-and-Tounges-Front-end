import React, { useEffect, useState, useMemo } from "react";
import "./AdminManagerKYC.css";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsersList, performUserAction } from "../../store/actions/adminActions";
import { clearActionSuccess } from "../../store/slices/adminSlice";
import { getMediaUrl } from "../../config/api.config";
import KYCDocumentPreview from "./KYCDocumentPreview";

const AdminManagerKYC = () => {
  const [comparison, setComparison] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedAction, setSelectedAction] = useState({
    type: '',
    target_id: null,
    role: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionError, setRejectionError] = useState('');
  const dispatch = useDispatch();
  const { users, isLoading, isPerformingAction, actionSuccess } = useSelector((state) => state.admin);

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

  // Keyboard shortcuts for fullscreen viewer
  useEffect(() => {
    if (!fullscreenImage) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeFullscreen();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoomLevel(prev => Math.min(prev + 0.25, 3));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
      } else if (e.key === '0') {
        e.preventDefault();
        setZoomLevel(1);
        setImagePosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage]);

  // Refresh users list after successful action
  useEffect(() => {
    if (actionSuccess) {
      dispatch(fetchUsersList());
      dispatch(clearActionSuccess());
      setSelectedAction({ type: '', target_id: null, role: '' });
    }
  }, [actionSuccess, dispatch]);

  // Find the selected user by ID from all fetched users
  const selectedUser = useMemo(() => {
    if (!allUsers || allUsers.length === 0) return null;
    return allUsers.find((user) => user.id === parseInt(id));
  }, [allUsers, id]);


  console.log("selectedUser: ", selectedUser);

  const openFullscreen = (src) => {
    setFullscreenImage(src);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (fullscreenImage) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
    }
  };

  const downloadImage = (imageUrl, filename) => {
    // In design/demo mode avoid using fetch/XHR.
    // If a valid URL exists, trigger a direct browser download/navigation.
    if (!imageUrl) return;

    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename || 'kyc-document.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error triggering image download:', error);
    }
  };

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

  const handleUserAction = async (userId, actionType, rejectionReason = null) => {
    const actionData = {
      type: actionType,
      target_id: userId,
    };

    // Add rejection_reason if it's a rejection action
    if (actionType === 'REJECT_SELLER' && rejectionReason) {
      actionData.rejection_reason = rejectionReason;
    }

    await dispatch(performUserAction(actionData));
  };

  const handleRejectClick = () => {
    setShowRejectForm(true);
    setRejectionError('');
  };

  const handleCancelReject = () => {
    setShowRejectForm(false);
    setRejectionReason('');
    setRejectionError('');
  };

  const handleSubmitReject = async () => {
    // Validate rejection reason
    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is required');
      return;
    }

    setRejectionError('');
    await handleUserAction(selectedUser.id, 'REJECT_SELLER', rejectionReason.trim());
    navigate("/admin/users", { state: { role: "seller" } });
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    const roleMap = {
      admin: "Administrator",
      seller: "Seller",
      buyer: "Buyer",
      manager: "Manager",
    };
    return roleMap[role] || role || "N/A";
  };

  // Get KYC status
  const getKYCStatus = () => {
    if (!selectedUser) return "Unknown";
    if (selectedUser.role === "seller" && selectedUser.seller_details) {
      if (selectedUser.seller_details.is_rejected) {
        return "Rejected";
      }
      return selectedUser.seller_details.verified ? "Verified" : "Pending Review";
    }
    return "Not Applicable";
  };
  const getDocumentPath = (path) => {
    if (
      !path ||
      path === 'null' ||
      path === 'undefined' ||
      path.trim() === ''
    ) {
      return null;
    }
    return `${path}`;
  };

  const documentTypes = useMemo(() => [
    {
      key: "id_front",
      label: "National ID (Front)",
      path: getMediaUrl(getDocumentPath(selectedUser?.seller_details?.id_front)),
    },
    {
      key: "id_back",
      label: "National ID (Back)",
      path: getMediaUrl(getDocumentPath(selectedUser?.seller_details?.id_back)),
    },
    {
      key: "driving_license_front",
      label: "Driving License (Front)",
      path: getMediaUrl(getDocumentPath(selectedUser?.seller_details?.driving_license_front)),
    },
    {
      key: "driving_license_back",
      label: "Driving License (Back)",
      path: getMediaUrl(getDocumentPath(selectedUser?.seller_details?.driving_license_back)),
    },
    {
      key: "passport_front",
      label: "Passport",
      path: getMediaUrl(getDocumentPath(selectedUser?.seller_details?.passport_front)),
    },
  ], [selectedUser]);

  // Loading state
  if (isLoading || isFetchingUsers) {
    return (
      <div className="kyc-page">
        <div className="kyc-loading">
          <div className="kyc-loading-spinner"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  // User not found state
  if (!selectedUser) {
    return (
      <div className="kyc-page">
        <div className="kyc-not-found">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="currentColor"
            />
          </svg>
          <h3>User Not Found</h3>
          <p>The selected user could not be found. Please return to the user list and try again.</p>
          <button className="approve" onClick={() => navigate("/admin/users", { state: { role: "seller" } })}>
            Back to Users List
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`kyc-page ${fullscreenImage ? "blurred" : ""}`}>
        <header className="kyc-header">
          <div>
            <h1 className="titlePage">KYC Verification</h1>
            <p className="descPage">
              Review user identity documents and approve or reject verification requests.
            </p>
          </div>
          <span className={`kyc-status ${getKYCStatus() === "Verified" ? "verified" :
              getKYCStatus() === "Rejected" ? "rejected" :
                "pending"
            }`}>
            {getKYCStatus()}
          </span>
        </header>

        <div className="kyc-top">
          <div className="card user-info">
            <h3>User Information</h3>
            <div className="info-grid">
              <div>
                <label>Full Name</label>
                <span>{selectedUser.full_name || "N/A"}</span>
              </div>
              <div>
                <label>Email Address</label>
                <span>{selectedUser.email || "N/A"}</span>
              </div>
              <div>
                <label>Phone Number</label>
                <span>{selectedUser.profile?.phone || "N/A"}</span>
              </div>
              <div>
                <label>Role</label>
                <span>{getRoleDisplayName(selectedUser.role)}</span>
              </div>
              <div>
                <label>Account Creation</label>
                <span>{formatDate(selectedUser.date_joined)}</span>
              </div>
              <div>
                <label>Last Submitted</label>
                <span>{formatDate(selectedUser.seller_details?.created_at)}</span>
              </div>
              <div>
                <label>Email Verified</label>
                <span className={selectedUser.is_email_verified ? "highlight-success" : "highlight"}>
                  {selectedUser.is_email_verified ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          <div className="kyc-card-form admin-panel">
            <h3>Admin Review Panel</h3>
            {selectedUser && selectedUser?.seller_details?.is_rejected ? (
              <div className="rejected-state">
                <div className="rejected-message">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h4>KYC Rejected</h4>
                  {selectedUser.seller_details.rejection_reason && (
                    <div className="rejection-reason-display">
                      <label>Rejection Reason:</label>
                      <p>{selectedUser.seller_details.rejection_reason}</p>
                    </div>
                  )}
                </div>
                <div className="action-buttons">
                  <button className="go-back" onClick={() => navigate("/admin/users", { state: { role: "seller" } })}>
                    Go Back
                  </button>
                </div>
              </div>
            ) : selectedUser && selectedUser?.seller_details?.verified ? (
              <div className="action-buttons">
                <button className="go-back" onClick={() => navigate("/admin/users", { state: { role: "seller" } })}>
                  Go Back
                </button>
              </div>
            ) : !showRejectForm ? (
              <div className="action-buttons">
                <button className="approve" disabled={isPerformingAction} onClick={() => {
                  handleUserAction(selectedUser.id, 'VERIFY_SELLER')
                  navigate("/admin/users", { state: { role: "seller" } })
                }
                }>
                  {isPerformingAction ?
                    (
                      <>
                        <span className="kyc-spinner"></span>
                        Approving
                      </>
                    ) : "Approve"}
                </button>
                <button className="reject" disabled={isPerformingAction} onClick={handleRejectClick}>
                  Reject
                </button>
                <button className="go-back" onClick={() => navigate("/admin/users", { state: { role: "seller" } })}>
                  Go Back
                </button>
              </div>
            ) : (
              <div className="rejection-form">
                <label className="reason-label">Rejection Reason <span className="required">*</span></label>
                <textarea
                  className="textarea-form"
                  placeholder="Provide a clear reason for rejecting this user's KYC documents..."
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectionError) setRejectionError('');
                  }}
                  disabled={isPerformingAction}
                />
                {rejectionError && <div className="error-message">{rejectionError}</div>}
                <div className="rejection-form-actions">
                  <button
                    className="submit-reject"
                    disabled={isPerformingAction}
                    onClick={handleSubmitReject}
                  >
                    {isPerformingAction ? (
                      <>
                        <span className="kyc-spinner"></span>
                        Rejecting
                      </>
                    ) : "Submit Rejection"}
                  </button>
                  <button
                    className="cancel-reject"
                    disabled={isPerformingAction}
                    onClick={handleCancelReject}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <KYCDocumentPreview
          documents={documentTypes}
          onPreviewImage={openFullscreen}
          onDownloadImage={downloadImage}
        />
      </div>

      {fullscreenImage && (
        <div
          className="fullscreen-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeFullscreen();
          }}
          onWheel={handleWheel}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="fullscreen-controls">
            <button
              className="fullscreen-control-btn"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button
              className="fullscreen-control-btn"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className="fullscreen-control-btn"
              onClick={handleResetZoom}
              title="Reset Zoom"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8V12M12 12V16M12 12H8M12 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className="fullscreen-control-btn"
              onClick={() => downloadImage(fullscreenImage, 'kyc-document.jpg')}
              title="Download"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className="fullscreen-control-btn close-btn"
              onClick={closeFullscreen}
              title="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div
            className="fullscreen-image-container"
            onMouseDown={handleMouseDown}
            style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <img
              src={fullscreenImage}
              alt="Full Screen"
              className="fullscreen-image"
              style={{
                transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease'
              }}
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminManagerKYC;
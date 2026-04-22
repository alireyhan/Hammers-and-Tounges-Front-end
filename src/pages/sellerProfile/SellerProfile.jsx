import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "./SellerProfile.css";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import { fetchProfile, updateProfile, deleteProfile } from "../../store/actions/profileActions";
import { fetchMyAuctions } from "../../store/actions/sellerActions";
import { toast } from "react-toastify";
import { getMediaUrl } from "../../config/api.config";

const SellerProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get profile data from Redux store
  const { profile: profileData, loading, error } = useSelector((state) => state.profile);

  // Get seller auctions for dashboard stats
  const { myAuctions } = useSelector((state) => state.seller);

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [kycUploading, setKycUploading] = useState(false);
  // const [isUploadingKyc, setIsUploadingKyc] = useState(false);
  // Single state for all form data including files
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    display_name: "",
    phone: "",
    bio: "",
    email: "",
    image: null, // Will hold File object if uploading new image
    seller_profile: {
      business_name: "",
      business_reg_no: "",
      id_front: null,
      id_back: null,
      driving_license_front: null,
      driving_license_back: null,
      passport_front: null,
      verified: false,
    },
    profile_completion_status: "incomplete",
  });

  // State for image previews only (not the actual API data)
  const [imagePreviews, setImagePreviews] = useState({
    image: null,
    id_front: null,
    id_back: null,
    driving_license_front: null,
    driving_license_back: null,
    passport_front: null,
  });

  // File input refs
  const fileInputRefs = useRef({
    image: null,
    id_front: null,
    id_back: null,
    driving_license_front: null,
    driving_license_back: null,
    passport_front: null,
  });

  // Calculate dashboard stats from auctions (matching dashboard)
  const dashboardStats = useMemo(() => {
    const allAuctions = myAuctions?.results || [];

    // Calculate metrics from auction data
    const totalVehicles = allAuctions.length;
    const soldVehicles = allAuctions.filter(auction => auction.status === 'CLOSED' || auction.status === 'COMPLETED').length;
    const unsoldVehicles = allAuctions.filter(auction => auction.status !== 'CLOSED' && auction.status !== 'COMPLETED').length;

    // Calculate total earnings from sold auctions (using currentBid as sold price for closed/completed auctions)
    const totalEarnings = allAuctions
      .filter(auction => auction.status === 'CLOSED' || auction.status === 'COMPLETED')
      .reduce((sum, auction) => sum + (parseFloat(auction.currentBid) || 0), 0);

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    return [
      {
        id: 1,
        label: "Total Earnings",
        sublabel: "Lifetime earnings",
        value: formatCurrency(totalEarnings),
        icon: "earnings",
        color: "#FFC107",
        gradient: "linear-gradient(135deg, rgba(255, 193, 7, 0.4) 50%, rgba(255, 193, 7, 0.05) 100%)",
        iconBg: "rgba(255, 193, 7, 0.25)",
        iconBorder: "rgba(255, 193, 7, 0.5)"
      },
      {
        id: 2,
        label: "Total Vehicles",
        sublabel: "All vehicles listed",
        value: totalVehicles.toString(),
        icon: "vehicles",
        color: "#3B82F6",
        gradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.4) 50%, rgba(59, 130, 246, 0.05) 100%)",
        iconBg: "rgba(59, 130, 246, 0.2)",
        iconBorder: "rgba(59, 130, 246, 0.4)"
      },
      {
        id: 3,
        label: "Sold Vehicles",
        sublabel: "Successfully sold",
        value: soldVehicles.toString(),
        icon: "sold",
        color: "#39AE47",
        gradient: "linear-gradient(135deg, rgba(140, 198, 63, 0.4) 50%, rgba(140, 198, 63, 0.05) 100%)",
        iconBg: "rgba(140, 198, 63, 0.2)",
        iconBorder: "rgba(140, 198, 63, 0.4)"
      },
      {
        id: 4,
        label: "Unsold Vehicles",
        sublabel: "Not yet sold",
        value: unsoldVehicles.toString(),
        icon: "unsold",
        color: "#EF4444",
        gradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.4) 50%, rgba(239, 68, 68, 0.05) 100%)",
        iconBg: "rgba(239, 68, 68, 0.2)",
        iconBorder: "rgba(239, 68, 68, 0.4)"
      },
    ];
  }, [myAuctions]);

  // Fetch profile and auctions on component mount
  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchMyAuctions());
  }, [dispatch]);

  // Update formData when profileData changes from API
  useEffect(() => {
    if (profileData) {
      setFormData({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        display_name: profileData.display_name || "",
        phone: profileData.phone || "",
        bio: profileData.bio || "",
        email: profileData.email || "",
        image: null, // Don't set the URL here, it's for new uploads only
        seller_profile: {
          business_name: profileData.seller_profile?.business_name || "",
          business_reg_no: profileData.seller_profile?.business_reg_no || "",
          id_front: null, // Don't set URLs, these are for new uploads
          id_back: null,
          driving_license_front: null,
          driving_license_back: null,
          passport_front: null,
          verified: profileData.seller_profile?.verified || false,
        },
        profile_completion_status: profileData.profile_completion_status || "incomplete",
      });
    }
  }, [profileData]);

  // Handle text input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle seller profile text changes
  const handleSellerProfileChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      seller_profile: {
        ...prev.seller_profile,
        [field]: value
      }
    }));
  }, []);

  // Handle file selection for any field
  const handleFileSelect = useCallback((fieldName, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Update formData with the File object
    if (fieldName === 'image') {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      console.log('selected file profile: ', file);


    } else {
      // For KYC documents
      setFormData(prev => ({
        ...prev,
        seller_profile: {
          ...prev.seller_profile,
          [fieldName]: file
        }
      }));

      console.log('selected file kyc: ', file);

    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews(prev => ({
        ...prev,
        [fieldName]: reader.result
      }));
    };
    reader.readAsDataURL(file);

    // Clear the input
    if (e.target) {
      e.target.value = '';
    }
  }, []);

  // Handle save - saves everything in one call
  const handleSave = useCallback(async () => {
    try {
      // Prepare data for API - only send fields that have values
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        display_name: formData.display_name,
        phone: formData.phone,
        bio: formData.bio,
      };

      // Add image if user uploaded a new one
      if (formData.image instanceof File) {
        updateData.image = formData.image;
      }

      // Add seller profile data
      updateData.seller_profile = {
        business_name: formData.seller_profile.business_name,
        business_reg_no: formData.seller_profile.business_reg_no,
      };

      // Add KYC documents if user uploaded new ones
      // if (formData.seller_profile.id_front instanceof File) {
      //   updateData.id_front = formData.seller_profile.id_front;
      // }
      // if (formData.seller_profile.id_back instanceof File) {
      //   updateData.id_back = formData.seller_profile.id_back;
      // }
      // if (formData.seller_profile.driving_license_front instanceof File) {
      //   updateData.driving_license_front = formData.seller_profile.driving_license_front;
      // }
      // if (formData.seller_profile.driving_license_back instanceof File) {
      //   updateData.driving_license_back = formData.seller_profile.driving_license_back;
      // }
      // if (formData.seller_profile.passport_front instanceof File) {
      //   updateData.passport_front = formData.seller_profile.passport_front;
      // }

      console.log(updateData, 'Updating profile with data');


      await dispatch(updateProfile(updateData));
      setIsEditing(false);

      // Clear previews and file objects after successful save
      setImagePreviews({
        image: null,
        id_front: null,
        id_back: null,
        driving_license_front: null,
        driving_license_back: null,
        passport_front: null,
      });

      // Refresh profile data
      dispatch(fetchProfile());
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }, [formData, dispatch]);

  const handleKycUpload = useCallback(async () => {
    try {
      const kycData = {};

      if (formData.seller_profile.id_front instanceof File) {
        kycData.id_front = formData.seller_profile.id_front;
      }
      if (formData.seller_profile.id_back instanceof File) {
        kycData.id_back = formData.seller_profile.id_back;
      }
      if (formData.seller_profile.driving_license_front instanceof File) {
        kycData.driving_license_front = formData.seller_profile.driving_license_front;
      }
      if (formData.seller_profile.driving_license_back instanceof File) {
        kycData.driving_license_back = formData.seller_profile.driving_license_back;
      }
      if (formData.seller_profile.passport_front instanceof File) {
        kycData.passport_front = formData.seller_profile.passport_front;
      }

      if (Object.keys(kycData).length === 0) {
        toast.warn("Please select at least one document to upload");
        return;
      }

      setKycUploading(true);

      await dispatch(updateProfile(kycData));

      toast.success("KYC documents uploaded successfully");

      // clear previews after success
      setImagePreviews(prev => ({
        ...prev,
        id_front: null,
        id_back: null,
        driving_license_front: null,
        driving_license_back: null,
        passport_front: null,
      }));

      dispatch(fetchProfile());
    } catch (err) {
      console.error("KYC upload error:", err);
    } finally {
      setKycUploading(false);
    }
  }, [dispatch, formData.seller_profile]);


  // Handle account deletion
  const handleDeleteAccount = useCallback(async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await dispatch(deleteProfile());
        dispatch(logout());
        navigate('/signin', { replace: true });
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  }, [dispatch, navigate]);

  // Calculate profile completion percentage
  const calculateProfileCompletion = useCallback(() => {
    let completed = 0;
    let total = 0;

    const basicFields = ['first_name', 'last_name', 'phone', 'email'];
    basicFields.forEach(field => {
      total++;
      if (formData[field] && formData[field].trim()) completed++;
    });

    const businessFields = ['business_name', 'business_reg_no'];
    businessFields.forEach(field => {
      total++;
      if (formData.seller_profile[field] && formData.seller_profile[field].trim()) completed++;
    });

    // Check API data for existing documents
    const kycFields = ['id_front', 'id_back', 'passport_front'];
    kycFields.forEach(field => {
      total++;
      if (profileData?.seller_profile?.[field]) completed++;
    });

    return Math.round((completed / total) * 100);
  }, [formData, profileData]);

  console.log(profileData);


  // Get display name
  const getDisplayName = useCallback(() => {
    if (formData.display_name) return formData.display_name;
    return `${formData.first_name} ${formData.last_name}`.trim() || "Seller";
  }, [formData.first_name, formData.last_name, formData.display_name]);

  // Get image source (preview or existing URL)
  const getImageSource = useCallback((fieldName) => {
    // Priority: preview > API URL > null (no default image)
    if (imagePreviews[fieldName]) {
      return imagePreviews[fieldName];
    }

    if (fieldName === 'image') {
      return getMediaUrl(profileData?.image) || null;
    }

    // For KYC documents, return API URL if exists
    return getMediaUrl(profileData?.seller_profile?.[fieldName]) || null;
  }, [imagePreviews, profileData]);

  // Document Card Component
  const DocumentCard = useCallback(({ documentType, title }) => {
    const imageSource = getImageSource(documentType);
    const hasNewFile = formData.seller_profile[documentType] instanceof File;
    const hasExistingDocument = profileData?.seller_profile?.[documentType];

    const isAlreadyUploaded =
      Boolean(profileData?.seller_profile?.[documentType]) &&
      !(formData.seller_profile[documentType] instanceof File);

    console.log('image source:', imageSource);


    return (
      <div className="document-card">
        <input
          ref={el => fileInputRefs.current[documentType] = el}
          type="file"
          accept="image/*"
          disabled={isAlreadyUploaded}
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(documentType, e)}
        />

        <div className="document-header">
          <h4>{title}</h4>
          {hasNewFile && (
            <span className="document-status uploaded">Ready to Upload</span>
          )}
          {!hasNewFile && hasExistingDocument && (
            <span className="document-status uploaded">Uploaded</span>
          )}
        </div>

        <div className="document-preview">
          {imageSource ? (
            <img
              src={imageSource}
              alt={title}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `
                  <div class="document-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <p>Failed to load</p>
                  </div>
                `;
              }}
            />
          ) : (
            <div className="document-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" />
                <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p>No document uploaded</p>
            </div>
          )}
        </div>

        <button
          type="button"
          className="document-upload-btn"
          // onClick={() => fileInputRefs.current[documentType]?.click()}
          disabled={isAlreadyUploaded}
          onClick={() => {
            if (!isAlreadyUploaded) {
              fileInputRefs.current[documentType]?.click();
            }
          }}
        >
          {isAlreadyUploaded ? 'Uploaded' : 'Select File'}
        </button>
      </div>
    );
  }, [formData.seller_profile, profileData?.seller_profile, getImageSource, handleFileSelect]);

  // Stat Card Component - matching dashboard design
  const StatCard = useMemo(() => ({ stat }) => (
    <div key={stat.id} className="summary-card profile-stat-card">
      <div className="card-background-gradient" style={{ background: stat.gradient }}></div>
      <div className="card-icon" style={{ backgroundColor: stat.iconBg, borderColor: stat.iconBorder }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={stat.color} strokeWidth="2">
          {stat.icon === 'earnings' && (
            <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6312 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6312 13.6815 18 14.5717 18 15.5C18 16.4283 17.6312 17.3185 16.9749 17.9749C16.3185 18.6312 15.4283 19 14.5 19H6" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {stat.icon === 'vehicles' && (
            <>
              <path d="M5 17H4C2.89543 17 2 16.1046 2 15V5C2 3.89543 2.89543 3 4 3H14C15.1046 3 16 3.89543 16 5V6M20 9H8C6.89543 9 6 9.89543 6 11V19C6 20.1046 6.89543 21 8 21H20C21.1046 21 22 20.1046 22 19V11C22 9.89543 21.1046 9 20 9Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 14L14 16L18 12" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {stat.icon === 'sold' && (
            <>
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 21V5C8 4.46957 8.21071 3.96086 8.58579 3.58579C8.96086 3.21071 9.46957 3 10 3H14C14.5304 3 15.0391 3.21071 15.4142 3.58579C15.0391 3.96086 15 4.46957 15 5V21" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 10V14" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 12H15" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {stat.icon === 'unsold' && (
            <>
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 11V13" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
        </svg>
      </div>
      <div className="card-content">
        <span className="card-label">{stat.label.toUpperCase()}</span>
        <span className={`card-value ${stat.icon === 'earnings' ? 'currency' : ''}`} style={{ color: stat.icon === 'earnings' ? '#FFC107' : stat.color }}>{stat.value}</span>
        <span className="card-sublabel">{stat.sublabel}</span>
      </div>
    </div>
  ), []);

  // Loading state
  if (loading && !profileData) {
    return (
      <div className="seller-profile-container">
        <div className="empty-state">
          <div className="loading-spinner"></div>
          <h3 className="empty-state-title">Loading Profile...</h3>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !profileData) {
    return (
      <div className="seller-profile-container">
        <div className="empty-state">
          <div className="empty-state-icon error">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="empty-state-title">Failed to Load Profile</h3>
          <p className="empty-state-description">
            {error || "Unable to load your profile information. Please try again."}
          </p>
          <button
            className="action-button primary"
            onClick={() => dispatch(fetchProfile())}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="seller-profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="header-content">
          <h1 className="profile-title">Seller Profile</h1>
          <p className="profile-subtitle">Manage your account, business details, and verification</p>
        </div>
        <div className="header-actions">
          <button
            className={`s-action-btn ${isEditing ? 's-secondary' : 's-primary'}`}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={loading}
          >
            {isEditing ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Save Changes
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" />
                </svg>
                Edit Profile
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-main">
        {/* Left Column */}
        <div className="profile-left">
          <div className="profile-card">
            {/* Avatar Section */}
            <div className="profile-avatar-section">
              <div className="avatar-wrapper">
                <div className="avatar">
                  {getImageSource('image') ? (
                    <img
                      src={getImageSource('image')}
                      alt={getDisplayName()}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const placeholder = e.target.nextElementSibling;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : (
                    <div className="avatar-placeholder" style={{ display: 'flex' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>No Image</span>
                    </div>
                  )}
                  <div className={`status-indicator ${formData.seller_profile.verified ? 'verified' : 'unverified'}`}></div>
                </div>
                <input
                  ref={el => fileInputRefs.current.image = el}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect('image', e)}
                />
                {isEditing && (
                  <button
                    className="s-avatar-upload"
                    onClick={() => fileInputRefs.current.image?.click()}
                    title="Upload profile image"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" />
                      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="profile-info">
                <h2 className="profile-name">{getDisplayName()}</h2>
                <p className="profile-email">{formData.email}</p>
                <div className={`verification-badge ${formData.seller_profile.verified ? 'verified' : 'unverified'}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    {formData.seller_profile.verified && (
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                  {formData.seller_profile.verified ? "Verified" : "Not Verified"}
                </div>
              </div>
            </div>

            {/* Dashboard Stats - Same as Dashboard */}
            <div className="summary-cards profile-stats-grid">
              {dashboardStats.map(stat => (
                <StatCard key={stat.id} stat={stat} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="profile-right">
          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-btn ${activeTab === 'kyc' ? 'active' : ''}`}
              onClick={() => setActiveTab('kyc')}
            >
              KYC Documents
            </button>
            <button
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="overview-content">
                <div className="info-section">
                  <h3 className="section-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
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
                          value={formData.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                        />
                      ) : (
                        <div className="info-value">{formData.first_name || "Not set"}</div>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Last Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={formData.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                        />
                      ) : (
                        <div className="info-value">{formData.last_name || "Not set"}</div>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Display Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="edit-input"
                          value={formData.display_name}
                          onChange={(e) => handleInputChange('display_name', e.target.value)}
                          placeholder="Optional"
                        />
                      ) : (
                        <div className="info-value">{formData.display_name || "Not set"}</div>
                      )}
                    </div>
                    <div className="info-item">
                      <label>Email Address</label>
                      <div className="info-value">{formData.email}</div>
                    </div>
                    <div className="info-item">
                      <label>Phone Number</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          className="edit-input"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      ) : (
                        <div className="info-value">{formData.phone || "Not set"}</div>
                      )}
                    </div>
                    <div className="info-item full-width">
                      <label>Bio / Description</label>
                      {isEditing ? (
                        <textarea
                          className="edit-input"
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          rows="3"
                          placeholder="Tell buyers about yourself..."
                        />
                      ) : (
                        <div className="info-value">{formData.bio || "No bio added yet"}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* KYC Documents Tab */}
            {activeTab === 'kyc' && (
              <div className="kyc-content-new">
                <div className={`kyc-status-card ${profileData?.seller_profile?.verified ? 'verified' : profileData?.seller_profile?.is_rejected ? 'rejected' : 'pending'}`}>
                  <div className="kyc-status-header">
                    <div className="kyc-status-icon">
                      {profileData?.seller_profile?.verified ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      ) : profileData?.seller_profile?.is_rejected ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <div className="kyc-status-info">
                      <h3 className="kyc-status-title">
                        {profileData?.seller_profile?.verified
                          ? 'KYC Verified'
                          : profileData?.seller_profile?.is_rejected
                            ? 'KYC Rejected'
                            : profileData?.seller_profile?.id_front || profileData?.seller_profile?.passport_front || profileData?.seller_profile?.driving_license_front
                              ? 'KYC Pending Review'
                              : 'KYC Not Started'}
                      </h3>
                      <p className="kyc-status-description">
                        {profileData?.seller_profile?.verified
                          ? 'Your identity has been successfully verified. You can now participate in auctions.'
                          : profileData?.seller_profile?.is_rejected
                            ? profileData.seller_profile.rejection_reason || 'Your documents did not meet verification requirements. Please upload new documents.'
                            : profileData?.seller_profile?.id_front || profileData?.seller_profile?.passport_front || profileData?.seller_profile?.driving_license_front
                              ? 'Your documents are under review. You will be notified once verification is complete.'
                              : 'Complete your identity verification to participate in auctions. Upload your documents to get started.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="kyc-verification-cta">
                  <div className="kyc-cta-content">
                    <h4 className="kyc-cta-title">Verify Your Identity</h4>
                    <p className="kyc-cta-description">
                      Upload your identity documents to complete KYC verification. All documents are securely encrypted and processed.
                    </p>
                    <button
                      className="kyc-cta-button"
                      onClick={() => navigate('/seller/kyc-verification')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {profileData?.seller_profile?.verified
                        ? 'View Verification Status'
                        : profileData?.seller_profile?.is_rejected
                          ? 'Upload New Documents'
                          : 'Start KYC Verification'}
                    </button>
                  </div>
                </div>

                {/* Document Summary - Only show if documents exist */}
                {(profileData?.seller_profile?.id_front ||
                  profileData?.seller_profile?.id_back ||
                  profileData?.seller_profile?.driving_license_front ||
                  profileData?.seller_profile?.driving_license_back ||
                  profileData?.seller_profile?.passport_front) && (
                    <div className="kyc-documents-summary">
                      <h4 className="kyc-summary-title">Uploaded Documents</h4>
                      <div className="kyc-summary-grid">
                        {profileData.seller_profile.id_front && profileData.seller_profile.id_back && (
                          <div className="kyc-summary-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span>National ID</span>
                          </div>
                        )}
                        {profileData.seller_profile.driving_license_front && profileData.seller_profile.driving_license_back && (
                          <div className="kyc-summary-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span>Driver's License</span>
                          </div>
                        )}
                        {profileData.seller_profile.passport_front && (
                          <div className="kyc-summary-item">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span>Passport</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="settings-content">
                <div className="info-section">
                  <h3 className="section-title">Security Settings</h3>
                  <div className="settings-grid">
                    {/* <div className="setting-item">
                      <div className="setting-info">
                        <h4>Change Password</h4>
                        <p>Update your account password</p>
                      </div>
                      <button
                        className="s-action-btn s-secondary small"
                        onClick={() => navigate('/seller/change-password')}
                      >
                        Change
                      </button>
                    </div> */}
                    {/* <div className="setting-item">
                      <div className="setting-info">
                        <h4>Two-Factor Authentication</h4>
                        <p>Add extra security to your account</p>
                      </div>
                      <button className="action-btn outline small">Enable</button>
                    </div>
                    <div className="setting-item">
                      <div className="setting-info">
                        <h4>Email Notifications</h4>
                        <p>Receive updates about orders and promotions</p>
                      </div>
                      <label className="switch">
                        <input type="checkbox" defaultChecked />
                        <span className="slider round"></span>
                      </label>
                    </div> */}
                  </div>
                </div>

                <div className="danger-zone">
                  <h3 className="section-title">Account Actions</h3>
                  <div className="danger-actions">
                    <button
                      className="danger-btn"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to logout?')) {
                          dispatch(logout());
                          navigate('/signin', { replace: true });
                        }
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" />
                        <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Logout
                    </button>
                    <button
                      className="danger-btn red"
                      onClick={handleDeleteAccount}
                      disabled={loading}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M5 6l1 13a2 2 0 002 2h8a2 2 0 002-2l1-13M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" />
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
  );
};

export default SellerProfile;
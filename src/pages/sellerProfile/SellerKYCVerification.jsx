import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, updateProfile } from '../../store/actions/profileActions';
import { toast } from 'react-toastify';
import './SellerKYCVerification.css';

const SellerKYCVerification = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profile: profileData, loading } = useSelector((state) => state.profile);

  const [uploadedDocuments, setUploadedDocuments] = useState({
    nationalId: false,
    driverLicense: false,
    passport: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Check uploaded documents from API and sessionStorage
  useEffect(() => {
    const checkUploadedDocuments = () => {
      const storedPreviews = JSON.parse(sessionStorage.getItem('seller_kyc_previews') || '{}');
      const storedFiles = JSON.parse(sessionStorage.getItem('seller_kyc_files') || '{}');
      
      if (profileData?.seller_profile) {
        const sp = profileData.seller_profile;
        
        // Check if documents exist in API
        const hasIdFront = !!(sp.id_front);
        const hasIdBack = !!(sp.id_back);
        const hasDriverFront = !!(sp.driving_license_front);
        const hasDriverBack = !!(sp.driving_license_back);
        const hasPassport = !!(sp.passport_front);

        // Also check sessionStorage for recently selected files (not yet uploaded)
        const hasLocalIdFront = !!(storedPreviews.id_front || storedFiles.id_front);
        const hasLocalIdBack = !!(storedPreviews.id_back || storedFiles.id_back);
        const hasLocalDriverFront = !!(storedPreviews.driving_license_front || storedFiles.driving_license_front);
        const hasLocalDriverBack = !!(storedPreviews.driving_license_back || storedFiles.driving_license_back);
        const hasLocalPassport = !!(storedPreviews.passport_front || storedFiles.passport_front);

        setUploadedDocuments({
          nationalId: (hasIdFront && hasIdBack) || (hasLocalIdFront && hasLocalIdBack),
          driverLicense: (hasDriverFront && hasDriverBack) || (hasLocalDriverFront && hasLocalDriverBack),
          passport: hasPassport || hasLocalPassport,
        });
      } else {
        // Check only sessionStorage if no profile data
        setUploadedDocuments({
          nationalId: !!(storedPreviews.id_front && storedPreviews.id_back) || !!(storedFiles.id_front && storedFiles.id_back),
          driverLicense: !!(storedPreviews.driving_license_front && storedPreviews.driving_license_back) || !!(storedFiles.driving_license_front && storedFiles.driving_license_back),
          passport: !!(storedPreviews.passport_front || storedFiles.passport_front),
        });
      }
    };

    checkUploadedDocuments();
    
    // Also check when component becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkUploadedDocuments();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkUploadedDocuments);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkUploadedDocuments);
    };
  }, [profileData]);

  // Get KYC status
  const getKYCStatus = () => {
    if (!profileData?.seller_profile) return 'not_started';
    
    const sp = profileData.seller_profile;
    if (sp.verified === true) return 'verified';
    if (sp.is_rejected === true) return 'rejected';
    
    // Check if any documents are uploaded
    const hasAnyDoc = sp.id_front || sp.id_back || sp.driving_license_front || 
                     sp.driving_license_back || sp.passport_front;
    
    if (hasAnyDoc) return 'pending';
    return 'not_started';
  };

  const kycStatus = getKYCStatus();

  const handleOptionClick = (optionType) => {
    // Don't allow navigation if verified or pending
    if (kycStatus === 'verified') {
      toast.info('KYC is already verified. You cannot upload documents again.');
      return;
    }
    
    if (kycStatus === 'pending') {
      toast.info('KYC is pending review. Please wait for approval or rejection.');
      return;
    }

    // Navigate to upload page
    navigate(`/seller/kyc-verification/upload/${optionType}`);
  };

  const handleSubmit = async () => {
    // Check sessionStorage for files first
    const storedFiles = JSON.parse(sessionStorage.getItem('seller_kyc_files') || '{}');
    const storedPreviews = JSON.parse(sessionStorage.getItem('seller_kyc_previews') || '{}');
    
    // Check if at least one document type is uploaded (either in API or sessionStorage)
    const hasNationalId = uploadedDocuments.nationalId || (storedPreviews.id_front && storedPreviews.id_back) || (storedFiles.id_front && storedFiles.id_back);
    const hasDriverLicense = uploadedDocuments.driverLicense || (storedPreviews.driving_license_front && storedPreviews.driving_license_back) || (storedFiles.driving_license_front && storedFiles.driving_license_back);
    const hasPassport = uploadedDocuments.passport || storedPreviews.passport_front || storedFiles.passport_front;

    if (!hasNationalId && !hasDriverLicense && !hasPassport) {
      toast.error('Please upload at least one document type before submitting.');
      return;
    }

    // In design/demo mode we skip real upload and API calls.
    // Pretend everything went well so the user can continue navigation.
    setIsSubmitting(true);

    try {
      // Clear any locally stored files/previews
      sessionStorage.removeItem('seller_kyc_files');
      sessionStorage.removeItem('seller_kyc_previews');

      toast.success('KYC documents submitted successfully! (Design mode - no real upload)');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in mock KYC submission:', error);
      toast.error('Something went wrong while submitting in design mode.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show submit button if verified or pending
  const canSubmit = kycStatus === 'not_started' || kycStatus === 'rejected';

  return (
    <div className="seller-kyc-verification">
      <div className="kyc-header">
        <button className="kyc-back-btn" onClick={() => navigate('/seller/profile')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="kyc-title">Verify Your Identity</h1>
      </div>

      <div className="kyc-content">
        <div className="kyc-intro">
          <h2 className="kyc-heading">KYC Verification</h2>
          <p className="kyc-description">
            To participate in auctions we need to verify your identity. Please upload a clear image of the following documents for verification:
          </p>
        </div>

        {/* Status Messages */}
        {kycStatus === 'verified' && (
          <div className="kyc-status-message verified">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <h3>KYC is Verified</h3>
              <p>Your identity has been successfully verified. You can now participate in auctions.</p>
            </div>
          </div>
        )}

        {kycStatus === 'pending' && (
          <div className="kyc-status-message pending">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
            </svg>
            <div>
              <h3>KYC is Submitted</h3>
              <p>Your documents are under review. You will be notified once the verification is complete.</p>
            </div>
          </div>
        )}

        {kycStatus === 'rejected' && (
          <div className="kyc-status-message rejected">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
            </svg>
            <div>
              <h3>KYC Verification Rejected</h3>
              <p className="rejection-reason">
                <strong>Reason:</strong> {profileData?.seller_profile?.rejection_reason || 'Documents did not meet verification requirements.'}
              </p>
              <p>Please upload new documents to try again.</p>
            </div>
          </div>
        )}

        {/* Document Options */}
        <div className="kyc-options">
          <div
            className={`kyc-option ${uploadedDocuments.nationalId ? 'uploaded' : ''} ${kycStatus === 'verified' || kycStatus === 'pending' ? 'disabled' : ''}`}
            onClick={() => handleOptionClick('national-id')}
          >
            <div className="kyc-option-content">
              <span className="kyc-option-title">National ID</span>
              {uploadedDocuments.nationalId && (
                <span className="kyc-option-status">Uploaded</span>
              )}
            </div>
            <div className="kyc-option-icon">
              {uploadedDocuments.nationalId ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>

          <div
            className={`kyc-option ${uploadedDocuments.driverLicense ? 'uploaded' : ''} ${kycStatus === 'verified' || kycStatus === 'pending' ? 'disabled' : ''}`}
            onClick={() => handleOptionClick('driver-license')}
          >
            <div className="kyc-option-content">
              <span className="kyc-option-title">Driver's License</span>
              {uploadedDocuments.driverLicense && (
                <span className="kyc-option-status">Uploaded</span>
              )}
            </div>
            <div className="kyc-option-icon">
              {uploadedDocuments.driverLicense ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>

          <div
            className={`kyc-option ${uploadedDocuments.passport ? 'uploaded' : ''} ${kycStatus === 'verified' || kycStatus === 'pending' ? 'disabled' : ''}`}
            onClick={() => handleOptionClick('passport')}
          >
            <div className="kyc-option-content">
              <span className="kyc-option-title">Passport</span>
              {uploadedDocuments.passport && (
                <span className="kyc-option-status">Uploaded</span>
              )}
            </div>
            <div className="kyc-option-icon">
              {uploadedDocuments.passport ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="kyc-instructions">
          <p className="kyc-format-info">Supported formats: JPG, PNG & JPEG. Max Size: 5 MB</p>
          <p className="kyc-warning">
            Ensure the document is valid and the information is visible otherwise your account will be suspended.
          </p>
        </div>

        {/* Submit Button */}
        {canSubmit && (
          <button
            className="kyc-submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SellerKYCVerification;

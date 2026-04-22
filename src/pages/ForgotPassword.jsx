import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, resetPasswordState } from '../store/slices/authSlice';
import { requestPasswordReset } from '../store/actions/authActions';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { 
    isLoading, 
    resetRequestError, 
    resetRequestSuccess, 
    isRequestingReset 
  } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(resetPasswordState());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
    if (resetRequestError) {
      dispatch(clearError());
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    if (!validateForm()) {
      return;
    }

    await dispatch(requestPasswordReset(formData.email));
    
  };

  const handleResend = () => {
    if (!formData.email || !validateForm()) {
      return;
    }
    dispatch(requestPasswordReset(formData.email));
    navigate('/verify-reset-otp', {
        state: {
            email: formData?.email
        }
    })
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-header">
        <div className="forgot-password-header-left">
          <button
            type="button"
            className="forgot-back-button"
            onClick={() => navigate('/signin')}
            aria-label="Go back to sign in"
            disabled={isLoading || isRequestingReset}
          >
            Back to Sign In
          </button>
        </div>
        <div className="forgot-password-header-link">
          <span>Don't have an account?</span>
          <Link to="/register" className="header-link-button">
            Create Account
          </Link>
        </div>
      </div>

      <div className="forgot-password-image-section">
        <div className="forgot-password-image-overlay"></div>
        <div className="forgot-password-image-content">
          <h2 className="forgot-password-image-title">
            Regain Access to Your Account
          </h2>
          <p className="forgot-password-image-description">
            We'll send you an OTP to reset your password and get you back to bidding.
          </p>
        </div>
      </div>

      <div className="forgot-password-container">
        <div className="forgot-password-form-wrapper">
          <h1 className="forgot-password-title">Forgot Password</h1>
          <p className="forgot-password-subtitle">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>

          <form className="forgot-password-form" onSubmit={handleSubmit}>
            {/* Display API errors */}
            {resetRequestError && !resetRequestSuccess && (
              <div className="form-error-message">
                {resetRequestError.message ||
                  resetRequestError.detail ||
                  resetRequestError.email?.[0] ||
                  'Failed to send reset OTP. Please try again.'}
              </div>
            )}

            {/* Display success message */}
            {resetRequestSuccess && (
              <div className="forgot-form-success-message">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ marginRight: '8px' }}
                >
                  <path
                    d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                    stroke="#39AE47"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 4L12 14.01l-3-3"
                    stroke="#39AE47"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                OTP sent successfully! Please check your email and proceed to verify.
                <div className="success-actions">
                  <Link 
                    to="/verify-reset-otp" 
                    state={{ email: formData.email }}
                    className="forgot-verify-link"
                  >
                    Verify OTP
                  </Link>
                </div>
              </div>
            )}

            <div className="forgot-form-group-container">
              <div className="forgot-form-group-1">
                <label htmlFor="email" className="forgot-form-label">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`forgot-form-input ${formErrors.email ? 'error' : ''}`}
                  placeholder="Enter your registered email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isRequestingReset || resetRequestSuccess}
                  required
                />
                {formErrors.email && (
                  <span className="field-error">{formErrors.email}</span>
                )}
              </div>
            </div>

            <div className="forgot-password-button-container">
              <button
                type="submit"
                className="forgot-submit-button"
                disabled={isRequestingReset || resetRequestSuccess}
              >
                {isRequestingReset ? (
                  <>
                    <span className="forgot-spinner"></span>
                    Sending OTP...
                  </>
                ) : (
                  'Send Reset OTP'
                )}
              </button>
            </div>

            {/* Help text */}
            {!resetRequestSuccess && (
              <div className="forgot-password-help">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ marginRight: '8px', flexShrink: 0 }}
                >
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                  <path
                    d="M12 16v-4M12 8h.01"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <p>
                  If you don't receive an OTP within a few minutes, please check your spam folder or{' '}
                  <button
                    type="button"
                    className="forgot-resend-link"
                    onClick={handleResend}
                    disabled={isRequestingReset || !formData.email}
                  >
                    click here to resend
                  </button>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
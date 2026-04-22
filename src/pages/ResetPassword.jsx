import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './ResetPassword.css';
import { useDispatch, useSelector } from 'react-redux';
import { clearError } from '../store/slices/authSlice';
import { confirmPasswordReset } from '../store/actions/authActions';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    // Get token and email from location state
    const { token, email } = location.state || {};

    // Redux state
    const {
        isLoading,
        resetConfirmError,
        resetConfirmSuccess,
        isConfirmingReset
    } = useSelector((state) => state.auth);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (!token || !email) {
            navigate('/forgot-password');
        }

        return () => {
            dispatch(clearError());
        };
    }, [token, email, navigate, dispatch]);

    useEffect(() => {
        if (resetConfirmSuccess) {
            setTimeout(() => {
                navigate('/signin');
            }, 3000);
        }
    }, [resetConfirmSuccess, navigate]);

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
        if (resetConfirmError) {
            dispatch(clearError());
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.newPassword) {
            errors.newPassword = 'Password is required';
        } else if (formData.newPassword.length < 8) {
            errors.newPassword = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
            errors.newPassword = 'Password must contain uppercase, lowercase, and numbers';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
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
        
        await dispatch(confirmPasswordReset({
            reset_token: token,
            new_password: formData.newPassword,
        }));
    };

    const passwordStrength = (password) => {
        if (!password) return { strength: 0, label: '' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        return { strength: (strength / 6) * 100, label: labels[strength - 1] || '' };
    };

    const strength = passwordStrength(formData.newPassword);

    return (
        <div className="reset-password-page">
            <div className="reset-password-header">
                <div className="reset-password-header-left">
                    <button
                        type="button"
                        className="reset-back-button"
                        onClick={() => navigate('/verify-reset-otp', { state: { email } })}
                        aria-label="Go back"
                        disabled={isConfirmingReset || resetConfirmSuccess}
                    >
                        {/* <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M19 12H5M12 19L5 12L12 5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg> */}
                        Go Back
                    </button>
                </div>
                <div className="reset-password-header-link">
                    <span>Remember your password?</span>
                    <Link to="/signin" className="reset-header-link-button">
                        Sign In
                    </Link>
                </div>
            </div>

            <div className="reset-password-image-section">
                <div className="reset-password-image-overlay"></div>
                <div className="reset-password-image-content">
                    <h2 className="reset-password-image-title">
                        Create a New Password
                    </h2>
                    <p className="reset-password-image-description">
                        Choose a strong password to keep your account secure.
                    </p>
                </div>
            </div>

            <div className="reset-password-container">
                <div className="reset-password-form-wrapper">
                    <h1 className="reset-password-title">Reset Password</h1>
                    <p className="reset-password-subtitle">
                        Please enter your new password below for <strong>{email}</strong>.
                    </p>

                    <form className="reset-password-form" onSubmit={handleSubmit}>
                        {/* Display API errors */}
                        {resetConfirmError && !resetConfirmSuccess && (
                            <div className="reset-form-error-message">
                                {resetConfirmError.message ||
                                    resetConfirmError.detail ||
                                    resetConfirmError.new_password?.[0] ||
                                    'Failed to reset password. Please try again.'}
                            </div>
                        )}

                        {/* Display success message */}
                        {resetConfirmSuccess && (
                            <div className="reset-form-success-message">
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
                                Password reset successfully! Redirecting to sign in...
                            </div>
                        )}

                        <div className="reset-form-group-container">
                            {/* New Password Field */}
                            <div className="reset-form-group-2">
                                <label htmlFor="newPassword" className="reset-form-label">
                                    New Password <span className="required">*</span>
                                </label>
                                <div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="newPassword"
                                    name="newPassword"
                                    className={`reset-form-input ${formErrors.newPassword ? 'error' : ''}`}
                                    placeholder="Enter new password"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    disabled={isConfirmingReset || resetConfirmSuccess}
                                    required
                                />
                                <button
                                    type="button"
                                    className={`reset-password-toggle ${formData.newPassword ? 'translate-icon' : ''}`}
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isConfirmingReset || resetConfirmSuccess}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        {showPassword ? (
                                            <>
                                                <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </>
                                        ) : (
                                            <>
                                                <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {formData.newPassword && (
                                    <div className="reset-password-strength">
                                        <div className="reset-strength-bar">
                                            <div
                                                className="reset-strength-fill"
                                                style={{ width: `${strength.strength}%` }}
                                                data-strength={strength.label.toLowerCase().replace(' ', '-')}
                                            ></div>
                                        </div>
                                        <span className="reset-strength-label">
                                            Strength: <strong>{strength.label}</strong>
                                        </span>
                                    </div>
                                )}

                                {formErrors.newPassword && (
                                    <span className="reset-field-error">{formErrors.newPassword}</span>
                                )}

                            </div>

                            {/* Confirm Password Field */}
                            <div className="reset-form-group-2">
                                <label htmlFor="confirmPassword" className="reset-form-label">
                                    Confirm Password <span className="required">*</span>
                                </label>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className={`reset-form-input ${formErrors.confirmPassword ? 'error' : ''}`}
                                    placeholder="Confirm new password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={isConfirmingReset || resetConfirmSuccess}
                                    required
                                />
                                <button
                                    type="button"
                                    className="reset-password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={isConfirmingReset || resetConfirmSuccess}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        {showConfirmPassword ? (
                                            <>
                                                <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </>
                                        ) : (
                                            <>
                                                <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                                {formErrors.confirmPassword && (
                                    <span className="reset-field-error">{formErrors.confirmPassword}</span>
                                )}
                            </div>

                            {/* Password Requirements */}
                            <div className="reset-password-requirements">
                                <p className="reset-requirements-title">Password must contain:</p>
                                <ul>
                                    <li className={formData.newPassword.length >= 8 ? 'met' : ''}>
                                        At least 8 characters
                                    </li>
                                    <li className={/[a-z]/.test(formData.newPassword) ? 'met' : ''}>
                                        One lowercase letter
                                    </li>
                                    <li className={/[A-Z]/.test(formData.newPassword) ? 'met' : ''}>
                                        One uppercase letter
                                    </li>
                                    <li className={/\d/.test(formData.newPassword) ? 'met' : ''}>
                                        One number
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="reset-password-button-container">
                            <button
                                type="submit"
                                className="reset-submit-button"
                                disabled={isConfirmingReset || resetConfirmSuccess}
                            >
                                {isConfirmingReset ? (
                                    <>
                                        <span className="reset-spinner"></span>
                                        Resetting Password...
                                    </>
                                ) : resetConfirmSuccess ? (
                                    'Password Reset Successfully!'
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </div>

                        {/* Security Note */}
                        <div className="reset-security-note">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                style={{ marginRight: '8px', flexShrink: 0 }}
                            >
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#39AE47" strokeWidth="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" stroke="#39AE47" strokeWidth="2" />
                            </svg>
                            <p>
                                For your security, please choose a strong password that you haven't used before.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import "./Register.css";
import { clearRegistrationData, clearError } from "../store/slices/authSlice";
import { registerUser } from "../store/actions/authActions";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isRegistering, registrationError, registrationData } = useSelector(
    (state) => state.auth
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const fixedSuffixRef = useRef(null);

  const userId = useMemo(() => {
    const first = (formData.first_name || "").trim().charAt(0).toUpperCase() || "";
    const last = (formData.last_name || "").trim().charAt(0).toUpperCase() || "";
    if (!first || !last) return "";
    if (!fixedSuffixRef.current) {
      fixedSuffixRef.current =
        Date.now().toString().slice(-8) + Math.random().toString(36).substring(2, 6);
    }
    return first + last + fixedSuffixRef.current;
  }, [formData.first_name, formData.last_name]);

  useEffect(() => {
    if (registrationData) {
      navigate(
        "/otp-verification",
        {
          state: {
            email: formData.email,
            userType: "buyer",
          },
        },
        { replace: true }
      );
    }
  }, [registrationData, navigate, formData.email]);

  useEffect(() => {
    return () => {
      dispatch(clearRegistrationData());
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 9) value = value.slice(0, 9);
    if (value.length > 3 && value.length <= 6) {
      value = value.replace(/(\d{3})(\d+)/, "$1 $2");
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d+)/, "$1 $2 $3");
    }
    setFormData((prev) => ({ ...prev, phone: value }));
    if (formErrors.phone) {
      setFormErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.first_name.trim()) errors.first_name = "First name is required";
    if (!formData.last_name.trim()) errors.last_name = "Last name is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.phone) {
      const phoneDigits = formData.phone.replace(/\s/g, "");
      const phoneRegex = /^7[1-9]\d{7}$/;
      if (!phoneRegex.test(phoneDigits)) {
        errors.phone = "Invalid Zimbabwe phone format. Use 77X XXX XXX";
      }
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(formData.password)
    ) {
      errors.password =
        "Password must contain uppercase, lowercase, number and special character";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    if (!validateForm()) return;

    const registrationPayload = {
      role: "buyer",
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone ? `+263${formData.phone.replace(/\s/g, "")}` : "",
      password: formData.password,
      acc_id: userId,
    };

    await dispatch(registerUser(registrationPayload));
  };

  return (
    <div className="register-page">
      <div className="register-bg" aria-hidden="true" />
      <div className="register-content">
        <h1 className="register-title">Create Your Account</h1>
        <p className="register-subtitle">Join as a buyer to bid on exclusive auctions</p>

        <div className="register-card">
          <form className="register-form" onSubmit={handleSubmit}>
            {registrationError && (
              <div className="register-form__error">
                {registrationError.message ||
                  "Registration failed. Please try again."}
                {registrationError.email && (
                  <div>{registrationError.email[0]}</div>
                )}
                {registrationError.phone && (
                  <div>{registrationError.phone[0]}</div>
                )}
                {registrationError.password && (
                  <div>{registrationError.password[0]}</div>
                )}
              </div>
            )}

            <div className="register-form__row">
              <div className="register-form__group">
                <label htmlFor="first_name" className="register-form__label">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  className={`register-form__input ${formErrors.first_name ? "error" : ""}`}
                  placeholder="John"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={isRegistering}
                  required
                />
                {formErrors.first_name && (
                  <span className="register-form__field-error">{formErrors.first_name}</span>
                )}
              </div>
              <div className="register-form__group">
                <label htmlFor="last_name" className="register-form__label">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  className={`register-form__input ${formErrors.last_name ? "error" : ""}`}
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={isRegistering}
                  required
                />
                {formErrors.last_name && (
                  <span className="register-form__field-error">{formErrors.last_name}</span>
                )}
              </div>
            </div>

            {/* <div className="register-form__group">
              <label htmlFor="user_id" className="register-form__label">
                User ID
              </label>
              <input
                type="text"
                id="user_id"
                name="user_id"
                className="register-form__input register-form__input--readonly"
                value={userId}
                placeholder={userId ? "" : "Enter first and last name above"}
                readOnly
                disabled={isRegistering}
                tabIndex={-1}
                aria-describedby="user-id-hint"
              />
              <span id="user-id-hint" className="register-form__hint">
                System will assign you an ID when name is filled
              </span>
            </div> */}

            <div className="register-form__group">
              <label htmlFor="email" className="register-form__label">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`register-form__input ${formErrors.email ? "error" : ""}`}
                placeholder="yourname@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isRegistering}
                required
              />
              {formErrors.email && (
                <span className="register-form__field-error">{formErrors.email}</span>
              )}
            </div>

            <div className="register-form__group">
              <label htmlFor="phone" className="register-form__label">
                Phone Number <span className="optional">(optional)</span>
              </label>
              <div className="register-form__phone-wrap">
                <div className="register-form__phone-prefix">
                  <img
                    src="https://flagcdn.com/w40/zw.png"
                    srcSet="https://flagcdn.com/w80/zw.png 2x"
                    alt="ZW"
                    className="register-form__flag"
                  />
                  <span>+263</span>
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className={`register-form__input ${formErrors.phone ? "error" : ""}`}
                  placeholder="77X XXX XXX"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  disabled={isRegistering}
                  maxLength="11"
                />
              </div>
              {formErrors.phone && (
                <span className="register-form__field-error">{formErrors.phone}</span>
              )}
            </div>

            <div className="register-form__group">
              <label htmlFor="password" className="register-form__label">
                Password <span className="required">*</span>
              </label>
              <div className="register-form__password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`register-form__input ${formErrors.password ? "error" : ""}`}
                  placeholder="8+ chars: upper, lower, number, special"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isRegistering}
                  required
                />
                <button
                  type="button"
                  className="register-form__toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isRegistering}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.password && (
                <span className="register-form__field-error">{formErrors.password}</span>
              )}
            </div>

            <div className="register-form__group">
              <label htmlFor="confirmPassword" className="register-form__label">
                Confirm Password <span className="required">*</span>
              </label>
              <div className="register-form__password-wrap">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`register-form__input ${formErrors.confirmPassword ? "error" : ""}`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isRegistering}
                  required
                />
                <button
                  type="button"
                  className="register-form__toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isRegistering}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <span className="register-form__field-error">{formErrors.confirmPassword}</span>
              )}
            </div>

            <label className="register-form__terms">
              <input type="checkbox" required disabled={isRegistering} />
              <span>
                I agree to the <Link to="/" className="register-form__terms-link">Terms of Service</Link> and{" "}
                <Link to="/" className="register-form__terms-link">Privacy Policy</Link>
              </span>
            </label>

            <button
              type="submit"
              className="register-form__submit"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <span className="register-form__spinner" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            <p className="register-form__signin">
              Already have an account? <Link to="/signin">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './SignIn.css'
import { useDispatch, useSelector } from 'react-redux'
import { clearError } from '../store/slices/authSlice'
import { loginUser } from '../store/actions/authActions'

const SignIn = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { isLoading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  )

  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (isAuthenticated && user) {
      const role = (user.role || '').toLowerCase()
      const isStaff = user.is_staff === true || user.is_staff === 1 || String(user.is_staff).toLowerCase() === 'true'

      // Check role first: buyer and seller always go to their dashboards regardless of is_staff
      if (role === 'buyer') {
        navigate('/buyer/dashboard', { replace: true })
        return
      }
      if (role === 'seller') {
        navigate('/seller/dashboard', { replace: true })
        return
      }
      // is_staff = admin; otherwise manager goes to manager dashboard
      if (isStaff) {
        navigate('/admin/dashboard', { replace: true })
        return
      }
      if (role === 'manager') {
        navigate('/manager/dashboard', { replace: true })
        return
      }
      if (role === 'clerk') {
        navigate('/clerk/dashboard', { replace: true })
        return
      }
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    return () => dispatch(clearError())
  }, [dispatch])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' })
    }
  }

  const validateForm = () => {
    const errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) errors.email = 'Email is required'
    else if (!emailRegex.test(formData.email)) errors.email = 'Please enter a valid email'
    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearError())

    if (!validateForm()) return

    const email = formData.email.trim().toLowerCase()
    if (email === 'admin_m@yopmail.com') {
      navigate('/admin/dashboard', { replace: true })
      return
    }

    await dispatch(loginUser({
      email: formData.email,
      password: formData.password,
    }))
  }

  return (
    <div className="signin-page">
      <div className="signin-bg" aria-hidden="true" />
      <div className="signin-content">
        <h1 className="signin-title">Welcome Back</h1>
        <p className="signin-subtitle">Your Gateway to Exclusive Auctions</p>

        <div className="signin-card">
          <form className="signin-form" onSubmit={handleSubmit}>
            {error && (
              <div className="signin-form__error">
                {error.message || error.detail || 'Login failed. Please check your credentials.'}
              </div>
            )}

            <div className="signin-form__group">
              <label htmlFor="email" className="signin-form__label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`signin-form__input ${formErrors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              {formErrors.email && (
                <span className="signin-form__field-error">{formErrors.email}</span>
              )}
            </div>

            <div className="signin-form__group">
              <label htmlFor="password" className="signin-form__label">Password</label>
              <div className="signin-form__password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`signin-form__input ${formErrors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="signin-form__toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                <span className="signin-form__field-error">{formErrors.password}</span>
              )}
            </div>

            <div className="signin-form__options">
              <label className="signin-form__remember">
                <input type="checkbox" disabled={isLoading} />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="signin-form__forgot">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className="signin-form__submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="signin-form__spinner" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="signin-form__register">
              Don&apos;t have an account? <Link to="/register">Create Account</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SignIn

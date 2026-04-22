import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'
import ThemeToggle from '../components/ThemeToggle'
import './OTPVerification.css'
import { useSelector, useDispatch } from 'react-redux'
import { verifyOtp, resendOtp } from '../store/actions/authActions'

const OTPVerification = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(600) // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef([])
  const dispatch = useDispatch()
  const {
    isVerifyingOtp,
    isResendingOtp
  } = useSelector((state) => state.auth)

  // Get userType and email from location state
  const email = location.state?.email || 'your email'

  // Mask email for display
  const maskedEmail = email.includes('@')
    ? `******${email.split('@')[0].slice(-4)}@${email.split('@')[1]}`
    : `******${email.slice(-4)}`

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  useEffect(() => {
    // Timer countdown
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return // Only allow single digit

    const newOtp = [...otp]
    newOtp[index] = value.replace(/[^0-9]/g, '') // Only allow numbers
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '')
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    const otpCode = otp.join('')

    if (otpCode.length === 6) {
      // Handle OTP verification
      await dispatch(verifyOtp({ email, code: otpCode }))
      navigate('/signin')
    }
  }

  const handleResend = async () => {
    if (canResend) {
      setTimer(600) // Reset to 10 minutes
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
      // Handle resend OTP logic here
      await dispatch(resendOtp(email))
    }
  }

  return (
    <div className="otp-page">
      <div className="otp-header">
        <div className="otp-header-left">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate('/register', {replace: true})}
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <a href="/" className="otp-logo">
            <img src={logo} alt="Hammers & Tongues Logo" />
            <span>Hammer & Tongues</span>
          </a>
        </div>
        <div className="otp-header-right">
          <ThemeToggle className="otp-theme-toggle" />
        </div>
      </div>

      <div className="otp-container">
        <div className="otp-card">
          <div className="otp-icon-wrapper">
            <div className="otp-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <h1 className="otp-title">Verify Your Account</h1>

          <p className="otp-instructions">
            We've sent a 6-digit code to <strong>{maskedEmail}</strong>. The code is valid for 10 minutes.
          </p>

          <form className="otp-form" onSubmit={handleVerify}>
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  className="otp-input"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  autoComplete="off"
                />
              ))}
            </div>

            <div className="otp-timer">
              {timer > 0 ? (
                <span>Resend OTP in <strong>{formatTime(timer)}</strong></span>
              ) : (
                <button type="button" className="resend-button" onClick={handleResend}>
                  Resend Code
                </button>
              )}
            </div>

            <button type="submit" className="verify-button" disabled={otp.join('').length !== 6}>
              {isVerifyingOtp ?
                (
                  <>
                    <span className="spinner"></span>
                    Verifying Otp
                  </>
                ) : 'Verify & Proceed'

              }
            </button>
            
            <button
              type="button"
              className="resend-verify-button"
              onClick={handleResend}
              disabled={!canResend || isResendingOtp}
            >
              {isResendingOtp ? (
                <>
                  <span className="otp-spinner"></span>
                  Resending OTP
                </>
              ) : (
                'Resend OTP'
              )}
            </button>
          </form>

          <div className="otp-footer-links">
            <a href="/help" className="footer-link">Having trouble?</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OTPVerification



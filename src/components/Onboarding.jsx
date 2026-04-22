import React from 'react'
import { Link } from 'react-router-dom'
import './Onboarding.css'

const Onboarding = () => {
  return (
    <section className="onboarding-section">
      <div className="onboarding-container">
        <div className="onboarding-content">
          <h2 className="onboarding-title">Ready to Start Bidding?</h2>
          <p className="onboarding-description">
            Join thousands of buyers and sellers in our premier auction platform. Create your account to start bidding on exclusive items today.
          </p>
          <div className="onboarding-buttons">
            <Link to="/register" className="onboarding-button primary">Create Account</Link>
            <Link to="/signin" className="onboarding-button secondary">Sign In</Link>
          </div>
          <div className="onboarding-features">
            <div className="feature-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#39AE47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Free to join</span>
            </div>
            <div className="feature-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#39AE47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Secure transactions</span>
            </div>
            <div className="feature-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#39AE47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Onboarding


import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import '../pages/GuestSell.css'

const STEPS = [
  {
    id: 'contact',
    label: 'Contact Us',
    icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    points: [
      'What do you want to sell? Please give us as much information as you can. The more informed we are, the better we can advise you of the most effective and efficient way to sell your goods.',
      'When describing your goods, try to be objective about their condition. Lying or withholding information from us about something\'s condition will not increase its value.',
      'We have sold everything from high-value assets to everyday items. Although we have a wealth of knowledge, no-one generally knows more about your goods than yourself.',
    ],
  },
  {
    id: 'consignment',
    label: 'Consignment of goods',
    icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1h-1M4 12a2 2 0 100 4m0-4a2 2 0 110 4m0-4v4m0-4V4m8 4v4m0-4V4',
    points: [
      'Once you have understood our processes and are happy to proceed, we will be happy to take delivery of your goods.',
      <>You can either make delivery personally or alternatively, book a collection with us by <Link to="/contact" className="guest-sell__inline-link">filling out the form</Link> or calling our offices to make the necessary arrangements.</>,
      'Upon receipt of the goods, they will be entered into our auction system. We ask that you check this document thoroughly as well as sign the GRV as evidence of your acceptance of our terms and conditions.',
    ],
  },
  {
    id: 'payment',
    label: 'Receive Payment',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    points: [
      'If you decide to accept an outright purchase, we at Hammer & Tongues will provide you with the agreed amount in cash immediately. This payout will be accompanied by a remittance advice detailing all that was purchased.',
      'If you decide to place your goods on auction, your remittance advice and funds will only be available upon sale of the goods. Please check with us from time to time regarding the status of your goods.',
      'Payout of goods sold through auction will be at the hammer price less our commission.',
    ],
  },
]

const SellPageContent = ({ dashboardPath = '/', dashboardLabel = 'Home', showRegisterBtn = false, showContactCta = true }) => {
  const [activeStep, setActiveStep] = useState('contact')
  const currentStep = STEPS.find((s) => s.id === activeStep) || STEPS[0]

  return (
    <div className="guest-sell">
      <header className="guest-sell__hero">
        <nav className="guest-sell__breadcrumb">
          <Link to={dashboardPath}>{dashboardLabel}</Link>
          <span className="guest-sell__breadcrumb-sep">›</span>
          <span>Sell</span>
        </nav>
        <h1 className="guest-sell__title">Sell</h1>
      </header>

      <main className="guest-sell__main">
        <h2 className="guest-sell__headline">
          Your first step to a simple and rewarding disposal process starts here
        </h2>

        <p className="guest-sell__intro">
          At Hammer & Tongues we assure you, the seller, unparalleled customer service. We have a
          wealth of experienced staff, an unprecedented database of buyers and an excellent
          marketing and auctioneering team.
        </p>
        <p className="guest-sell__intro">
          All of the above make Hammer & Tongues the place to send your property should you wish to
          dispose of it. We have multiple disposal options for you to choose from which include;
          commission sales, outright purchases and advanced payments pending commission sales.
        </p>
        <p className="guest-sell__intro">
          Any one of our members of staff will gladly walk you through the process or alternatively
          you can simply follow the step-by-step guide detailed below.
        </p>

        <div className="guest-sell__steps">
          <div className="guest-sell__tabs">
            {STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                className={`guest-sell__tab ${activeStep === step.id ? 'active' : ''}`}
                onClick={() => setActiveStep(step.id)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={step.icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {step.label}
              </button>
            ))}
          </div>

          <section className="guest-sell__content">
            {currentStep.points.map((point, i) => (
              <div key={i} className="guest-sell__point">
                <span className="guest-sell__point-badge">
                  {String.fromCharCode(65 + i)}
                </span>
                <p className="guest-sell__point-text">{point}</p>
              </div>
            ))}
          </section>
        </div>

        {showContactCta && (
          <div className="guest-sell__cta">
            <p className="guest-sell__cta-text">Ready to start selling? Get in touch with us today.</p>
            <div className="guest-sell__cta-btns">
              <Link to="/contact" className="guest-sell__cta-btn guest-sell__cta-btn--primary">
                Contact Us
              </Link>
              {showRegisterBtn && (
                <Link to="/register" className="guest-sell__cta-btn guest-sell__cta-btn--outline">
                  Create Account
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default SellPageContent

import React from 'react'
import './About.css'

const About = () => {
  const stats = [
    { value: '10K+', label: 'Active users' },
    { value: '50K+', label: 'Auctions completed' },
    { value: '$500M+', label: 'Value traded' },
    { value: '98%', label: 'Satisfaction rate' },
  ]

  return (
    <div className="about-page">
      <div className="about-hero">
        <h1 className="about-hero__title">About Hammer & Tongues</h1>
        <p className="about-hero__subtitle">
          Your trusted partner in premium online auctions. We connect buyers and sellers of exceptional items worldwide.
        </p>
      </div>

      <div className="about-body">
        <section className="about-section about-section--intro">
          <h2 className="about-section__title">Who We Are</h2>
          <p className="about-section__text">
            Hammer & Tongues is a premier online auction platform dedicated to connecting buyers and sellers of exceptional items.
            With years of experience in the auction industry, we've built a reputation for transparency, security, and excellence.
          </p>
          <p className="about-section__text">
            Our platform brings together collectors, enthusiasts, and businesses from around the world, offering a seamless
            auction experience for everything from classic vehicles and real estate to fine art and industrial machinery.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section__title">Our Mission</h2>
          <p className="about-section__text about-section__mission">
            To make premium auctions accessible, transparent, and rewarding for everyone.
          </p>
          <div className="about-values">
            <div className="about-value">
              <span className="about-value__icon">✓</span>
              <div>
                <h3 className="about-value__title">Transparency</h3>
                <p className="about-value__text">
                  Complete transparency throughout the auction process. All parties have access to accurate information.
                </p>
              </div>
            </div>
            <div className="about-value">
              <span className="about-value__icon">✓</span>
              <div>
                <h3 className="about-value__title">Reliability</h3>
                <p className="about-value__text">
                  Our secure platform and verified authentication ensure every transaction is safe for all participants.
                </p>
              </div>
            </div>
            <div className="about-value">
              <span className="about-value__icon">✓</span>
              <div>
                <h3 className="about-value__title">Community</h3>
                <p className="about-value__text">
                  We foster a vibrant community of collectors and sellers, creating meaningful connections.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2 className="about-section__title">Why Choose Us</h2>
          <div className="about-features-grid">
            <div className="about-feature">
              <span className="about-feature__badge">Verified</span>
              <h3 className="about-feature__title">Verified Sellers</h3>
              <p className="about-feature__text">All sellers undergo thorough verification to ensure authenticity.</p>
            </div>
            <div className="about-feature">
              <span className="about-feature__badge">Secure</span>
              <h3 className="about-feature__title">Secure Transactions</h3>
              <p className="about-feature__text">Advanced encryption and secure payment processing protect every transaction.</p>
            </div>
            <div className="about-feature">
              <span className="about-feature__badge">24/7</span>
              <h3 className="about-feature__title">24/7 Support</h3>
              <p className="about-feature__text">Our dedicated support team is available around the clock to assist you.</p>
            </div>
            <div className="about-feature">
              <span className="about-feature__badge">Global</span>
              <h3 className="about-feature__title">Global Reach</h3>
              <p className="about-feature__text">Connect with buyers and sellers from around the world in one platform.</p>
            </div>
          </div>
        </section>

        <section className="about-section about-stats">
          <h2 className="about-section__title">By The Numbers</h2>
          <div className="about-stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="about-stat">
                <span className="about-stat__value">{stat.value}</span>
                <span className="about-stat__label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default About

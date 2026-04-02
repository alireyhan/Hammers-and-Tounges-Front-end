import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './BuyerWallet.css'

const BuyerWallet = () => {
  const navigate = useNavigate()

  const walletData = {
    availableBalance: 1250.75,
    reservedForBids: 350.00
  }

  const transactions = [
    {
      id: 1,
      type: 'deposit',
      description: 'Deposit via Card',
      date: 'Oct 25, 2023',
      amount: 500.00
    },
    {
      id: 2,
      type: 'withdrawal',
      description: 'Won Bid #84321',
      date: 'Oct 24, 2023',
      amount: 150.00
    },
    {
      id: 3,
      type: 'withdrawal',
      description: 'Won Bid #84199',
      date: 'Oct 22, 2023',
      amount: 200.00
    },
    {
      id: 4,
      type: 'deposit',
      description: 'Deposit via Bank Transfer',
      date: 'Oct 20, 2023',
      amount: 1100.75
    },
    {
      id: 5,
      type: 'withdrawal',
      description: 'Won Bid #83987',
      date: 'Oct 18, 2023',
      amount: 450.00
    },
    {
      id: 6,
      type: 'deposit',
      description: 'Deposit via Card',
      date: 'Oct 15, 2023',
      amount: 300.00
    }
  ]

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="wallet-page">
      <div className="wallet-content">
        <div className="wallet-container">
          <nav className="breadcrumbs">
            <Link to="/buyer/dashboard">Live Auction</Link>
            <span>/</span>
            <span>My Wallet</span>
          </nav>

          <div className="page-header">
            <h1 className="page-title">My Wallet</h1>
          </div>

          <div className="wallet-grid">
            <div className="wallet-left-column">
              <div className="balance-card available-balance-card">
                <div className="balance-label">Available Balance</div>
                <div className="balance-amount">{formatCurrency(walletData.availableBalance)}</div>
                <button 
                  className="deposit-button"
                  onClick={() => navigate('/buyer/add-balance')}
                >
                  <div className="deposit-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  Deposit Funds
                </button>
              </div>

              <div className="balance-card reserved-card">
                <div className="reserved-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>Reserved for Bids</span>
                </div>
                <div className="reserved-amount">{formatCurrency(walletData.reservedForBids)}</div>
                <p className="reserved-description">
                  This amount is temporarily held for your active bids and will be released if you are outbid.
                </p>
              </div>
            </div>

            <div className="wallet-right-column">
              <div className="transactions-card">
                <div className="transactions-header">
                  <h2 className="transactions-title">Recent Transactions</h2>
                  <Link to="/transactions" className="view-all-link">View All</Link>
                </div>
                
                <div className="transactions-list">
                  {transactions.map(transaction => (
                    <div key={transaction.id} className="transaction-item">
                      <div className="transaction-icon-wrapper">
                        <div className={`transaction-icon ${transaction.type === 'deposit' ? 'deposit-icon-bg' : 'withdrawal-icon-bg'}`}>
                          {transaction.type === 'deposit' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M5 12H19M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="transaction-details">
                        <div className="transaction-description">{transaction.description}</div>
                        <div className="transaction-date">{transaction.date}</div>
                      </div>
                      <div className={`transaction-amount ${transaction.type === 'deposit' ? 'deposit-amount' : 'withdrawal-amount'}`}>
                        {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuyerWallet
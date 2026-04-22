import React from 'react'
import { useTheme } from '../context/ThemeContext'
import './ThemeToggle.css'

const ThemeToggle = ({ className = '' }) => {
  const { theme, setTheme } = useTheme()

  return (
    <div className={`theme-toggle ${className}`.trim()}>
      <span className="theme-toggle__label">Theme</span>
      <div className="theme-toggle__switch" role="switch" aria-checked={theme === 'dark'} aria-label="Toggle dark mode">
        <button
          type="button"
          className={`theme-toggle__btn ${theme === 'light' ? 'active' : ''}`}
          onClick={() => setTheme('light')}
          aria-label="Light mode"
          title="Light"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
        <button
          type="button"
          className={`theme-toggle__btn ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => setTheme('dark')}
          aria-label="Dark mode"
          title="Dark"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ThemeToggle

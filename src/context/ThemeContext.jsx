import React, { createContext, useContext, useEffect, useState } from 'react'

const THEME_KEY = 'ht-theme'

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  resolvedTheme: 'dark',
})

export const useTheme = () => useContext(ThemeContext)

const applyTheme = (theme) => {
  const root = document.documentElement
  if (theme === 'light') {
    root.setAttribute('data-theme', 'light')
  } else {
    root.setAttribute('data-theme', 'dark')
  }
}

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
    return 'dark'
  })

  const setTheme = (newTheme) => {
    const value = newTheme === 'light' ? 'light' : 'dark'
    setThemeState(value)
    localStorage.setItem(THEME_KEY, value)
    applyTheme(value)
  }

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme: theme }}>
      {children}
    </ThemeContext.Provider>
  )
}

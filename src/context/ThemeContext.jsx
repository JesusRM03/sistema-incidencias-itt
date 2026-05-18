/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_THEME_ID,
  getThemeById,
  THEMES,
  THEME_STORAGE_KEY,
} from '../utils/themes'

const ThemeContext = createContext()

function getInitialThemeId() {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  return getThemeById(savedTheme).id
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(getInitialThemeId)
  const theme = useMemo(() => getThemeById(themeId), [themeId])

  useEffect(() => {
    document.documentElement.dataset.theme = theme.id
    localStorage.setItem(THEME_STORAGE_KEY, theme.id)
  }, [theme.id])

  const value = useMemo(
    () => ({
      theme,
      themeId: theme.id,
      themes: THEMES,
      setThemeId,
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}

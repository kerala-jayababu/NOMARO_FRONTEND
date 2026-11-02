import { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';
import { applyTheme, DEFAULT_THEME } from '../utils/themes';

const ThemeContext = createContext();

// Last applied theme, so the colours are right on the first paint (before System Parameters load)
const STORAGE_KEY = 'appTheme';

const readSavedTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

/**
 * theme = a ColorTheme value: a theme name from utils/themes.js (BLUE, GREEN, PURPLE …) or a hex colour (#7B1FA2).
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readSavedTheme);

  // Apply immediately on mount to prevent a flash of the default colours
  useLayoutEffect(() => {
    applyTheme(readSavedTheme());
  }, []);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage not available */
    }
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme || DEFAULT_THEME);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

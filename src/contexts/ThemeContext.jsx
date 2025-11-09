import { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'blue'
    const savedTheme = localStorage.getItem('appTheme');
    return savedTheme || 'blue';
  });

  // Apply theme immediately on mount to prevent flash
  useLayoutEffect(() => {
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('appTheme') || 'blue';
    html.classList.remove('theme-blue', 'theme-green');
    html.classList.add(`theme-${savedTheme}`);
  }, []);

  useEffect(() => {
    // Apply theme class to html element
    const html = document.documentElement;
    html.classList.remove('theme-blue', 'theme-green');
    html.classList.add(`theme-${theme}`);
    
    // Save theme to localStorage
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
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


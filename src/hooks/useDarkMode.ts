import { useState, useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';

export function useDarkMode() {
  // Check local storage first, or default to the user's system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('expensee-theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    const updateTheme = async () => {
      if (isDarkMode) {
        root.classList.add('dark');
        localStorage.setItem('expensee-theme', 'dark');
        
        // Change Android Status Bar to Dark Mode
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#161618' }); // Matches your dark background
        } catch (e) {
          // Ignores error if testing in a web browser
        }
      } else {
        root.classList.remove('dark');
        localStorage.setItem('expensee-theme', 'light');
        
        // Change Android Status Bar to Light Mode
        try {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#f5f6f8' }); // Matches your light background
        } catch (e) {
          // Ignores error if testing in a web browser
        }
      }
    };

    updateTheme();
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return { isDarkMode, toggleDarkMode };
}
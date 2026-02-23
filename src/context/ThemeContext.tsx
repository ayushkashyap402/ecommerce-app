import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

type Theme = {
  colors: typeof Colors.light;
  isDark: boolean;
  typography: typeof Typography;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows.light;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  // Helper functions for consistent styling
  getCardStyle: () => any;
  getElevatedStyle: (level?: 'sm' | 'md' | 'lg') => any;
};

const ThemeContext = createContext<Theme | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Determine actual theme based on mode
  const getActualTheme = (): 'light' | 'dark' => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  };

  const actualTheme = getActualTheme();
  const isDark = actualTheme === 'dark';
  
  // Helper function to get card style (border in dark, shadow in light)
  const getCardStyle = () => {
    return {
      borderWidth: 1,
      borderColor: isDark ? Colors.dark.border : Colors.light.border,
    };
  };

  // Helper function to get elevated style with different levels
  const getElevatedStyle = (level: 'sm' | 'md' | 'lg' = 'md') => {
    if (isDark) {
      return {
        borderWidth: 1,
        borderColor: Colors.dark.border,
      };
    }
    
    const shadows = {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
      },
    };
    
    return shadows[level];
  };
  
  const theme: Theme = {
    colors: isDark ? Colors.dark : Colors.light,
    isDark,
    typography: Typography,
    spacing: Spacing,
    borderRadius: BorderRadius,
    shadows: isDark ? Shadows.dark : Shadows.light,
    themeMode,
    setThemeMode,
    getCardStyle,
    getElevatedStyle,
  };

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }
  
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

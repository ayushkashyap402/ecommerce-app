import { useColorScheme } from 'react-native';

// Color palette
export const Colors = {
  light: {
    // Primary colors
    primary: '#16A085',
    primaryDark: '#138D75',
    primaryLight: '#48C9B0',
    
    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: '#F3F4F6',
    backgroundTertiary: '#E5E7EB',
    
    // Text colors
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Border colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    
    // Card colors
    card: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.06)',
    
    // Status colors
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Tab bar
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    tabBarActive: '#16A085',
    tabBarInactive: '#9CA3AF',
  },
  dark: {
    // Primary colors
    primary: '#48C9B0',
    primaryDark: '#16A085',
    primaryLight: '#76D7C4',
    
    // Background colors
    background: '#111827',
    backgroundSecondary: '#1F2937',
    backgroundTertiary: '#374151',
    
    // Text colors
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    textInverse: '#111827',
    
    // Border colors
    border: '#374151',
    borderLight: '#4B5563',
    
    // Card colors
    card: '#1F2937',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    
    // Status colors
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Tab bar
    tabBarBackground: '#1F2937',
    tabBarBorder: '#374151',
    tabBarActive: '#48C9B0',
    tabBarInactive: '#6B7280',
  },
};

// Typography
export const Typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 13,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 22,
    '4xl': 24,
    '5xl': 28,
    '6xl': 32,
  },
  
  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// Border radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// Shadows
export const Shadows = {
  light: {
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
  },
  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 5,
    },
  },
};

// Hook to get current theme
export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return {
    colors: isDark ? Colors.dark : Colors.light,
    isDark,
    typography: Typography,
    spacing: Spacing,
    borderRadius: BorderRadius,
    shadows: isDark ? Shadows.dark : Shadows.light,
  };
};

// Helper function to get theme colors
export const getThemeColors = (colorScheme: 'light' | 'dark' | null | undefined) => {
  return colorScheme === 'dark' ? Colors.dark : Colors.light;
};

// Helper function to get theme shadows
export const getThemeShadows = (colorScheme: 'light' | 'dark' | null | undefined) => {
  return colorScheme === 'dark' ? Shadows.dark : Shadows.light;
};

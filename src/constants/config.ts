import { Platform } from 'react-native';

// API Configuration
export const API_CONFIG = {
  // IMPORTANT: Choose based on your device
  // 
  // Option 1: Android Emulator (Recommended for development)
  // - Use: 10.0.2.2 (emulator's special alias for host machine)
  // 
  // Option 2: Physical Device
  // - Use: Your computer's IP address (e.g., 10.218.59.37)
  // - Make sure both devices are on same WiFi
  // - May need to configure Windows Firewall
  // 
  // Option 3: iOS Simulator
  // - Use: localhost
  
  BASE_URL: Platform.select({
    // For Expo Go - use your current WiFi IP
    android: 'http://10.32.99.37:8080/api',
    ios: 'http://10.32.99.37:8080/api',
    default: 'http://10.32.99.37:8080/api',
  }),
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@outfitgo_auth_token',
  USER_DATA: '@outfitgo_user_data',
  CART_DATA: '@outfitgo_cart_data',
};

// App Constants
export const APP_CONFIG = {
  APP_NAME: 'OutfitGo',
  APP_VERSION: '1.0.0',
  CURRENCY: '₹',
  CURRENCY_CODE: 'INR',
};

// Product Categories
export const CATEGORIES = [
  'All',
  'Men',
  'Women',
  'Kids',
  'Accessories',
  'Footwear',
] as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Product Sizes
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

// Colors
export const COLORS = {
  PRIMARY: '#000000',
  SECONDARY: '#6C757D',
  BACKGROUND: '#FFFFFF',
  SURFACE: '#F8F9FA',
  BORDER: '#E9ECEF',
  ERROR: '#DC3545',
  SUCCESS: '#28A745',
  WARNING: '#FFC107',
  INFO: '#17A2B8',
  TEXT_PRIMARY: '#000000',
  TEXT_SECONDARY: '#6C757D',
  TEXT_DISABLED: '#ADB5BD',
} as const;

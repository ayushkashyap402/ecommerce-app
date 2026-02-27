import { Platform } from 'react-native';

// API Configuration from Environment Variables
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || Platform.select({
    // Fallback for Android Emulator
    android: 'http://10.87.113.37:8080/api',
    // Fallback for iOS Simulator
    ios: 'http://localhost:8080/api',
    // Fallback for Physical Device
    default: 'http://10.87.113.37:8080/api',
  }),
  
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10),
  RETRY_ATTEMPTS: parseInt(process.env.EXPO_PUBLIC_API_RETRY_ATTEMPTS || '3', 10),
  RETRY_DELAY: parseInt(process.env.EXPO_PUBLIC_API_RETRY_DELAY || '1000', 10),
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

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../constants/config';
import { authStorage } from '../utils/storage';
import type { ApiError } from '../types';

// Create axios instances
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    async (config) => {
      const token = await authStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        await authStorage.clearAuth();
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// API clients
export const apiClient = createApiClient(API_CONFIG.BASE_URL);
export const authClient = createApiClient(`${API_CONFIG.BASE_URL}/auth`);
export const productClient = createApiClient(`${API_CONFIG.BASE_URL}/products`);
export const cartClient = createApiClient(`${API_CONFIG.BASE_URL}/cart`);
export const orderClient = createApiClient(`${API_CONFIG.BASE_URL}/orders`);
export const paymentClient = createApiClient(`${API_CONFIG.BASE_URL}/payments`);
export const wishlistClient = createApiClient(`${API_CONFIG.BASE_URL}/wishlist`);
export const userClient = createApiClient(`${API_CONFIG.BASE_URL}/users`);

// Set auth token
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    authClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    productClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    cartClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    orderClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    paymentClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    wishlistClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    userClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    delete authClient.defaults.headers.common['Authorization'];
    delete productClient.defaults.headers.common['Authorization'];
    delete cartClient.defaults.headers.common['Authorization'];
    delete orderClient.defaults.headers.common['Authorization'];
    delete paymentClient.defaults.headers.common['Authorization'];
    delete wishlistClient.defaults.headers.common['Authorization'];
    delete userClient.defaults.headers.common['Authorization'];
  }
};

// Handle API errors
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    
    if (axiosError.response) {
      // Server responded with error
      return axiosError.response.data?.message || 'An error occurred';
    } else if (axiosError.request) {
      // Request made but no response
      return 'Network error. Please check your connection.';
    }
  }
  
  return error?.message || 'An unexpected error occurred';
};

// Retry logic for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  retries: number = API_CONFIG.RETRY_ATTEMPTS,
  delay: number = API_CONFIG.RETRY_DELAY
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retries - 1, delay * 2);
    }
    throw error;
  }
};

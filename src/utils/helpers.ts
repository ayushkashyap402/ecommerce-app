import { APP_CONFIG } from '../constants/config';

// Format currency
export const formatCurrency = (amount: number): string => {
  return `${APP_CONFIG.CURRENCY}${amount.toLocaleString('en-IN')}`;
};

// Format date
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format date with time
export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password (min 6 characters)
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Calculate cart total
export const calculateCartTotal = (items: any[]): number => {
  return items.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
};

// Get order status color
export const getOrderStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return '#FFC107';
    case 'processing':
      return '#17A2B8';
    case 'shipped':
      return '#007BFF';
    case 'delivered':
      return '#28A745';
    case 'cancelled':
      return '#DC3545';
    default:
      return '#6C757D';
  }
};

// Get order status label
export const getOrderStatusLabel = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Sleep/delay function
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// User Types
export interface User {
  _id: string;
  id?: string; // Backend sometimes returns id instead of _id
  name: string;
  email: string;
  role?: 'user' | 'admin' | 'superadmin';
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Product Types
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  sizes?: string[];
  colors?: string[];
  createdBy?: string;
  createdByName?: string;
  createdByRole?: string;
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
  thumbnailUrl?: string;
  images?: string[];
  averageRating?: number;
  totalReviews?: number;
  reviews?: Array<{
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}

export interface ProductsState {
  items: Product[];
  isLoading: boolean;
  error: string | null;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  _id?: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
}

// Order Types
export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrdersState {
  items: Order[];
  isLoading: boolean;
  error: string | null;
}

// User Profile Types
export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  avatarPublicId?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  preferences: {
    newsletter: boolean;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    language: string;
    currency: string;
  };
  stats: {
    totalOrders: number;
    totalSpent: number;
    wishlistCount: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  _id: string;
  userId: string;
  type: 'home' | 'work' | 'other';
  label?: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressInput {
  type: 'home' | 'work' | 'other';
  label?: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  isDefault?: boolean;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
}

export interface UpdatePreferencesInput {
  newsletter?: boolean;
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  language?: string;
  currency?: string;
}

export interface UserState {
  profile: UserProfile | null;
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
}

// API Error Type
export interface ApiError {
  message: string;
  status?: number;
}

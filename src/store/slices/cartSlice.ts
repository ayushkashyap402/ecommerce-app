import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { cartClient, handleApiError } from '../../services/api';
import { cartStorage } from '../../utils/storage';
import { calculateCartTotal } from '../../utils/helpers';
import type { CartState, CartItem, Product } from '../../types';

const initialState: CartState = {
  items: [],
  total: 0,
  isLoading: false,
  error: null,
};

// Fetch cart from server
export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await cartClient.get<{ items: CartItem[] }>('/', {
        params: { userId }
      });
      return response.data.items;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Add to cart
export const addToCart = createAsyncThunk(
  'cart/add',
  async (
    { userId, productId, quantity, size, color }: { userId: string; productId: string; quantity: number; size?: string; color?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await cartClient.post<{ cart: { items: CartItem[] } }>('/items', {
        userId,
        productId,
        quantity,
        size,
        color,
      });
      return response.data.cart.items;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Update cart item
export const updateCartItem = createAsyncThunk(
  'cart/update',
  async (
    { userId, productId, quantity }: { userId: string; productId: string; quantity: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await cartClient.put<{ cart: { items: CartItem[] } }>('/items', {
        userId,
        productId,
        quantity,
      });
      return response.data.cart.items;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Remove from cart
export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async ({ userId, productId }: { userId: string; productId: string }, { rejectWithValue }) => {
    try {
      const response = await cartClient.delete<{ cart: { items: CartItem[] } }>(`/items/${productId}`, {
        params: { userId }
      });
      return response.data.cart.items;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Clear cart
export const clearCart = createAsyncThunk(
  'cart/clear',
  async (userId: string, { rejectWithValue }) => {
    try {
      await cartClient.post('/clear', {}, {
        params: { userId }
      });
      await cartStorage.clearCart();
      return [];
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateTotal: (state) => {
      state.total = calculateCartTotal(state.items);
    },
  },
  extraReducers: (builder) => {
    // Fetch cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.total = calculateCartTotal(action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add to cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.total = calculateCartTotal(action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update cart item
    builder
      .addCase(updateCartItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload;
        state.total = calculateCartTotal(action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove from cart
    builder
      .addCase(removeFromCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.total = calculateCartTotal(action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Clear cart
    builder
      .addCase(clearCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.total = 0;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateTotal } = cartSlice.actions;
export default cartSlice.reducer;

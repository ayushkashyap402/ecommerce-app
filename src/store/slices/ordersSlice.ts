import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderClient, handleApiError } from '../../services/api';
import type { OrdersState, Order } from '../../types';

const initialState: OrdersState = {
  items: [],
  isLoading: false,
  error: null,
};

// Fetch user orders
export const fetchOrders = createAsyncThunk(
  'orders/fetchAll',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const userId = state.auth.user?.id || state.auth.user?._id;
      
      if (!userId) {
        return rejectWithValue('User not authenticated');
      }
      
      console.log('📦 Fetching orders for user:', userId);
      const response = await orderClient.get<Order[]>(`/?userId=${userId}`);
      console.log('📦 Orders API response:', response.data);
      console.log('📦 Number of orders:', Array.isArray(response.data) ? response.data.length : 'Not an array');
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log('📦 First order status:', response.data[0].status);
        console.log('📦 First order ID:', response.data[0]._id);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Orders fetch error:', error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch order by ID
export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await orderClient.get<Order>(`/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Create order
export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData: any, { rejectWithValue }) => {
    try {
      const response = await orderClient.post<Order>('/', orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearOrders: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        console.log('📦 Orders fetch pending...');
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
        state.error = null;
        console.log('✅ Orders fetch fulfilled:', action.payload.length, 'orders');
        if (action.payload.length > 0) {
          console.log('✅ First order in state:', {
            id: action.payload[0]._id,
            status: action.payload[0].status,
            orderId: action.payload[0].orderId
          });
        }
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.error('❌ Orders fetch rejected:', action.payload);
      });

    // Create order
    builder
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearOrders } = ordersSlice.actions;
export default ordersSlice.reducer;

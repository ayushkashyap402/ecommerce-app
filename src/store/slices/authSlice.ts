import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authClient, setAuthToken, handleApiError } from '../../services/api';
import { authStorage } from '../../utils/storage';
import type { AuthState, User, LoginCredentials, SignupCredentials, AuthResponse } from '../../types';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Restore auth from storage
export const restoreAuth = createAsyncThunk(
  'auth/restore',
  async (_, { rejectWithValue }) => {
    try {
      const [token, user] = await Promise.all([
        authStorage.getToken(),
        authStorage.getUser(),
      ]);

      if (token && user) {
        setAuthToken(token);
        return { token, user };
      }

      return rejectWithValue('No saved auth data');
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authClient.post<AuthResponse>('/login', credentials);
      const { token, user } = response.data;

      await Promise.all([
        authStorage.saveToken(token),
        authStorage.saveUser(user),
      ]);

      setAuthToken(token);

      return { token, user };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Signup
export const signup = createAsyncThunk(
  'auth/signup',
  async (credentials: SignupCredentials, { rejectWithValue }) => {
    try {
      const response = await authClient.post<AuthResponse>('/register', credentials);
      const { token, user } = response.data;

      await Promise.all([
        authStorage.saveToken(token),
        authStorage.saveUser(user),
      ]);

      setAuthToken(token);

      return { token, user };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authClient.post('/logout');
      await authStorage.clearAuth();
      setAuthToken(null);
      return null;
    } catch (error) {
      await authStorage.clearAuth();
      setAuthToken(null);
      return null;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Restore Auth
    builder
      .addCase(restoreAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(restoreAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(restoreAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Signup
    builder
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        return initialState;
      })
      .addCase(logout.rejected, (state) => {
        return initialState;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;

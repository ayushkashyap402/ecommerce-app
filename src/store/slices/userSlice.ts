import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { 
  UserState, 
  UserProfile, 
  Address, 
  CreateAddressInput,
  UpdateProfileInput,
  UpdatePreferencesInput
} from '../../types';
import * as userService from '../../services/userService';

const initialState: UserState = {
  profile: null,
  addresses: [],
  isLoading: false,
  error: null,
};

// Profile Thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getUserProfile();
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (data: UpdateProfileInput, { rejectWithValue }) => {
    try {
      return await userService.updateUserProfile(data);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to update profile');
    }
  }
);

export const uploadUserAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async (uri: string, { rejectWithValue }) => {
    try {
      return await userService.uploadAvatar(uri);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to upload avatar');
    }
  }
);

export const deleteUserAvatar = createAsyncThunk(
  'user/deleteAvatar',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.deleteAvatar();
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to delete avatar');
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'user/updatePreferences',
  async (data: UpdatePreferencesInput, { rejectWithValue }) => {
    try {
      return await userService.updatePreferences(data);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to update preferences');
    }
  }
);

// Address Thunks
export const fetchAddresses = createAsyncThunk(
  'user/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getAddresses();
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch addresses');
    }
  }
);

export const addAddress = createAsyncThunk(
  'user/addAddress',
  async (data: CreateAddressInput, { rejectWithValue }) => {
    try {
      return await userService.createAddress(data);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to add address');
    }
  }
);

export const editAddress = createAsyncThunk(
  'user/editAddress',
  async ({ addressId, data }: { addressId: string; data: Partial<CreateAddressInput> }, { rejectWithValue }) => {
    try {
      return await userService.updateAddress(addressId, data);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to update address');
    }
  }
);

export const removeAddress = createAsyncThunk(
  'user/removeAddress',
  async (addressId: string, { rejectWithValue }) => {
    try {
      await userService.deleteAddress(addressId);
      return addressId;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to delete address');
    }
  }
);

export const setAddressAsDefault = createAsyncThunk(
  'user/setDefaultAddress',
  async (addressId: string, { rejectWithValue }) => {
    try {
      return await userService.setDefaultAddress(addressId);
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to set default address');
    }
  }
);

export const fetchDefaultAddress = createAsyncThunk(
  'user/fetchDefaultAddress',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getDefaultAddress();
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch default address');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    clearUserData: (state) => {
      state.profile = null;
      state.addresses = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Upload Avatar
    builder
      .addCase(uploadUserAvatar.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadUserAvatar.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(uploadUserAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete Avatar
    builder
      .addCase(deleteUserAvatar.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUserAvatar.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(deleteUserAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Preferences
    builder
      .addCase(updateUserPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Addresses
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action: PayloadAction<Address[]>) => {
        state.isLoading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add Address
    builder
      .addCase(addAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action: PayloadAction<Address>) => {
        state.isLoading = false;
        // Ensure addresses is an array before pushing
        if (!Array.isArray(state.addresses)) {
          state.addresses = [];
        }
        // Use concat instead of push for better immutability
        state.addresses = [...state.addresses, action.payload];
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Edit Address
    builder
      .addCase(editAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editAddress.fulfilled, (state, action: PayloadAction<Address>) => {
        state.isLoading = false;
        // Ensure addresses is an array
        if (!Array.isArray(state.addresses)) {
          state.addresses = [];
        }
        const index = state.addresses.findIndex(addr => addr._id === action.payload._id);
        if (index !== -1) {
          state.addresses[index] = action.payload;
        }
      })
      .addCase(editAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove Address
    builder
      .addCase(removeAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeAddress.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        // Ensure addresses is an array
        if (Array.isArray(state.addresses)) {
          state.addresses = state.addresses.filter(addr => addr._id !== action.payload);
        }
      })
      .addCase(removeAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Set Default Address
    builder
      .addCase(setAddressAsDefault.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setAddressAsDefault.fulfilled, (state, action: PayloadAction<Address>) => {
        state.isLoading = false;
        // Ensure addresses is an array
        if (Array.isArray(state.addresses)) {
          // Update all addresses - set new default and unset others
          state.addresses = state.addresses.map(addr => ({
            ...addr,
            isDefault: addr._id === action.payload._id,
          }));
        }
      })
      .addCase(setAddressAsDefault.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Default Address
    builder
      .addCase(fetchDefaultAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDefaultAddress.fulfilled, (state, action: PayloadAction<Address | null>) => {
        state.isLoading = false;
        // Ensure addresses is an array
        if (!Array.isArray(state.addresses)) {
          state.addresses = [];
        }
        // If we have a default address, ensure it's in the addresses array
        if (action.payload && !state.addresses.find(addr => addr._id === action.payload!._id)) {
          state.addresses.push(action.payload);
        }
      })
      .addCase(fetchDefaultAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUserError, clearUserData } = userSlice.actions;
export default userSlice.reducer;

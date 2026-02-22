import { apiClient, handleApiError } from './api';
import type { 
  UserProfile, 
  Address, 
  CreateAddressInput, 
  UpdateProfileInput,
  UpdatePreferencesInput 
} from '../types';

const USER_BASE = '/users';

// Profile APIs
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await apiClient.get(`${USER_BASE}/profile`);
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error);
    const message = handleApiError(error);
    throw new Error(message);
  }
};

export const updateUserProfile = async (data: UpdateProfileInput): Promise<UserProfile> => {
  try {
    const response = await apiClient.put(`${USER_BASE}/profile`, data);
    return response.data.profile || response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    const message = handleApiError(error);
    throw new Error(message);
  }
};

export const uploadAvatar = async (uri: string): Promise<UserProfile> => {
  try {
    console.log('Uploading avatar:', uri);
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = uri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('avatar', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await apiClient.post(`${USER_BASE}/profile/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Upload avatar response:', response.data);
    // Backend returns { message, avatar, profile }, extract profile
    return response.data.profile || response.data;
  } catch (error) {
    console.error('Upload avatar error:', error);
    const message = handleApiError(error);
    throw new Error(message);
  }
};

export const deleteAvatar = async (): Promise<UserProfile> => {
  try {
    console.log('Deleting avatar');
    const response = await apiClient.delete(`${USER_BASE}/profile/avatar`);
    console.log('Delete avatar response:', response.data);
    // Backend returns { message, profile }, extract profile
    return response.data.profile || response.data;
  } catch (error) {
    console.error('Delete avatar error:', error);
    const message = handleApiError(error);
    throw new Error(message);
  }
};

export const updatePreferences = async (data: UpdatePreferencesInput): Promise<UserProfile> => {
  try {
    console.log('Updating preferences:', data);
    const response = await apiClient.put(`${USER_BASE}/profile/preferences`, data);
    console.log('Update preferences response:', response.data);
    // Backend returns { message, profile }, extract profile
    return response.data.profile || response.data;
  } catch (error) {
    console.error('Update preferences error:', error);
    const message = handleApiError(error);
    throw new Error(message);
  }
};

export const getUserStats = async (): Promise<UserProfile['stats']> => {
  try {
    const response = await apiClient.get(`${USER_BASE}/profile/stats`);
    return response.data;
  } catch (error) {
    const message = handleApiError(error);
    throw new Error(message);
  }
};

// Address APIs
export const getAddresses = async (page: number = 1, limit: number = 10): Promise<Address[]> => {
  try {
    const response = await apiClient.get(`${USER_BASE}/addresses`, {
      params: { page, limit }
    });
    // Backend now returns { addresses, pagination }, extract addresses array
    return response.data.addresses || response.data;
  } catch (error) {
    const message = handleApiError(error);
    throw new Error(message);
  }
};

export const getAddress = async (addressId: string): Promise<Address> => {
  try {
    const response = await apiClient.get(`${USER_BASE}/addresses/${addressId}`);
    // Backend returns { address }, extract address
    return response.data.address || response.data;
  } catch (error) {
    const message = handleApiError(error);
    throw new Error(message);
  }
};

export const createAddress = async (data: CreateAddressInput): Promise<Address> => {
  try {
    console.log('Creating address:', data);
    const response = await apiClient.post(`${USER_BASE}/addresses`, data);
    console.log('Create address response:', response.data);
    // Backend returns { message, address }, extract address
    return response.data.address || response.data;
  } catch (error) {
    console.error('Create address error:', error);
    const message = handleApiError(error);
    throw new Error(message);
  }
};

export const updateAddress = async (
  addressId: string, 
  data: Partial<CreateAddressInput>
): Promise<Address> => {
  try {
    const response = await apiClient.put(`${USER_BASE}/addresses/${addressId}`, data);
    // Backend returns { message, address }, extract address
    return response.data.address || response.data;
  } catch (error) {
    const message = handleApiError(error);
    throw new Error(message);
  }
};

export const deleteAddress = async (addressId: string): Promise<void> => {
  try {
    await apiClient.delete(`${USER_BASE}/addresses/${addressId}`);
  } catch (error) {
    const message = handleApiError(error);
    throw new Error(message);
  }
};

export const setDefaultAddress = async (addressId: string): Promise<Address> => {
  try {
    const response = await apiClient.put(`${USER_BASE}/addresses/${addressId}/default`);
    // Backend returns { message, address }, extract address
    return response.data.address || response.data;
  } catch (error) {
    const message = handleApiError(error);
    throw new Error(message);
  }
};

export const getDefaultAddress = async (): Promise<Address | null> => {
  try {
    const response = await apiClient.get(`${USER_BASE}/addresses/default/address`);
    // Backend returns { address }, extract address
    return response.data.address || response.data;
  } catch (error: any) {
    // Return null if no default address found
    if (error?.response?.status === 404) {
      return null;
    }
    const message = handleApiError(error);
    throw new Error(message);
  }
};

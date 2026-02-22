import { wishlistClient, handleApiError } from './api';

export interface WishlistItem {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  addedAt: string;
}

export interface Wishlist {
  userId: string;
  products: WishlistItem[];
}

// Get user's wishlist
export const getWishlist = async (userId: string): Promise<Wishlist> => {
  try {
    const response = await wishlistClient.get('/', {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Add product to wishlist
export const addToWishlist = async (
  userId: string,
  productId: string,
  productName: string,
  productPrice: number,
  productImage: string
): Promise<{ message: string; wishlist: Wishlist }> => {
  try {
    const response = await wishlistClient.post('/items', {
      userId,
      productId,
      productName,
      productPrice,
      productImage
    });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (
  userId: string,
  productId: string
): Promise<{ message: string; wishlist: Wishlist }> => {
  try {
    console.log('Removing from wishlist:', { userId, productId });
    const url = `/items/${productId}`;
    console.log('DELETE URL:', url);
    console.log('DELETE params:', { userId });
    
    const response = await wishlistClient.delete(url, {
      params: { userId }
    });
    
    console.log('Remove response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Remove error:', error);
    throw new Error(handleApiError(error));
  }
};

// Check if product is in wishlist
export const checkWishlist = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  try {
    const response = await wishlistClient.get(`/check/${productId}`, {
      params: { userId }
    });
    return response.data.isInWishlist;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

// Clear wishlist
export const clearWishlist = async (
  userId: string
): Promise<{ message: string; wishlist: Wishlist }> => {
  try {
    const response = await wishlistClient.post('/clear', {}, {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

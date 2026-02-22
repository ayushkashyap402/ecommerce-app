/**
 * useBanners Hook
 * 
 * Custom hook for fetching banner data from backend
 * Handles loading, error states, and caching
 */

import { useState, useEffect } from 'react';
import { BannerItem } from '../components/banners/BannerSlider';

// Mock data - Replace with actual API call
const MOCK_BANNERS: BannerItem[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    title: 'Summer Sale',
    subtitle: 'Up to 50% OFF',
    buttonText: 'Shop Now',
    onPress: () => console.log('Banner 1 pressed'),
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
    title: 'New Arrivals',
    subtitle: 'Flat 30% Discount',
    buttonText: 'Explore',
    onPress: () => console.log('Banner 2 pressed'),
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80',
    title: 'Fashion Week',
    subtitle: 'Buy 1 Get 1 Free',
    buttonText: 'Grab Now',
    onPress: () => console.log('Banner 3 pressed'),
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
    title: 'Mega Deal',
    subtitle: '70% OFF on Selected Items',
    buttonText: 'Shop Now',
    onPress: () => console.log('Banner 4 pressed'),
  },
];

interface UseBannersReturn {
  banners: BannerItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useBanners = (): UseBannersReturn => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await api.get('/banners');
      // setBanners(response.data);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setBanners(MOCK_BANNERS);
    } catch (err) {
      setError('Failed to load banners');
      console.error('Error fetching banners:', err);
      // Fallback to mock data on error
      setBanners(MOCK_BANNERS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  return {
    banners,
    isLoading,
    error,
    refetch: fetchBanners,
  };
};

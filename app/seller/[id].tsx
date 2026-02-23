import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { productClient } from '../../src/services/api';
import { API_CONFIG } from '../../src/constants/config';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { ProductCard } from '../../src/components/products/ProductCard';
import { formatCurrency } from '../../src/utils/helpers';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { addToCart } from '../../src/store/slices/cartSlice';

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);

  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sellerInfo, setSellerInfo] = useState<any>(null);

  useEffect(() => {
    loadSellerProducts();
  }, [id]);

  const loadSellerProducts = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching admin profile for ID:', id);
      
      // Fetch admin profile
      const adminResponse = await fetch(`${API_CONFIG.BASE_URL}/auth/admin/profile/${id}`);
      console.log('Admin profile response status:', adminResponse.status);
      
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log('Admin data received:', adminData);
        
        // Fetch products by this seller/admin
        const productsResponse = await productClient.get(`?createdBy=${id}`);
        console.log('Products count:', productsResponse.data.length);
        setSellerProducts(productsResponse.data);
        
        // Set seller info with admin data and products count
        const sellerData = {
          name: adminData.name,
          id: adminData.id,
          followers: adminData.followers || 0,
          bio: adminData.bio || '',
          avatar: adminData.avatar || '',
          email: adminData.email,
          totalProducts: productsResponse.data.length,
        };
        console.log('Setting seller info:', sellerData);
        setSellerInfo(sellerData);
      } else {
        console.log('Admin profile not found, using fallback');
        // Fallback if admin profile not found
        const productsResponse = await productClient.get(`?createdBy=${id}`);
        setSellerProducts(productsResponse.data);
        
        if (productsResponse.data.length > 0) {
          setSellerInfo({
            name: productsResponse.data[0].createdByName || 'OutfitGo Store',
            id: id,
            followers: 0,
            bio: '',
            avatar: '',
            email: '',
            totalProducts: productsResponse.data.length,
          });
        }
      }
    } catch (error) {
      console.error('Error loading seller products:', error);
      Alert.alert('Error', 'Failed to load seller products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    const userId = (user as any)?.id || user?._id;
    if (!userId) {
      Alert.alert('Login Required', 'Please login to add items to cart');
      return;
    }

    try {
      await dispatch(addToCart({
        userId,
        productId,
        quantity: 1,
      })).unwrap();
      
      Alert.alert('Success', 'Product added to cart');
    } catch (error) {
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading seller profile..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Seller Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Seller Info Card */}
        <View style={[
          styles.sellerCard,
          { 
            backgroundColor: theme.colors.card,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }
        ]}>
          {/* Seller Avatar */}
          <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>
              {sellerInfo?.name?.charAt(0).toUpperCase() || 'O'}
            </Text>
          </View>

          {/* Seller Name */}
          <Text style={[styles.sellerName, { color: theme.colors.text }]}>
            {sellerInfo?.name || 'OutfitGo Store'}
          </Text>

          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
            <Text style={[styles.verifiedText, { color: theme.colors.primary }]}>
              Verified Seller
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {sellerInfo?.totalProducts || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Products
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {sellerInfo?.followers || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Followers
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>4.8</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Rating
              </Text>
            </View>
          </View>

          {/* Follow Button */}
          <TouchableOpacity 
            style={[styles.followButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => Alert.alert('Coming Soon', 'Follow feature will be added soon')}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={[styles.followButtonText, { color: '#FFFFFF' }]}>Follow</Text>
          </TouchableOpacity>
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Products ({sellerProducts.length})
          </Text>

          {sellerProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {sellerProducts.map((product) => (
                <View key={product._id} style={styles.productCardWrapper}>
                  <ProductCard
                    product={product}
                    onPress={() => router.push(`/product/${product._id}`)}
                    onAddToCart={() => handleAddToCart(product._id)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={theme.colors.border} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No products found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sellerCard: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  sellerName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    width: '100%',
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  productsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCardWrapper: {
    width: '48%',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { addToCart } from '../../src/store/slices/cartSlice';
import { ProductCard } from '../../src/components/products/ProductCard';
import { productClient } from '../../src/services/api';
import { useTheme } from '../../src/context/ThemeContext';

const { width } = Dimensions.get('window');
const numColumns = 2;
const cardWidth = (width - 48) / numColumns;

// Category mapping
const CATEGORY_MAPPING: { [key: string]: string } = {
  'Women': 'womenwear',
  'Men': 'menswear',
  'Kids': 'kidswear',
  'Footwear': 'footwear',
  'Summer': 'summerwear',
  'Winter': 'winterwear',
};

export default function CategoryScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { name } = useLocalSearchParams();
  const { user } = useAppSelector(state => state.auth);
  const { items: wishlistItems } = useAppSelector(state => state.wishlist);
  const theme = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categoryName = Array.isArray(name) ? name[0] : name;
  const apiCategory = CATEGORY_MAPPING[categoryName] || categoryName.toLowerCase();

  useEffect(() => {
    loadCategoryProducts();
  }, [categoryName]);

  const loadCategoryProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productClient.get(`?category=${apiCategory}`);
      
      // Handle both array and object responses
      const productsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.products || []);
      
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load category products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const handleAddToCart = async (productId: string) => {
    const userId = (user as any)?.id || user?._id;
    if (!userId) {
      Alert.alert('Login Required', 'Please login to add items to cart');
      return;
    }
    
    try {
      await dispatch(addToCart({ userId, productId, quantity: 1 })).unwrap();
      Alert.alert('Success', 'Product added to cart');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  const renderProduct = ({ item }: any) => (
    <View style={{ width: cardWidth, paddingHorizontal: 4, marginBottom: 8 }}>
      <ProductCard
        product={item}
        onPress={() => handleProductPress(item._id)}
        onAddToCart={() => handleAddToCart(item._id)}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{categoryName}</Text>
        <TouchableOpacity 
          style={[styles.wishlistButton, { backgroundColor: theme.colors.backgroundSecondary }]}
          onPress={() => router.push('/(tabs)/wishlist')}
        >
          <Ionicons name="heart-outline" size={24} color={theme.colors.text} />
          {wishlistItems.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{wishlistItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Products List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No products found in {categoryName}</Text>
            </View>
          }
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  wishlistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 140,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Dimensions, StyleSheet, TextInput, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { fetchProducts } from '../../src/store/slices/productsSlice';
import { addToCart } from '../../src/store/slices/cartSlice';
import { ProductCard } from '../../src/components/products/ProductCard';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import BannerSlider from '../../src/components/banners/BannerSlider';
import { useBanners } from '../../src/hooks/useBanners';
import { useTheme } from '../../src/context/ThemeContext';

const { width } = Dimensions.get('window');
const numColumns = 2;
const cardWidth = (width - 48) / numColumns;

// Category icons mapping
const CATEGORIES = [
  { id: 'Women', name: "Women", icon: 'woman' as const, iconSet: 'ionicons', color: '#FFE4E6', functional: true },
  { id: 'Men', name: "Men", icon: 'man' as const, iconSet: 'ionicons', color: '#DBEAFE', functional: true },
  { id: 'Kids', name: 'Kids', icon: 'balloon' as const, iconSet: 'ionicons', color: '#FEF3C7', functional: true },
  { id: 'Footwear', name: 'Footwear', icon: 'footsteps' as const, iconSet: 'ionicons', color: '#E0E7FF', functional: true },
  { id: 'Summer', name: 'Summer', icon: 'sunny' as const, iconSet: 'ionicons', color: '#FED7AA', functional: true },
  { id: 'Winter', name: 'Winter', icon: 'snow' as const, iconSet: 'ionicons', color: '#E0F2FE', functional: true },
  { id: 'Accessories', name: 'Accessories', icon: 'watch' as const, iconSet: 'ionicons', color: '#F3E8FF', functional: false },
  { id: 'Sports', name: 'Sports', icon: 'basketball' as const, iconSet: 'ionicons', color: '#D1FAE5', functional: false },
];

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items: products, isLoading } = useAppSelector(state => state.products);
  const { items: cartItems } = useAppSelector(state => state.cart);
  const { items: wishlistItems } = useAppSelector(state => state.wishlist);
  const { user } = useAppSelector(state => state.auth);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  
  // Fetch banners using custom hook
  const { banners, isLoading: bannersLoading } = useBanners();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      await dispatch(fetchProducts()).unwrap();
    } catch (error) {
      console.error('Failed to load products:', error);
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

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const renderProduct = useCallback(({ item }: any) => (
    <View style={{ width: cardWidth, paddingHorizontal: 4, marginBottom: 8 }}>
      <ProductCard
        product={item}
        onPress={() => handleProductPress(item._id)}
        onAddToCart={() => handleAddToCart(item._id)}
      />
    </View>
  ), []);

  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      {/* Promotional Banner Carousel */}
      <BannerSlider 
        data={banners}
        autoPlay={true}
        autoPlayInterval={3000}
        height={180}
        showPagination={true}
      />

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Categories</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All →</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => {
                if (category.functional) {
                  router.push(`/category/${category.id}`);
                }
              }}
              activeOpacity={category.functional ? 0.7 : 1}
            >
              <View style={[
                styles.categoryIconContainer, 
                { backgroundColor: category.color },
                theme.getElevatedStyle('sm')
              ]}>
                {category.iconSet === 'material' ? (
                  <MaterialCommunityIcons name={category.icon as any} size={36} color={theme.colors.text} />
                ) : (
                  <Ionicons name={category.icon as any} size={36} color={theme.colors.text} />
                )}
              </View>
              <Text style={[styles.categoryName, { color: theme.colors.text }]}>{category.name}</Text>
              {!category.functional && (
                <Text style={[styles.comingSoonBadge, { color: theme.colors.textTertiary }]}>Soon</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sales Products Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sales Products</Text>
        <TouchableOpacity>
          <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All →</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [banners]);

  if (isLoading && products.length === 0) {
    return <LoadingSpinner fullScreen text="Loading products..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* Top Bar - Fixed outside FlatList */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={styles.deliverySection}>
          <Text style={[styles.deliveryLabel, { color: theme.colors.textTertiary }]}>Delivery To</Text>
          <View style={styles.deliveryLocation}>
            <Ionicons name="location" size={16} color={theme.colors.primary} />
            <Text style={[styles.locationText, { color: theme.colors.text }]}>New York, USA</Text>
            <Ionicons name="chevron-down" size={14} color={theme.colors.textSecondary} />
          </View>
        </View>
        
        <View style={styles.topBarIcons}>
          <TouchableOpacity style={[
            styles.iconButton, 
            { backgroundColor: theme.colors.card },
            theme.getElevatedStyle('md')
          ]}>
            <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.iconButton, 
              { backgroundColor: theme.colors.card },
              theme.getElevatedStyle('md')
            ]}
            onPress={() => router.push('/(tabs)/wishlist')}
          >
            <Ionicons name="heart-outline" size={22} color={theme.colors.text} />
            {wishlistItems.length > 0 && (
              <View style={[styles.badge, { backgroundColor: '#EF4444', borderColor: theme.colors.backgroundSecondary }]}>
                <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>{wishlistItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.iconButton, 
              { backgroundColor: theme.colors.card },
              theme.getElevatedStyle('md')
            ]}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <Ionicons name="cart-outline" size={22} color={theme.colors.text} />
            {cartItems.length > 0 && (
              <View style={[styles.badge, { backgroundColor: '#EF4444', borderColor: theme.colors.backgroundSecondary }]}>
                <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>{cartItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Box - Fixed outside FlatList */}
      <View style={[
        styles.searchContainer, 
        { backgroundColor: theme.colors.card },
        theme.getElevatedStyle('md')
      ]}>
        <Ionicons name="search" size={20} color={theme.colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search"
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        numColumns={numColumns}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        maxToRenderPerBatch={20}
        updateCellsBatchingPeriod={50}
        initialNumToRender={20}
        windowSize={21}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadProducts}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🛍️</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No products found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 140,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerContainer: {
    marginBottom: 20,
  },
  
  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  deliverySection: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500',
  },
  deliveryLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '700',
  },
  topBarIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Search Box
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },

  // Categories
  categoriesSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '700',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryCard: {
    width: '25%',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginBottom: 20,
  },
  categoryIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  comingSoonBadge: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
  },
});

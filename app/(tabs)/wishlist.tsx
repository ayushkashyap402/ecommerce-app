import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { fetchWishlist, removeFromWishlist, clearWishlist } from '../../src/store/slices/wishlistSlice';
import { addToCart } from '../../src/store/slices/cartSlice';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { formatCurrency } from '../../src/utils/helpers';
import { useTheme } from '../../src/context/ThemeContext';

export default function WishlistScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { items, isLoading } = useAppSelector(state => state.wishlist);
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const userId = user?.id || user?._id;
    if (userId) {
      dispatch(fetchWishlist(userId));
    }
  }, [user]);

  const onRefresh = async () => {
    const userId = user?.id || user?._id;
    if (!userId) return;
    
    setRefreshing(true);
    try {
      await dispatch(fetchWishlist(userId)).unwrap();
    } catch (error) {
      console.error('Failed to refresh wishlist:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    Alert.alert(
      'Remove from Wishlist',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeFromWishlist({ userId, productId })).unwrap();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove item from wishlist');
            }
          },
        },
      ]
    );
  };

  const handleClearWishlist = () => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to remove all items from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(clearWishlist(userId)).unwrap();
              Alert.alert('Success', 'Wishlist cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear wishlist');
            }
          },
        },
      ]
    );
  };

  const handleAddToCart = async (item: any) => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    try {
      await dispatch(addToCart({
        userId,
        productId: item.productId,
        quantity: 1,
        size: 'M', // Default size
      })).unwrap();

      Alert.alert(
        'Added to Cart',
        `${item.productName} has been added to your cart`,
        [
          { text: 'Continue', style: 'cancel' },
          { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add to cart');
    }
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        {/* Teal Header */}
        <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>My Wishlist</Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.backgroundTertiary }]}>
            <Ionicons name="heart-outline" size={80} color={theme.colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Login Required</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Please login to view your wishlist</Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading wishlist..." />;
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        {/* Teal Header */}
        <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>My Wishlist</Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.backgroundTertiary }]}>
            <Ionicons name="heart-outline" size={80} color={theme.colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Your Wishlist is Empty</Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Save your favorite items here to buy them later
          </Text>
          <TouchableOpacity
            style={[styles.shopButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/(tabs)' as any)}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* Teal Header */}
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Wishlist</Text>
            <TouchableOpacity onPress={handleClearWishlist} style={styles.clearButton}>
              <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Wishlist Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: theme.colors.card }, theme.shadows.md]}>
            <TouchableOpacity
              style={styles.itemContent}
              onPress={() => handleProductPress(item.productId)}
            >
              <Image
                source={{ uri: item.productImage }}
                style={[styles.itemImage, { backgroundColor: theme.colors.backgroundTertiary }]}
                resizeMode="cover"
              />

              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={2}>
                  {item.productName}
                </Text>
                <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>{formatCurrency(item.productPrice)}</Text>
                <Text style={[styles.itemDate, { color: theme.colors.textTertiary }]}>
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.itemActions}>
              <TouchableOpacity
                style={[styles.addToCartButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handleAddToCart(item)}
              >
                <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                <Text style={styles.addToCartButtonText}>Add to Cart</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: theme.isDark ? 'rgba(248, 113, 113, 0.2)' : '#FEE2E2' }]}
                onPress={() => handleRemoveItem(item.productId)}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 20,
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 140,
  },
  itemCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    padding: 16,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  itemDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#16A085',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  removeButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#16A085',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#16A085',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

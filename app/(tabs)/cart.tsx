import React, { useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { fetchCart, updateCartItem, removeFromCart } from '../../src/store/slices/cartSlice';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { formatCurrency } from '../../src/utils/helpers';
import { useTheme } from '../../src/context/ThemeContext';

export default function CartScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { items, total, isLoading } = useAppSelector(state => state.cart);
  const { user } = useAppSelector(state => state.auth);
  const theme = useTheme();

  useEffect(() => {
    if (user?.id || user?._id) {
      loadCart();
    }
  }, [user]);

  const loadCart = async () => {
    const userId = (user as any)?.id || user?._id;
    if (!userId) return;
    
    try {
      await dispatch(fetchCart(userId)).unwrap();
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    const userId = (user as any)?.id || user?._id;
    if (!userId) return;
    
    if (quantity < 1) {
      handleRemove(productId);
      return;
    }

    try {
      await dispatch(updateCartItem({ userId, productId, quantity })).unwrap();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemove = (productId: string) => {
    const userId = (user as any)?.id || user?._id;
    if (!userId) return;
    
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeFromCart({ userId, productId })).unwrap();
            } catch (error) {
              console.error('Failed to remove item:', error);
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    // Get all product IDs from cart
    const productIds = items.map(item => item.product._id).join(',');
    router.push(`/checkout?productIds=${productIds}` as any);
  };

  const handleBuyNow = (productId: string) => {
    // Buy single product
    router.push(`/checkout?productIds=${productId}` as any);
  };

  const renderCartItem = React.useCallback(({ item }: any) => {
    // Get the first image from images array or use image field
    const productImage = item.product?.images?.[0] || item.product?.image || item.product?.thumbnailUrl || 'https://via.placeholder.com/100';
    
    return (
      <View style={[styles.cartItem, { backgroundColor: theme.colors.card }, theme.shadows.md]}>
        {/* Product Image */}
        <Image
          source={{ uri: productImage }}
          style={[styles.productImage, { backgroundColor: theme.colors.backgroundTertiary }]}
          resizeMode="cover"
        />

        {/* Product Details */}
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={2}>
            {item.product?.name || 'Product'}
          </Text>
          
          <Text style={[styles.productCategory, { color: theme.colors.textTertiary }]}>
            {item.product?.category || 'Category'}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
              {formatCurrency(item.product?.price || 0)}
            </Text>
            <Text style={[styles.stockText, { color: theme.colors.primary }]}>
              {item.product?.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>

          {/* Quantity Controls */}
          <View style={styles.quantityRow}>
            <View style={[styles.quantityContainer, { backgroundColor: theme.colors.backgroundTertiary }]}>
              <TouchableOpacity
                onPress={() => handleUpdateQuantity(item.product._id, item.quantity - 1)}
                style={[styles.quantityButton, { backgroundColor: theme.colors.card }]}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              <Text style={[styles.quantityText, { color: theme.colors.text }]}>{item.quantity}</Text>

              <TouchableOpacity
                onPress={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}
                style={[styles.quantityButton, { backgroundColor: theme.colors.card }]}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Remove Button */}
            <TouchableOpacity
              onPress={() => handleRemove(item.product._id)}
              style={[styles.removeButton, { backgroundColor: theme.isDark ? 'rgba(248, 113, 113, 0.2)' : '#FEE2E2' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          </View>

          {/* Buy Now Button */}
          <TouchableOpacity
            style={[styles.buyNowButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleBuyNow(item.product._id)}
            activeOpacity={0.8}
          >
            <Text style={styles.buyNowButtonText}>Buy Now</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [theme]);

  if (isLoading && items.length === 0) {
    return <LoadingSpinner fullScreen text="Loading cart..." />;
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        {/* Teal Header */}
        <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Shopping Cart</Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.backgroundTertiary }]}>
            <Ionicons name="cart-outline" size={80} color={theme.colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>Add some products to get started</Text>
          <TouchableOpacity
            style={[styles.shopNowButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/(tabs)' as any)}
          >
            <Text style={styles.shopNowButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Calculate subtotal from cart items
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = subtotal >= 1000 ? 0 : 50;
  const finalTotal = subtotal + deliveryFee;
  
  // Calculate bottom padding to avoid tab bar (tab bar is ~80px)
  const bottomSectionPadding = insets.bottom + 80;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* Teal Header */}
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Shopping Cart</Text>
            {items.length > 0 && (
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountText}>{items.length}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>

      {/* Cart Items List with Summary at Bottom */}
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.product._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.listContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 180,
          offset: 180 * index,
          index,
        })}
        ListFooterComponent={
          <View style={[styles.summarySection, { backgroundColor: theme.colors.card }, theme.shadows.md]}>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(subtotal)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Delivery Fee</Text>
                {deliveryFee === 0 ? (
                  <Text style={[styles.freeDeliveryText, { color: theme.colors.primary }]}>FREE</Text>
                ) : (
                  <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{formatCurrency(deliveryFee)}</Text>
                )}
              </View>

              {subtotal < 1000 && (
                <Text style={styles.deliveryHintText}>
                  Add {formatCurrency(1000 - subtotal)} more for FREE delivery!
                </Text>
              )}

              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: theme.colors.primary }]}>{formatCurrency(finalTotal)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.checkoutButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleCheckout}
              activeOpacity={0.8}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
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
  itemCountBadge: {
    backgroundColor: '#F59E0B',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  summarySection: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 100,
  },
  cartItem: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#16A085',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buyNowButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopNowButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#16A085',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shopNowButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  freeDeliveryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  deliveryHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 4,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#16A085',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

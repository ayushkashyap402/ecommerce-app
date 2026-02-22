import React, { useEffect, useRef } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity, Image, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { fetchOrders } from '../../src/store/slices/ordersSlice';
import { Card } from '../../src/components/ui/Card';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { formatCurrency, formatDate, getOrderStatusColor, getOrderStatusLabel } from '../../src/utils/helpers';
import { useTheme } from '../../src/context/ThemeContext';

export default function OrdersScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items: orders, isLoading } = useAppSelector(state => state.orders);
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const appState = useRef(AppState.currentState);
  const theme = useTheme();

  useEffect(() => {
    // Only load orders if user is authenticated
    if (isAuthenticated && user) {
      loadOrders();

      // Auto-refresh when app comes to foreground
      const subscription = AppState.addEventListener('change', nextAppState => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          loadOrders();
        }
        appState.current = nextAppState;
      });

      return () => {
        subscription.remove();
      };
    }
  }, [isAuthenticated, user]);

  const loadOrders = async () => {
    if (!isAuthenticated || !user) {
      console.log('⚠️ Cannot load orders: User not authenticated');
      return;
    }
    
    try {
      await dispatch(fetchOrders()).unwrap();
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const renderOrder = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => router.push(`/order/${item.orderId}` as any)}
      activeOpacity={0.7}
    >
      <Card style={[styles.orderCard, { backgroundColor: theme.colors.card }, theme.shadows.md]}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderId, { color: theme.colors.textSecondary }]}>
              Order #{item.orderId || item._id.slice(-8).toUpperCase()}
            </Text>
            <Text style={[styles.orderDate, { color: theme.colors.textTertiary }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getOrderStatusColor(item.status) + '20' }
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getOrderStatusColor(item.status) }
              ]}
            >
              {getOrderStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        {/* Product Images Preview */}
        <View style={styles.productPreview}>
          {item.items.slice(0, 3).map((orderItem: any, index: number) => (
            <Image
              key={index}
              source={{ uri: orderItem.image || 'https://via.placeholder.com/60' }}
              style={[
                styles.productImage,
                { backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.card },
                index > 0 && { marginLeft: -12 }
              ]}
            />
          ))}
          {item.items.length > 3 && (
            <View style={[styles.productImage, styles.moreProductsOverlay, { marginLeft: -12, backgroundColor: theme.isDark ? 'rgba(72, 201, 176, 0.9)' : 'rgba(22, 160, 133, 0.9)' }]}>
              <Text style={styles.moreProductsText}>+{item.items.length - 3}</Text>
            </View>
          )}
        </View>

        <View style={styles.orderItems}>
          <Text style={[styles.itemsCount, { color: theme.colors.textSecondary }]}>
            {item.items.length} item{item.items.length > 1 ? 's' : ''}
          </Text>
          {item.items.slice(0, 2).map((orderItem: any, index: number) => (
            <Text key={index} style={[styles.itemText, { color: theme.colors.text }]} numberOfLines={1}>
              • {orderItem.name} x {orderItem.quantity}
            </Text>
          ))}
          {item.items.length > 2 && (
            <Text style={[styles.moreItems, { color: theme.colors.textTertiary }]}>
              +{item.items.length - 2} more
            </Text>
          )}
        </View>

        <View style={[styles.orderFooter, { borderTopColor: theme.colors.borderLight }]}>
          <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>Total</Text>
          <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
            {formatCurrency(item.pricing?.total || item.total || 0)}
          </Text>
        </View>

        <View style={styles.viewDetailsContainer}>
          <Text style={[styles.viewDetailsText, { color: theme.colors.primary }]}>View Details</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>My Orders</Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔒</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Please log in</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            You need to be logged in to view your orders
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/(auth)/login' as any)}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading && orders.length === 0) {
    return <LoadingSpinner fullScreen text="Loading orders..." />;
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
        {/* Teal Header */}
        <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>My Orders</Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No orders yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Your order history will appear here
          </Text>
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
            <Text style={styles.headerTitle}>My Orders</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                onPress={() => router.push('/returns' as any)}
                style={styles.returnsButton}
              >
                <Ionicons name="return-up-back" size={16} color="#FFFFFF" />
                <Text style={styles.returnsButtonText}>Returns</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={loadOrders} 
                style={styles.refreshButton}
                disabled={isLoading}
              >
                <Ionicons 
                  name="refresh" 
                  size={22} 
                  color="#FFFFFF" 
                  style={isLoading ? styles.spinning : undefined}
                />
              </TouchableOpacity>
              <View style={styles.orderCountBadge}>
                <Text style={styles.orderCountText}>{orders.length}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadOrders}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  returnsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  returnsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinning: {
    opacity: 0.5,
  },
  orderCountBadge: {
    backgroundColor: '#F59E0B',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
    paddingBottom: 140,
  },
  orderCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  productPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 3,
  },
  moreProductsOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreProductsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orderItems: {
    marginBottom: 12,
  },
  itemsCount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 96,
    marginBottom: 20,
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
  },
  loginButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

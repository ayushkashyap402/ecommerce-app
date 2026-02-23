import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../src/utils/helpers';
import { getOrderById } from '../src/services/orderService';
import { useTheme } from '../src/context/ThemeContext';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch order details from backend
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!params.orderId) {
          Alert.alert('Error', 'Order ID not found');
          router.replace('/(tabs)/orders');
          return;
        }

        const order = await getOrderById(params.orderId as string);
        
        // Transform order data for display
        const transformedData = {
          orderId: order._id,
          orderNumber: order.orderNumber || order._id.slice(-8).toUpperCase(),
          orderDate: new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          estimatedDelivery: order.estimatedDelivery 
            ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
          status: order.status,
          items: order.items.map((item: any) => ({
            id: item._id || item.productId,
            name: item.name || item.productName || 'Product',
            image: item.image || item.images?.[0] || 'https://via.placeholder.com/80',
            size: item.size || item.variant?.size,
            color: item.color || item.variant?.color,
            quantity: item.quantity,
            price: item.price,
          })),
          address: {
            name: order.shippingAddress?.fullName || order.shippingAddress?.name || 'N/A',
            phone: order.shippingAddress?.phone || 'N/A',
            addressLine: order.shippingAddress?.addressLine || order.shippingAddress?.street || 'N/A',
            city: order.shippingAddress?.city || 'N/A',
            state: order.shippingAddress?.state || 'N/A',
            pincode: order.shippingAddress?.pincode || order.shippingAddress?.zipCode || 'N/A',
          },
          payment: {
            method: order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                    order.paymentMethod === 'card' ? 'Credit/Debit Card' :
                    order.paymentMethod === 'upi' ? 'UPI' : 
                    order.paymentMethod || 'N/A',
            status: order.paymentStatus || 'Pending',
            transactionId: params.transactionId || order.transactionId,
          },
          pricing: {
            subtotal: order.subtotal || order.totalAmount,
            discount: order.discount || 0,
            deliveryCharge: order.shippingCharge || order.deliveryCharge || 0,
            tax: order.tax || 0,
            total: order.totalAmount,
          },
        };

        setOrderData(transformedData);
      } catch (error: any) {
        console.error('Failed to fetch order:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to load order details',
          [
            {
              text: 'Go to Orders',
              onPress: () => router.replace('/(tabs)/orders'),
            },
          ]
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [params.orderId]);

  useEffect(() => {
    // Success animation - only run when data is loaded
    if (orderData) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [orderData]);

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading order details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if no order data
  if (!orderData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Failed to load order details
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.replace('/(tabs)/orders')}
          >
            <Text style={styles.primaryButtonText}>Go to Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Success Animation */}
        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successCircle,
              {
                backgroundColor: theme.colors.primary,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Ionicons name="checkmark" size={60} color="#FFFFFF" />
          </Animated.View>
          
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={[styles.successTitle, { color: theme.colors.text }]}>
              Order Placed Successfully!
            </Text>
            <Text style={[styles.successSubtitle, { color: theme.colors.textSecondary }]}>
              Thank you for your order
            </Text>
          </Animated.View>
        </View>

        {/* Order Details Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Order Details</Text>
            <View style={[styles.orderIdBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.orderIdText, { color: theme.colors.primary }]}>
                #{orderData.orderNumber}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                  Order Date
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {orderData.orderDate}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                  Estimated Delivery
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {orderData.estimatedDelivery}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Order Items</Text>
          {orderData.items.map((item: any, index: number) => (
            <View 
              key={item.id || index} 
              style={[
                styles.orderItem,
                { borderBottomColor: theme.colors.border }
              ]}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                {(item.size || item.color) && (
                  <Text style={[styles.itemSize, { color: theme.colors.textSecondary }]}>
                    {item.size && `Size: ${item.size}`}
                    {item.size && item.color && ' • '}
                    {item.color && `Color: ${item.color}`}
                  </Text>
                )}
                <Text style={[styles.itemPrice, { color: theme.colors.text }]}>
                  {formatCurrency(item.price)} × {item.quantity}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: theme.colors.primary }]}>
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Delivery Address</Text>
            <Ionicons name="location" size={20} color={theme.colors.primary} />
          </View>
          <View style={[styles.addressContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.addressName, { color: theme.colors.text }]}>
              {orderData.address.name}
            </Text>
            <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>
              {orderData.address.addressLine}
            </Text>
            <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>
              {orderData.address.city}, {orderData.address.state} - {orderData.address.pincode}
            </Text>
            <Text style={[styles.addressPhone, { color: theme.colors.text }]}>
              Phone: {orderData.address.phone}
            </Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Payment Details</Text>
          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <Ionicons name="cash-outline" size={24} color={theme.colors.primary} />
              <View>
                <Text style={[styles.paymentMethod, { color: theme.colors.text }]}>
                  {orderData.payment.method}
                </Text>
                <Text style={[styles.paymentStatus, { 
                  color: orderData.payment.status === 'Paid' ? theme.colors.success : '#F59E0B' 
                }]}>
                  Status: {orderData.payment.status}
                </Text>
                {orderData.payment.transactionId && (
                  <Text style={[styles.transactionId, { color: theme.colors.textSecondary }]}>
                    Transaction ID: {orderData.payment.transactionId}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Price Summary */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Price Summary</Text>
          
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.priceValue, { color: theme.colors.text }]}>
              {formatCurrency(orderData.pricing.subtotal)}
            </Text>
          </View>

          {orderData.pricing.discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Discount</Text>
              <Text style={[styles.priceDiscount, { color: theme.colors.success }]}>
                -{formatCurrency(orderData.pricing.discount)}
              </Text>
            </View>
          )}

          {orderData.pricing.tax > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Tax</Text>
              <Text style={[styles.priceValue, { color: theme.colors.text }]}>
                {formatCurrency(orderData.pricing.tax)}
              </Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
              Delivery Charges
            </Text>
            <Text style={[
              styles.priceValue, 
              { color: orderData.pricing.deliveryCharge === 0 ? theme.colors.success : theme.colors.text }
            ]}>
              {orderData.pricing.deliveryCharge === 0
                ? 'FREE'
                : formatCurrency(orderData.pricing.deliveryCharge)}
            </Text>
          </View>

          <View style={[styles.priceDivider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.priceRow}>
            <Text style={[styles.priceTotalLabel, { color: theme.colors.text }]}>Total Amount</Text>
            <Text style={[styles.priceTotalValue, { color: theme.colors.primary }]}>
              {formatCurrency(orderData.pricing.total)}
            </Text>
          </View>
        </View>

        {/* Order Status Timeline */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Order Status</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[
                styles.timelineDot, 
                { backgroundColor: theme.colors.primary }
              ]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: theme.colors.text }]}>
                  Order Placed
                </Text>
                <Text style={[styles.timelineTime, { color: theme.colors.textSecondary }]}>
                  Just now
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[
                styles.timelineDot,
                { backgroundColor: orderData.status !== 'pending' ? theme.colors.primary : theme.colors.border }
              ]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: theme.colors.text }]}>
                  Order Confirmed
                </Text>
                <Text style={[styles.timelineTime, { color: theme.colors.textSecondary }]}>
                  {orderData.status !== 'pending' ? 'Confirmed' : 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[
                styles.timelineDot,
                { backgroundColor: orderData.status === 'shipped' || orderData.status === 'delivered' 
                  ? theme.colors.primary : theme.colors.border }
              ]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: theme.colors.text }]}>Shipped</Text>
                <Text style={[styles.timelineTime, { color: theme.colors.textSecondary }]}>
                  {orderData.status === 'shipped' || orderData.status === 'delivered' ? 'Shipped' : 'Pending'}
                </Text>
              </View>
            </View>

            <View style={[styles.timelineItem, styles.timelineItemLast]}>
              <View style={[
                styles.timelineDot,
                { backgroundColor: orderData.status === 'delivered' ? theme.colors.primary : theme.colors.border }
              ]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: theme.colors.text }]}>Delivered</Text>
                <Text style={[styles.timelineTime, { color: theme.colors.textSecondary }]}>
                  {orderData.status === 'delivered' 
                    ? 'Delivered' 
                    : `Expected by ${orderData.estimatedDelivery}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.replace('/(tabs)/orders')}
          >
            <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>View All Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.primary }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
              Continue Shopping
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  orderIdBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 13,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  addressContainer: {
    borderRadius: 12,
    padding: 16,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  addressText: {
    fontSize: 14,
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  transactionId: {
    fontSize: 12,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  priceDiscount: {
    fontSize: 15,
    fontWeight: '600',
  },
  priceDivider: {
    height: 1,
    marginVertical: 12,
  },
  priceTotalLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
  priceTotalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: 24,
    position: 'relative',
  },
  timelineItemLast: {
    paddingBottom: 0,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 16,
    marginTop: 4,
    position: 'relative',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 13,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpace: {
    height: 40,
  },
});

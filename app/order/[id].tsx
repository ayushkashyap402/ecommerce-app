import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { formatCurrency, formatDate, getOrderStatusColor, getOrderStatusLabel } from '../../src/utils/helpers';
import { API_CONFIG } from '../../src/constants/config';
import { authStorage } from '../../src/utils/storage';
import { useTheme } from '../../src/context/ThemeContext';
import { orderService } from '../../src/services/orderService';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.id as string;
  const theme = useTheme();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const cancelReasons = [
    'Changed my mind',
    'Found a better price elsewhere',
    'Ordered by mistake',
    'Delivery time too long',
    'Want to change delivery address',
    'Want to change payment method',
    'Other reasons',
  ];

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true);
      const token = await authStorage.getToken();
      const user = await authStorage.getUser();
      const userId = user?.id || user?._id;

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/orders/${orderId}?userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load order details');
      }

      const data = await response.json();
      setOrder(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load order details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: 'checkmark-circle' },
      { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-done-circle' },
      { key: 'processing', label: 'Processing', icon: 'cube' },
      { key: 'shipped', label: 'Shipped', icon: 'airplane' },
      { key: 'delivered', label: 'Delivered', icon: 'home' },
    ];

    const currentIndex = steps.findIndex(s => s.key === order?.status);
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const handleCancelOrder = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a cancellation reason');
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              await orderService.cancelOrder(orderId, selectedReason);
              setShowCancelModal(false);
              Alert.alert('Success', 'Order cancelled successfully', [
                { text: 'OK', onPress: () => loadOrderDetails() }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel order');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading order details..." />;
  }

  if (!order) {
    return null;
  }

  const statusSteps = getStatusSteps();
  const statusColor = getOrderStatusColor(order.status);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order ID & Status */}
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={[styles.orderIdLabel, { color: theme.colors.textSecondary }]}>Order ID</Text>
            <Text style={[styles.orderIdValue, { color: theme.colors.text }]}>{order.orderId}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getOrderStatusLabel(order.status)}
            </Text>
          </View>
        </View>

        <Text style={[styles.orderDate, { color: theme.colors.textSecondary }]}>
          Placed on {formatDate(order.createdAt)}
        </Text>

        {/* Cancelled Order Info */}
        {order.status === 'cancelled' && (
          <View style={[
            styles.cancelledCard,
            { 
              backgroundColor: '#FEE2E2',
              borderWidth: 1,
              borderColor: '#FCA5A5',
            }
          ]}>
            <View style={styles.cancelledHeader}>
              <Ionicons name="close-circle" size={24} color="#DC2626" />
              <Text style={styles.cancelledTitle}>Order Cancelled</Text>
            </View>
            {order.cancellation?.reason && (
              <Text style={styles.cancelledReason}>
                Reason: {order.cancellation.reason}
              </Text>
            )}
            {order.cancellation?.cancelledAt && (
              <Text style={styles.cancelledDate}>
                Cancelled on {formatDate(order.cancellation.cancelledAt)}
              </Text>
            )}
            {order.payment.status === 'refund_pending' && (
              <View style={styles.refundInfo}>
                <Ionicons name="information-circle" size={16} color="#92400E" />
                <Text style={styles.refundText}>
                  Refund will be processed within 5-7 business days
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Order Status Timeline */}
        {order.status !== 'cancelled' && (
          <View style={[
            styles.timelineCard, 
            { 
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border
            }
          ]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Order Status</Text>
            <View style={styles.timeline}>
              {statusSteps.map((step, index) => (
                <View key={step.key} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineIcon,
                        { backgroundColor: theme.colors.backgroundSecondary },
                        step.completed && { backgroundColor: theme.colors.primary },
                        step.active && { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Ionicons
                        name={step.icon as any}
                        size={20}
                        color={step.completed ? '#FFFFFF' : theme.colors.textTertiary}
                      />
                    </View>
                    {index < statusSteps.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: theme.colors.border },
                          step.completed && { backgroundColor: theme.colors.primary },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        { color: theme.colors.textTertiary },
                        step.completed && { color: theme.colors.text },
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            {order.estimatedDelivery && order.status !== 'delivered' && (
              <View style={styles.estimatedDelivery}>
                <Ionicons name="time-outline" size={18} color="#92400E" />
                <Text style={styles.estimatedDeliveryText}>
                  Estimated delivery: {formatDate(order.estimatedDelivery)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Items */}
        <View style={[
          styles.card, 
          { 
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border
          }
        ]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Items ({order.items.length})</Text>
          {order.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/80' }}
                style={[styles.itemImage, { backgroundColor: theme.colors.backgroundSecondary }]}
              />
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.size && (
                  <Text style={[styles.itemSize, { color: theme.colors.textSecondary }]}>Size: {item.size}</Text>
                )}
                <Text style={[styles.itemPrice, { color: theme.colors.textSecondary }]}>
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
        <View style={[
          styles.card, 
          { 
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border
          }
        ]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Delivery Address</Text>
          <View style={styles.addressContainer}>
            <View style={styles.addressHeader}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
              <Text style={[styles.addressName, { color: theme.colors.text }]}>{order.deliveryAddress.name}</Text>
            </View>
            <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>
              {order.deliveryAddress.addressLine1}
              {order.deliveryAddress.addressLine2 ? `, ${order.deliveryAddress.addressLine2}` : ''}
            </Text>
            {order.deliveryAddress.landmark && (
              <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>
                Landmark: {order.deliveryAddress.landmark}
              </Text>
            )}
            <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>
              {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
            </Text>
            <Text style={[styles.addressPhone, { color: theme.colors.textSecondary }]}>
              Phone: {order.deliveryAddress.phone}
            </Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={[
          styles.card, 
          { 
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border
          }
        ]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Payment Details</Text>
          <View style={styles.paymentRow}>
            <Text style={[styles.paymentLabel, { color: theme.colors.textSecondary }]}>Payment Method</Text>
            <View style={styles.paymentMethod}>
              <Ionicons
                name={
                  order.payment.method === 'cod'
                    ? 'cash-outline'
                    : order.payment.method === 'card'
                    ? 'card-outline'
                    : 'wallet-outline'
                }
                size={18}
                color={theme.colors.primary}
              />
              <Text style={[styles.paymentMethodText, { color: theme.colors.text }]}>
                {order.payment.method === 'cod'
                  ? 'Cash on Delivery'
                  : order.payment.method === 'card'
                  ? 'Card'
                  : 'UPI'}
              </Text>
            </View>
          </View>
          <View style={styles.paymentRow}>
            <Text style={[styles.paymentLabel, { color: theme.colors.textSecondary }]}>Payment Status</Text>
            <Text
              style={[
                styles.paymentStatus,
                {
                  color:
                    order.payment.status === 'completed'
                      ? '#10B981'
                      : order.payment.status === 'pending'
                      ? '#F59E0B'
                      : '#EF4444',
                },
              ]}
            >
              {order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1)}
            </Text>
          </View>
          {order.payment.transactionId && (
            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: theme.colors.textSecondary }]}>Transaction ID</Text>
              <Text style={[styles.paymentValue, { color: theme.colors.textSecondary }]}>{order.payment.transactionId}</Text>
            </View>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={[
          styles.card, 
          { 
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border
          }
        ]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Price Details</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
              Subtotal ({order.items.length}) items)
            </Text>
            <Text style={[styles.priceValue, { color: theme.colors.text }]}>
              {formatCurrency(order.pricing?.subtotal || 0)}
            </Text>
          </View>
          {order.pricing?.discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Discount</Text>
              <Text style={styles.priceDiscount}>
                -{formatCurrency(order.pricing.discount)}
              </Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Delivery Charges</Text>
            <Text
              style={[
                styles.priceValue,
                { color: theme.colors.text },
                order.pricing?.deliveryCharge === 0 && styles.priceFree,
              ]}
            >
              {order.pricing?.deliveryCharge === 0
                ? 'FREE'
                : formatCurrency(order.pricing?.deliveryCharge || 0)}
            </Text>
          </View>
          <View style={[styles.priceDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.priceRow}>
            <Text style={[styles.priceTotalLabel, { color: theme.colors.text }]}>Total Amount</Text>
            <Text style={[styles.priceTotalValue, { color: theme.colors.primary }]}>
              {formatCurrency(order.pricing?.total || order.total || 0)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {order.status !== 'cancelled' && (
          <View style={styles.actionButtons}>
            {/* Cancel Button - Show for all non-cancelled orders */}
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: '#FEE2E2', borderColor: '#DC2626' }]}
              onPress={() => setShowCancelModal(true)}
            >
              <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
              <Text style={[styles.cancelButtonText, { color: '#DC2626' }]}>Cancel Order</Text>
            </TouchableOpacity>

            {/* Return/Refund Button - Show for delivered/shipped orders */}
            {(order.status === 'delivered' || order.status === 'shipped') && (
              <TouchableOpacity
                style={[styles.returnButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}
                onPress={() => router.push(`/order/return-refund?orderId=${orderId}` as any)}
              >
                <Ionicons name="return-up-back" size={20} color={theme.colors.primary} />
                <Text style={[styles.returnButtonText, { color: theme.colors.primary }]}>Request Return & Refund</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Cancel Order Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Cancel Order</Text>
              <TouchableOpacity onPress={() => setShowCancelModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Please select a reason for cancellation:
            </Text>

            <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
              {cancelReasons.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonItem,
                    { 
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderColor: selectedReason === reason ? theme.colors.primary : theme.colors.border,
                    }
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <View style={[
                    styles.radioButton,
                    { borderColor: theme.colors.border },
                    selectedReason === reason && { 
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    }
                  ]}>
                    {selectedReason === reason && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={[styles.reasonText, { color: theme.colors.text }]}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.colors.border }]}
                onPress={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                <Text style={[styles.modalButtonTextSecondary, { color: theme.colors.text }]}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: '#DC2626' }]}
                onPress={handleCancelOrder}
                disabled={isCancelling || !selectedReason}
              >
                {isCancelling ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Cancel Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#16A085',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  orderIdValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
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
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  timeline: {
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconCompleted: {
    backgroundColor: '#16A085',
  },
  timelineIconActive: {
    backgroundColor: '#16A085',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: '#16A085',
  },
  timelineRight: {
    flex: 1,
    justifyContent: 'center',
  },
  timelineLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  timelineLabelCompleted: {
    color: '#111827',
  },
  estimatedDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  estimatedDeliveryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A085',
  },
  addressContainer: {
    gap: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  addressPhone: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentMethodText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  paymentStatus: {
    fontSize: 15,
    fontWeight: '700',
  },
  paymentValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  priceDiscount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
  priceFree: {
    color: '#10B981',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  priceTotalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  priceTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16A085',
  },
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#DC2626',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  returnButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#16A085',
    gap: 8,
  },
  returnButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A085',
  },
  cancelledCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelledHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cancelledTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
  },
  cancelledReason: {
    fontSize: 15,
    color: '#991B1B',
    marginBottom: 8,
    fontWeight: '600',
  },
  cancelledDate: {
    fontSize: 14,
    color: '#991B1B',
    marginBottom: 12,
  },
  refundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  refundText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
  },
  reasonsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  modalButtonPrimary: {
    backgroundColor: '#DC2626',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../src/utils/helpers';
import { API_CONFIG } from '../../src/constants/config';
import { authStorage } from '../../src/utils/storage';

const RETURN_REASONS = [
  { id: 'defective', label: 'Defective or damaged product', icon: 'warning' },
  { id: 'wrong_item', label: 'Wrong item received', icon: 'swap-horizontal' },
  { id: 'not_as_described', label: 'Not as described', icon: 'information-circle' },
  { id: 'size_issue', label: 'Size doesn\'t fit', icon: 'resize' },
  { id: 'quality', label: 'Poor quality', icon: 'thumbs-down' },
  { id: 'changed_mind', label: 'Changed my mind', icon: 'close-circle' },
  { id: 'other', label: 'Other reason', icon: 'ellipsis-horizontal' },
];

export default function ReturnRefundScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [refundMethod, setRefundMethod] = useState<'original' | 'wallet'>('original');

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
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
      
      // Check if order is eligible for return
      if (data.status === 'cancelled') {
        Alert.alert('Not Eligible', 'Cancelled orders cannot be returned.');
        router.back();
        return;
      }

      if (data.status === 'pending' || data.status === 'confirmed') {
        Alert.alert('Not Eligible', 'Order must be delivered before requesting a return.');
        router.back();
        return;
      }

      setOrder(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load order details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReturn = async () => {
    if (!selectedReason) {
      Alert.alert('Required', 'Please select a reason for return');
      return;
    }

    if (selectedReason === 'other' && !additionalComments.trim()) {
      Alert.alert('Required', 'Please provide details for your return request');
      return;
    }

    Alert.alert(
      'Confirm Return Request',
      'Are you sure you want to request a return for this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: submitReturnRequest,
        },
      ]
    );
  };

  const submitReturnRequest = async () => {
    try {
      setIsSubmitting(true);
      const token = await authStorage.getToken();

      const reasonLabel = RETURN_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;
      const fullReason = additionalComments.trim()
        ? `${reasonLabel} - ${additionalComments}`
        : reasonLabel;

      // Submit return request (cancel order with refund)
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'cancelled',
            cancellationReason: `Return requested: ${fullReason}`,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit return request');
      }

      // If payment was completed, initiate refund
      if (order.payment.status === 'completed') {
        try {
          await fetch(
            `${API_CONFIG.BASE_URL}/payments/refund/${order.payment.transactionId}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                refundAmount: order.pricing?.total || order.total,
                reason: fullReason,
              }),
            }
          );
        } catch (refundError) {
          console.error('Refund initiation error:', refundError);
          // Continue even if refund fails - admin can process manually
        }
      }

      Alert.alert(
        'Return Request Submitted',
        'Your return request has been submitted successfully. Our team will review it and process your refund within 5-7 business days.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/orders'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit return request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading order details..." />;
  }

  if (!order) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Return & Refund</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.orderInfo}>
            <Text style={styles.orderLabel}>Order ID</Text>
            <Text style={styles.orderValue}>{order.orderId}</Text>
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.orderLabel}>Order Date</Text>
            <Text style={styles.orderValue}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.orderInfo}>
            <Text style={styles.orderLabel}>Total Amount</Text>
            <Text style={styles.orderValueHighlight}>
              {formatCurrency(order.pricing?.total || order.total)}
            </Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items to Return</Text>
          {order.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/60' }}
                style={styles.itemImage}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.size && (
                  <Text style={styles.itemSize}>Size: {item.size}</Text>
                )}
                <Text style={styles.itemPrice}>
                  {formatCurrency(item.price)} × {item.quantity}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Return Reason */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reason for Return</Text>
          <Text style={styles.helperText}>Please select the reason for your return</Text>
          
          {RETURN_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={[
                styles.reasonOption,
                selectedReason === reason.id && styles.reasonOptionSelected,
              ]}
              onPress={() => setSelectedReason(reason.id)}
            >
              <View style={styles.reasonLeft}>
                <View
                  style={[
                    styles.radioButton,
                    selectedReason === reason.id && styles.radioButtonSelected,
                  ]}
                >
                  {selectedReason === reason.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Ionicons
                  name={reason.icon as any}
                  size={20}
                  color={selectedReason === reason.id ? '#16A085' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.reasonLabel,
                    selectedReason === reason.id && styles.reasonLabelSelected,
                  ]}
                >
                  {reason.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Comments */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          <Text style={styles.helperText}>
            {selectedReason === 'other' ? 'Required' : 'Optional'} - Provide more details about your return
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the issue or reason for return..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={additionalComments}
            onChangeText={setAdditionalComments}
            textAlignVertical="top"
          />
        </View>

        {/* Refund Method */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Refund Method</Text>
          <Text style={styles.helperText}>Choose how you want to receive your refund</Text>
          
          <TouchableOpacity
            style={[
              styles.refundOption,
              refundMethod === 'original' && styles.refundOptionSelected,
            ]}
            onPress={() => setRefundMethod('original')}
          >
            <View style={styles.refundLeft}>
              <View
                style={[
                  styles.radioButton,
                  refundMethod === 'original' && styles.radioButtonSelected,
                ]}
              >
                {refundMethod === 'original' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <View>
                <Text
                  style={[
                    styles.refundLabel,
                    refundMethod === 'original' && styles.refundLabelSelected,
                  ]}
                >
                  Original Payment Method
                </Text>
                <Text style={styles.refundSubtext}>
                  Refund to {order.payment.method === 'cod' ? 'bank account' : order.payment.method}
                </Text>
              </View>
            </View>
            <Ionicons
              name="card-outline"
              size={24}
              color={refundMethod === 'original' ? '#16A085' : '#9CA3AF'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.refundOption,
              refundMethod === 'wallet' && styles.refundOptionSelected,
            ]}
            onPress={() => setRefundMethod('wallet')}
          >
            <View style={styles.refundLeft}>
              <View
                style={[
                  styles.radioButton,
                  refundMethod === 'wallet' && styles.radioButtonSelected,
                ]}
              >
                {refundMethod === 'wallet' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <View>
                <Text
                  style={[
                    styles.refundLabel,
                    refundMethod === 'wallet' && styles.refundLabelSelected,
                  ]}
                >
                  Store Wallet
                </Text>
                <Text style={styles.refundSubtext}>
                  Instant refund to your wallet
                </Text>
              </View>
            </View>
            <Ionicons
              name="wallet-outline"
              size={24}
              color={refundMethod === 'wallet' ? '#16A085' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>

        {/* Refund Policy */}
        <View style={styles.policyCard}>
          <View style={styles.policyHeader}>
            <Ionicons name="information-circle" size={20} color="#16A085" />
            <Text style={styles.policyTitle}>Refund Policy</Text>
          </View>
          <Text style={styles.policyText}>
            • Returns are accepted within 7 days of delivery{'\n'}
            • Items must be unused and in original packaging{'\n'}
            • Refund will be processed within 5-7 business days{'\n'}
            • Pickup will be scheduled after approval{'\n'}
            • Refund amount will be credited after quality check
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, (!selectedReason || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmitReturn}
          disabled={!selectedReason || isSubmitting}
        >
          {isSubmitting ? (
            <LoadingSpinner size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="return-up-back" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit Return Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  orderValueHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A085',
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  reasonOptionSelected: {
    borderColor: '#16A085',
    backgroundColor: '#F0FDF4',
  },
  reasonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#16A085',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A085',
  },
  reasonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  reasonLabelSelected: {
    color: '#111827',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  refundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  refundOptionSelected: {
    borderColor: '#16A085',
    backgroundColor: '#F0FDF4',
  },
  refundLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  refundLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  refundLabelSelected: {
    color: '#111827',
  },
  refundSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  policyCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A085',
  },
  policyText: {
    fontSize: 13,
    color: '#065F46',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButton: {
    backgroundColor: '#16A085',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

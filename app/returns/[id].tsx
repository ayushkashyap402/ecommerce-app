import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../src/utils/helpers';
import { API_CONFIG } from '../../src/constants/config';
import { authStorage } from '../../src/utils/storage';

const RETURN_STATUS_CONFIG = {
  requested: { label: 'Requested', color: '#F59E0B', icon: 'time', description: 'Your return request has been submitted and is awaiting review.' },
  approved: { label: 'Approved', color: '#10B981', icon: 'checkmark-circle', description: 'Your return has been approved. Pickup will be scheduled soon.' },
  rejected: { label: 'Rejected', color: '#EF4444', icon: 'close-circle', description: 'Your return request has been rejected.' },
  pickup_scheduled: { label: 'Pickup Scheduled', color: '#3B82F6', icon: 'calendar', description: 'Pickup has been scheduled. Please keep the item ready.' },
  picked_up: { label: 'Picked Up', color: '#8B5CF6', icon: 'cube', description: 'Item has been picked up and is on its way to our warehouse.' },
  received: { label: 'Received', color: '#6366F1', icon: 'archive', description: 'Item has been received at our warehouse.' },
  inspected: { label: 'Inspected', color: '#14B8A6', icon: 'search', description: 'Item has been inspected. Refund will be initiated soon.' },
  refund_initiated: { label: 'Refund Initiated', color: '#06B6D4', icon: 'cash', description: 'Refund has been initiated and is being processed.' },
  refund_completed: { label: 'Refund Completed', color: '#10B981', icon: 'checkmark-done', description: 'Refund has been completed successfully.' },
  cancelled: { label: 'Cancelled', color: '#6B7280', icon: 'ban', description: 'Return request has been cancelled.' },
};

const TIMELINE_STEPS = [
  { key: 'requested', label: 'Requested' },
  { key: 'approved', label: 'Approved' },
  { key: 'pickup_scheduled', label: 'Pickup Scheduled' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'received', label: 'Received' },
  { key: 'inspected', label: 'Inspected' },
  { key: 'refund_initiated', label: 'Refund Initiated' },
  { key: 'refund_completed', label: 'Completed' },
];

export default function ReturnDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnId = params.id as string;

  const [returnData, setReturnData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    loadReturnDetails();
  }, [returnId]);

  const loadReturnDetails = async () => {
    try {
      setIsLoading(true);
      const token = await authStorage.getToken();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/returns/${returnId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load return details');
      }

      const data = await response.json();
      setReturnData(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load return details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelReturn = () => {
    Alert.alert(
      'Cancel Return Request',
      'Are you sure you want to cancel this return request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: cancelReturn,
        },
      ]
    );
  };

  const cancelReturn = async () => {
    try {
      setIsCancelling(true);
      const token = await authStorage.getToken();

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/returns/${returnId}/cancel`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: 'Cancelled by user',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel return');
      }

      Alert.alert(
        'Return Cancelled',
        'Your return request has been cancelled successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to cancel return');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return RETURN_STATUS_CONFIG[status as keyof typeof RETURN_STATUS_CONFIG] || {
      label: status,
      color: '#6B7280',
      icon: 'help-circle',
      description: 'Status information not available',
    };
  };

  const getTimelineProgress = () => {
    if (!returnData) return [];

    const currentIndex = TIMELINE_STEPS.findIndex(s => s.key === returnData.status);
    
    return TIMELINE_STEPS.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading return details..." />;
  }

  if (!returnData) {
    return null;
  }

  const statusConfig = getStatusConfig(returnData.status);
  const timelineSteps = getTimelineProgress();
  const canCancel = ['requested', 'approved'].includes(returnData.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Return Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Return ID & Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.returnIdContainer}>
              <Text style={styles.returnIdLabel}>Return ID</Text>
              <Text style={styles.returnIdValue}>{returnData.returnId}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.color + '20' },
              ]}
            >
              <Ionicons
                name={statusConfig.icon as any}
                size={18}
                color={statusConfig.color}
              />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <Text style={styles.statusDescription}>{statusConfig.description}</Text>

          <Text style={styles.returnDate}>
            Requested on {formatDate(returnData.createdAt)}
          </Text>
        </View>

        {/* Timeline - Only show if not rejected or cancelled */}
        {!['rejected', 'cancelled'].includes(returnData.status) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Return Progress</Text>
            <View style={styles.timeline}>
              {timelineSteps.map((step, index) => (
                <View key={step.key} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineIcon,
                        step.completed && styles.timelineIconCompleted,
                        step.active && styles.timelineIconActive,
                      ]}
                    >
                      {step.completed ? (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      ) : (
                        <View style={styles.timelineIconDot} />
                      )}
                    </View>
                    {index < timelineSteps.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          step.completed && styles.timelineLineCompleted,
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        step.completed && styles.timelineLabelCompleted,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Pickup Date */}
        {returnData.pickupScheduledDate && (
          <View style={styles.infoCard}>
            <Ionicons name="calendar" size={20} color="#16A085" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Scheduled Pickup</Text>
              <Text style={styles.infoValue}>
                {formatDate(returnData.pickupScheduledDate)}
              </Text>
            </View>
          </View>
        )}

        {/* Rejection Reason */}
        {returnData.status === 'rejected' && returnData.rejectionReason && (
          <View style={[styles.infoCard, styles.errorCard]}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: '#EF4444' }]}>
                Rejection Reason
              </Text>
              <Text style={styles.infoValue}>{returnData.rejectionReason}</Text>
            </View>
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Returned Items</Text>
          {returnData.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/80' }}
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
              <Text style={styles.itemTotal}>
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Return Reason */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Return Reason</Text>
          <Text style={styles.reasonText}>{returnData.returnReasonText}</Text>
          {returnData.additionalComments && (
            <>
              <Text style={styles.commentsLabel}>Additional Details:</Text>
              <Text style={styles.commentsText}>
                {returnData.additionalComments}
              </Text>
            </>
          )}
        </View>

        {/* Pickup Address */}
        {returnData.pickupAddress && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Pickup Address</Text>
            <View style={styles.addressContainer}>
              <View style={styles.addressHeader}>
                <Ionicons name="location" size={20} color="#16A085" />
                <Text style={styles.addressName}>
                  {returnData.pickupAddress.name}
                </Text>
              </View>
              <Text style={styles.addressText}>
                {returnData.pickupAddress.addressLine1}
                {returnData.pickupAddress.addressLine2
                  ? `, ${returnData.pickupAddress.addressLine2}`
                  : ''}
              </Text>
              {returnData.pickupAddress.landmark && (
                <Text style={styles.addressText}>
                  Landmark: {returnData.pickupAddress.landmark}
                </Text>
              )}
              <Text style={styles.addressText}>
                {returnData.pickupAddress.city}, {returnData.pickupAddress.state} -{' '}
                {returnData.pickupAddress.pincode}
              </Text>
              <Text style={styles.addressPhone}>
                Phone: {returnData.pickupAddress.phone}
              </Text>
            </View>
          </View>
        )}

        {/* Refund Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Refund Details</Text>
          <View style={styles.refundRow}>
            <Text style={styles.refundLabel}>Refund Method</Text>
            <Text style={styles.refundValue}>
              {returnData.refundMethod === 'original'
                ? 'Original Payment Method'
                : 'Store Wallet'}
            </Text>
          </View>
          <View style={styles.refundRow}>
            <Text style={styles.refundLabel}>Refund Amount</Text>
            <Text style={styles.refundAmount}>
              {formatCurrency(returnData.refundAmount)}
            </Text>
          </View>
          {returnData.refundTransactionId && (
            <View style={styles.refundRow}>
              <Text style={styles.refundLabel}>Transaction ID</Text>
              <Text style={styles.refundValue}>
                {returnData.refundTransactionId}
              </Text>
            </View>
          )}
          {returnData.refundCompletedAt && (
            <View style={styles.refundRow}>
              <Text style={styles.refundLabel}>Refund Completed</Text>
              <Text style={styles.refundValue}>
                {formatDate(returnData.refundCompletedAt)}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: canCancel ? 100 : 40 }} />
      </ScrollView>

      {/* Cancel Button */}
      {canCancel && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelReturn}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <LoadingSpinner size="small" color="#EF4444" />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.cancelButtonText}>Cancel Return Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  returnIdContainer: {
    flex: 1,
  },
  returnIdLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  returnIdValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  returnDate: {
    fontSize: 13,
    color: '#9CA3AF',
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
    marginBottom: 16,
  },
  timeline: {
    marginBottom: 8,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
  timelineIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  timelineLabelCompleted: {
    color: '#111827',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A085',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#065F46',
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
  reasonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  commentsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  commentsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
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
  refundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refundLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  refundValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  refundAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16A085',
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
  cancelButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
});

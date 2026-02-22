import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '../../src/utils/helpers';
import { API_CONFIG } from '../../src/constants/config';
import { authStorage } from '../../src/utils/storage';
import { useTheme } from '../../src/context/ThemeContext';

const RETURN_STATUS_CONFIG = {
  requested: { label: 'Requested', color: '#F59E0B', icon: 'time' },
  approved: { label: 'Approved', color: '#10B981', icon: 'checkmark-circle' },
  rejected: { label: 'Rejected', color: '#EF4444', icon: 'close-circle' },
  pickup_scheduled: { label: 'Pickup Scheduled', color: '#3B82F6', icon: 'calendar' },
  picked_up: { label: 'Picked Up', color: '#8B5CF6', icon: 'cube' },
  received: { label: 'Received', color: '#6366F1', icon: 'archive' },
  inspected: { label: 'Inspected', color: '#14B8A6', icon: 'search' },
  refund_initiated: { label: 'Refund Initiated', color: '#06B6D4', icon: 'cash' },
  refund_completed: { label: 'Refund Completed', color: '#10B981', icon: 'checkmark-done' },
  cancelled: { label: 'Cancelled', color: '#6B7280', icon: 'ban' },
};

export default function ReturnsListScreen() {
  const router = useRouter();
  const [returns, setReturns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const token = await authStorage.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/returns`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load returns');
      }

      const data = await response.json();
      setReturns(data.returns || []);
    } catch (error: any) {
      console.error('Failed to load returns:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return RETURN_STATUS_CONFIG[status as keyof typeof RETURN_STATUS_CONFIG] || {
      label: status,
      color: '#6B7280',
      icon: 'help-circle',
    };
  };

  const renderReturnCard = ({ item }: any) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.colors.card }, theme.shadows.md]}
        onPress={() => router.push(`/returns/${item.returnId}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.returnInfo}>
            <Text style={[styles.returnId, { color: theme.colors.textSecondary }]}>Return #{item.returnId}</Text>
            <Text style={[styles.orderRef, { color: theme.colors.textTertiary }]}>Order: {item.orderId}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.color + '20' },
            ]}
          >
            <Ionicons
              name={statusConfig.icon as any}
              size={14}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <Text style={[styles.returnDate, { color: theme.colors.textTertiary }]}>
          Requested on {formatDate(item.createdAt)}
        </Text>

        {/* Items Preview */}
        <View style={styles.itemsPreview}>
          {item.items.slice(0, 2).map((returnItem: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <Image
                source={{ uri: returnItem.image || 'https://via.placeholder.com/50' }}
                style={[styles.itemImage, { backgroundColor: theme.colors.backgroundTertiary }]}
              />
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={1}>
                  {returnItem.name}
                </Text>
                <Text style={[styles.itemQty, { color: theme.colors.textTertiary }]}>Qty: {returnItem.quantity}</Text>
              </View>
            </View>
          ))}
          {item.items.length > 2 && (
            <Text style={[styles.moreItems, { color: theme.colors.textTertiary }]}>+{item.items.length - 2} more items</Text>
          )}
        </View>

        <View style={styles.reasonContainer}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.reasonText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.returnReasonText}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.refundInfo}>
            <Text style={[styles.refundLabel, { color: theme.colors.textSecondary }]}>Refund Amount</Text>
            <Text style={[styles.refundAmount, { color: theme.colors.primary }]}>
              {formatCurrency(item.refundAmount)}
            </Text>
          </View>
          <View style={styles.viewDetailsButton}>
            <Text style={[styles.viewDetailsText, { color: theme.colors.primary }]}>View Details</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading returns..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Returns</Text>
        <TouchableOpacity
          onPress={() => loadReturns(true)}
          style={styles.refreshButton}
          disabled={isRefreshing}
        >
          <Ionicons
            name="refresh"
            size={22}
            color="#FFFFFF"
            style={isRefreshing ? styles.spinning : undefined}
          />
        </TouchableOpacity>
      </View>

      {returns.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Returns Yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Your return requests will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={returns}
          renderItem={renderReturnCard}
          keyExtractor={(item) => item.returnId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadReturns(true)}
              colors={[theme.colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinning: {
    opacity: 0.5,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  returnInfo: {
    flex: 1,
  },
  returnId: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  orderRef: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  returnDate: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  itemsPreview: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreItems: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  refundInfo: {
    flex: 1,
  },
  refundLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  refundAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 80,
    marginBottom: 16,
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
});

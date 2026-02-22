import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import {
  fetchAddresses,
  removeAddress,
  setAddressAsDefault,
} from '../../src/store/slices/userSlice';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import type { Address } from '../../src/types';
import { useTheme } from '../../src/context/ThemeContext';

export default function AddressesScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { addresses, isLoading } = useAppSelector((state) => state.user);
  const theme = useTheme();

  useEffect(() => {
    dispatch(fetchAddresses());
  }, []);

  const handleDelete = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeAddress(addressId)).unwrap();
            } catch (error: any) {
              const errorMessage = typeof error === 'string' 
                ? error 
                : error?.message || error?.toString() || 'Failed to delete address';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await dispatch(setAddressAsDefault(addressId)).unwrap();
    } catch (error: any) {
      const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || error?.toString() || 'Failed to set default address';
      Alert.alert('Error', errorMessage);
    }
  };

  const renderAddress = ({ item }: { item: Address }) => {
    const getTypeIcon = () => {
      switch (item.type) {
        case 'home':
          return 'home';
        case 'work':
          return 'briefcase';
        default:
          return 'location';
      }
    };

    const getTypeColor = () => {
      switch (item.type) {
        case 'home':
          return '#16A085';
        case 'work':
          return '#3B82F6';
        default:
          return '#6B7280';
      }
    };

    return (
      <View style={[styles.addressCard, { backgroundColor: theme.colors.card }, theme.shadows.md]}>
        <View style={styles.addressHeader}>
          <View style={styles.addressTypeContainer}>
            <View style={[styles.typeIcon, { backgroundColor: `${getTypeColor()}20` }]}>
              <Ionicons name={getTypeIcon() as any} size={20} color={getTypeColor()} />
            </View>
            <View>
              <Text style={[styles.addressType, { color: theme.colors.text }]}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                {item.label && ` - ${item.label}`}
              </Text>
              {item.isDefault && (
                <View style={[styles.defaultBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.addressActions}>
            <TouchableOpacity
              onPress={() => router.push(`/profile/address-form?id=${item._id}` as any)}
              style={[styles.actionButton, { backgroundColor: theme.colors.backgroundTertiary }]}
            >
              <Ionicons name="pencil" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item._id)}
              style={[styles.actionButton, { backgroundColor: theme.isDark ? 'rgba(248, 113, 113, 0.2)' : '#FEE2E2' }]}
            >
              <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.addressDetails}>
          <Text style={[styles.addressName, { color: theme.colors.text }]}>{item.name}</Text>
          <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>{item.addressLine1}</Text>
          {item.addressLine2 && (
            <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>{item.addressLine2}</Text>
          )}
          {item.landmark && (
            <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>Landmark: {item.landmark}</Text>
          )}
          <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>
            {item.city}, {item.state} - {item.pincode}
          </Text>
          <Text style={[styles.addressPhone, { color: theme.colors.textSecondary }]}>Phone: {item.phone}</Text>
        </View>

        {!item.isDefault && (
          <TouchableOpacity
            style={[styles.setDefaultButton, { backgroundColor: theme.colors.backgroundTertiary }]}
            onPress={() => handleSetDefault(item._id)}
          >
            <Text style={[styles.setDefaultText, { color: theme.colors.primary }]}>Set as Default</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading && addresses.length === 0) {
    return <LoadingSpinner fullScreen text="Loading addresses..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity
          onPress={() => router.push('/profile/address-form' as any)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {addresses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.backgroundTertiary }]}>
            <Ionicons name="location-outline" size={80} color={theme.colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No addresses yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>Add your first delivery address</Text>
          <TouchableOpacity
            style={[styles.addFirstButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/profile/address-form' as any)}
          >
            <Text style={styles.addFirstButtonText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddress}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
  },
  addressCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  addressTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressType: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  defaultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  defaultText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressDetails: {
    marginBottom: 16,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
  addressPhone: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  setDefaultButton: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    alignItems: 'center',
  },
  setDefaultText: {
    fontSize: 15,
    fontWeight: '700',
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
  addFirstButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

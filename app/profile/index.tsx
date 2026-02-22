import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import {
  fetchUserProfile,
  uploadUserAvatar,
  deleteUserAvatar,
} from '../../src/store/slices/userSlice';
import { logout } from '../../src/store/slices/authSlice';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { profile, isLoading } = useAppSelector((state) => state.user);
  const { user } = useAppSelector((state) => state.auth);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserProfile());
    }
  }, [user]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingAvatar(true);
      try {
        await dispatch(uploadUserAvatar(result.assets[0].uri)).unwrap();
      } catch (error: any) {
        const errorMessage = typeof error === 'string' 
          ? error 
          : error?.message || error?.toString() || 'Failed to upload avatar';
        Alert.alert('Error', errorMessage);
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          router.replace('/login' as any);
        },
      },
    ]);
  };

  if (isLoading && !profile) {
    return <LoadingSpinner fullScreen text="Loading profile..." />;
  }

  const menuItems = [
    { id: '1', icon: 'person-outline', title: 'My Profile', route: '/profile/edit', color: '#6B7280' },
    { id: '2', icon: 'receipt-outline', title: 'My Orders', route: '/(tabs)/orders', color: '#6B7280' },
    { id: '3', icon: 'heart-outline', title: 'Wishlist', route: '/(tabs)/wishlist', color: '#6B7280' },
    { id: '4', icon: 'refresh-outline', title: 'Returns & Refunds', route: null, color: '#6B7280' },
    { id: '5', icon: 'location-outline', title: 'Manage Address', route: '/profile/addresses', color: '#6B7280' },
    { id: '6', icon: 'card-outline', title: 'Payment Methods', route: null, color: '#6B7280' },
    { id: '7', icon: 'wallet-outline', title: 'Wallet', route: null, color: '#6B7280' },
    { id: '8', icon: 'pricetag-outline', title: 'Coupon', route: null, color: '#6B7280' },
    { id: '9', icon: 'people-outline', title: 'Invites Friends', route: null, color: '#6B7280' },
  ];

  return (
    <View style={styles.container}>
      {/* Green Header */}
      <View style={styles.headerContainer}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Account</Text>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
              {uploadingAvatar ? (
                <View style={styles.avatar}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              ) : profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={50} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.userName}>{profile?.name || user?.name || 'User'}</Text>
            
            {/* PRO Badge */}
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          </View>

          {/* Wallet Balance Card */}
          <View style={styles.walletCard}>
            <View style={styles.walletLeft}>
              <View style={styles.walletIconContainer}>
                <Ionicons name="wallet" size={22} color="#16A085" />
              </View>
              <View>
                <Text style={styles.walletLabel}>Wallet Balance</Text>
                <Text style={styles.walletAmount}>₹{profile?.stats?.totalSpent?.toFixed(2) || '129.36'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
          </View>
        </SafeAreaView>
      </View>

      {/* Menu Items */}
      <ScrollView 
        style={styles.menuContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuContent}
      >
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => item.route && router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    backgroundColor: '#16A085',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 24,
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  proBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 14,
  },
  proText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  walletIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D5F5E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 24,
  },
  menuContent: {
    paddingHorizontal: 24,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  bottomSpace: {
    height: 32,
  },
});

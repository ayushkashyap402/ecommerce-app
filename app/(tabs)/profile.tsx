import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { logout } from '../../src/store/slices/authSlice';
import { fetchUserProfile } from '../../src/store/slices/userSlice';
import { useTheme } from '../../src/context/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { profile } = useAppSelector(state => state.user);
  const theme = useTheme();
  
  // Animation value
  const scrollY = useRef(new Animated.Value(0)).current;

  // Interpolate values for smooth animation
  const avatarScale = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const avatarOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const walletOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const walletTranslateY = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, -30],
    extrapolate: 'clamp',
  });

  const userNameOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const proBadgeOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchUserProfile());
    }
  }, [user]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

  const menuItems = [
    { id: '1', icon: 'person-outline', title: 'My Profile', route: '/profile/edit' },
    { id: '2', icon: 'receipt-outline', title: 'My Orders', route: '/(tabs)/orders' },
    { id: '3', icon: 'heart-outline', title: 'Wishlist', route: '/(tabs)/wishlist' },
    { id: '4', icon: 'refresh-outline', title: 'Returns & Refunds', route: '/returns' },
    { id: '5', icon: 'location-outline', title: 'Manage Address', route: '/profile/addresses' },
    { id: '6', icon: 'card-outline', title: 'Payment Methods', route: null },
    { id: '7', icon: 'wallet-outline', title: 'Wallet', route: null },
    { id: '8', icon: 'color-palette-outline', title: 'Theme Settings', route: '/profile/theme-settings' },
    { id: '9', icon: 'pricetag-outline', title: 'Coupon', route: null },
    { id: '10', icon: 'people-outline', title: 'Invites Friends', route: null },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* Fixed Header - Always visible at top */}
      <SafeAreaView edges={['top']} style={[styles.fixedHeader, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.textInverse} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Scrollable Content */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Green Header Background */}
        <View style={[styles.headerBackground, { backgroundColor: theme.colors.primary }]}>
          {/* Avatar Section - Animated */}
          <Animated.View 
            style={[
              styles.avatarSection,
              {
                opacity: avatarOpacity,
                transform: [{ scale: avatarScale }],
              },
            ]}
          >
            <TouchableOpacity 
              onPress={() => router.push('/profile' as any)}
              style={styles.avatarContainer}
            >
              {profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={50} color={theme.colors.textInverse} />
                </View>
              )}
            </TouchableOpacity>

            <Animated.Text style={[styles.userName, { opacity: userNameOpacity }]}>
              {profile?.name || user?.name || 'User'}
            </Animated.Text>
            
            {/* PRO Badge */}
            <Animated.View style={[styles.proBadge, { opacity: proBadgeOpacity }]}>
              <Text style={styles.proText}>PRO</Text>
            </Animated.View>
          </Animated.View>

          {/* Wallet Balance Card - Animated */}
          <Animated.View 
            style={[
              styles.walletCard,
              {
                backgroundColor: theme.colors.card,
                opacity: walletOpacity,
                transform: [{ translateY: walletTranslateY }],
              },
              theme.shadows.md,
            ]}
          >
            <View style={styles.walletLeft}>
              <View style={[styles.walletIconContainer, { backgroundColor: theme.isDark ? 'rgba(72, 201, 176, 0.15)' : '#D5F5E3' }]}>
                <Ionicons name="wallet" size={22} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={[styles.walletLabel, { color: theme.colors.textTertiary }]}>Wallet Balance</Text>
                <Text style={[styles.walletAmount, { color: theme.colors.text }]}>₹{profile?.stats?.totalSpent?.toFixed(2) || '129.36'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.colors.textTertiary} />
          </Animated.View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <View style={[styles.menuCard, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  { borderBottomColor: theme.colors.borderLight },
                  index === menuItems.length - 1 && styles.menuItemLast,
                ]}
                onPress={() => item.route && router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name={item.icon as any} size={24} color={theme.colors.textSecondary} />
                  <Text style={[styles.menuTitle, { color: theme.colors.textSecondary }]}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            style={[
              styles.logoutButton, 
              { 
                backgroundColor: theme.colors.card,
                borderColor: theme.isDark ? 'rgba(248, 113, 113, 0.3)' : '#FEE2E2'
              },
              theme.shadows.sm
            ]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
            <Text style={[styles.logoutText, { color: theme.colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerBackground: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 100,
    paddingBottom: 24,
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
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 22,
    fontWeight: '700',
  },
  menuContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  menuContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  menuCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
});

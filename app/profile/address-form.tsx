import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { addAddress, editAddress, fetchAddresses } from '../../src/store/slices/userSlice';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { useTheme } from '../../src/context/ThemeContext';
import type { CreateAddressInput } from '../../src/types';

export default function AddressFormScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams();
  const userState = useAppSelector((state) => state.user);
  const theme = useTheme();
  
  // Safely extract addresses with fallback - ensure it's always an array
  const addresses = Array.isArray(userState?.addresses) ? userState.addresses : [];
  const isLoading = userState?.isLoading || false;

  const addressId = params.id as string | undefined;
  const isEditMode = !!addressId;
  const existingAddress = addresses.length > 0 ? addresses.find((addr) => addr._id === addressId) : undefined;

  const [type, setType] = useState<'home' | 'work' | 'other'>('home');
  const [label, setLabel] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Fetch addresses if not loaded
  useEffect(() => {
    if (!addresses || addresses.length === 0) {
      dispatch(fetchAddresses()).catch((error) => {
        console.error('Failed to fetch addresses:', error);
      });
    }
  }, [dispatch]);

  // Pre-fill form when editing
  useEffect(() => {
    if (isEditMode && existingAddress) {
      setType(existingAddress.type);
      setLabel(existingAddress.label || '');
      setName(existingAddress.name);
      setPhone(existingAddress.phone);
      setAlternatePhone(existingAddress.alternatePhone || '');
      setAddressLine1(existingAddress.addressLine1);
      setAddressLine2(existingAddress.addressLine2 || '');
      setLandmark(existingAddress.landmark || '');
      setCity(existingAddress.city);
      setState(existingAddress.state);
      setPincode(existingAddress.pincode);
      setIsDefault(existingAddress.isDefault);
    }
  }, [isEditMode, existingAddress]);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return false;
    }
    if (!/^\d{10}$/.test(phone.replace(/[^\d]/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    if (!addressLine1.trim()) {
      Alert.alert('Error', 'Address line 1 is required');
      return false;
    }
    if (!city.trim()) {
      Alert.alert('Error', 'City is required');
      return false;
    }
    if (!state.trim()) {
      Alert.alert('Error', 'State is required');
      return false;
    }
    if (!/^\d{6}$/.test(pincode)) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const addressData: CreateAddressInput = {
      type,
      label: label.trim() || undefined,
      name: name.trim(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim() || undefined,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      landmark: landmark.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: 'India',
      isDefault,
    };

    console.log('Saving address:', addressData);

    try {
      if (isEditMode && addressId) {
        const result = await dispatch(editAddress({ addressId, data: addressData })).unwrap();
        console.log('Address updated:', result);
        // Refetch addresses to ensure sync
        await dispatch(fetchAddresses());
        Alert.alert('Success', 'Address updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const result = await dispatch(addAddress(addressData)).unwrap();
        console.log('Address added:', result);
        // Refetch addresses to ensure sync
        await dispatch(fetchAddresses());
        Alert.alert('Success', 'Address added successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error('Save address error:', error);
      const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || error?.toString() || 'Failed to save address';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Address' : 'Add Address'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          <Text style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Address Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Address Type</Text>
          <View style={styles.typeContainer}>
            {[
              { value: 'home', label: 'Home', icon: 'home' },
              { value: 'work', label: 'Work', icon: 'briefcase' },
              { value: 'other', label: 'Other', icon: 'location' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.typeButton,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  type === option.value && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
                  theme.isDark && type !== option.value ? {} : !theme.isDark && {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                  }
                ]}
                onPress={() => setType(option.value as any)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={type === option.value ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    { color: theme.colors.textSecondary },
                    type === option.value && { color: theme.colors.primary, fontWeight: '700' },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Label */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Label (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g., Mom's House, Office"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>

        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Contact Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Full Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter full name"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Phone Number *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 9876543210"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Alternate Phone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
              value={alternatePhone}
              onChangeText={setAlternatePhone}
              placeholder="+91 9876543210"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Address Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Address Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Address Line 1 *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
              value={addressLine1}
              onChangeText={setAddressLine1}
              placeholder="House No., Building Name"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Address Line 2</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
              value={addressLine2}
              onChangeText={setAddressLine2}
              placeholder="Road Name, Area, Colony"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Landmark</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
              value={landmark}
              onChangeText={setLandmark}
              placeholder="e.g., Near City Mall"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>City *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>

            <View style={styles.spacer} />

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Pincode *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
                value={pincode}
                onChangeText={setPincode}
                placeholder="400001"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>State *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
              value={state}
              onChangeText={setState}
              placeholder="State"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>
        </View>

        {/* Default Address */}
        <TouchableOpacity
          style={[
            styles.defaultContainer,
            { backgroundColor: theme.colors.card },
            theme.isDark ? {} : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }
          ]}
          onPress={() => setIsDefault(!isDefault)}
        >
          <View style={styles.defaultLeft}>
            <Ionicons
              name={isDefault ? 'checkbox' : 'square-outline'}
              size={24}
              color={isDefault ? theme.colors.primary : theme.colors.textTertiary}
            />
            <Text style={[styles.defaultText, { color: theme.colors.text }]}>Set as default address</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {isLoading && <LoadingSpinner overlay />}
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
  saveButton: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveButtonDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  typeButtonSelected: {
    borderColor: '#16A085',
    backgroundColor: '#D5F5E3',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeLabelSelected: {
    color: '#16A085',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  spacer: {
    width: 12,
  },
  defaultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  defaultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  defaultText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  bottomSpace: {
    height: 40,
  },
});


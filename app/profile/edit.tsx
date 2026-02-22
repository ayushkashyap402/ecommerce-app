import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { updateProfile, uploadUserAvatar, deleteUserAvatar, fetchUserProfile } from '../../src/store/slices/userSlice';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { useTheme } from '../../src/context/ThemeContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { profile, isLoading } = useAppSelector((state) => state.user);
  const { user } = useAppSelector((state) => state.auth);
  const theme = useTheme();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('prefer_not_to_say');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    if (user) {
      dispatch(fetchUserProfile());
    }
  }, [user, dispatch]);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      console.log('Profile loaded in edit screen:', profile);
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setDateOfBirth(profile.dateOfBirth ? new Date(profile.dateOfBirth) : null);
      setGender(profile.gender || 'prefer_not_to_say');
    }
  }, [profile]);

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
        Alert.alert('Success', 'Avatar updated successfully!');
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

  const handleDeleteAvatar = () => {
    Alert.alert(
      'Delete Avatar',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteUserAvatar()).unwrap();
              Alert.alert('Success', 'Avatar removed successfully!');
            } catch (error: any) {
              const errorMessage = typeof error === 'string' 
                ? error 
                : error?.message || error?.toString() || 'Failed to delete avatar';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      console.log('Saving profile:', { name, phone, dateOfBirth, gender });
      
      await dispatch(
        updateProfile({
          name: name.trim(),
          phone: phone.trim() || undefined,
          dateOfBirth: dateOfBirth?.toISOString(),
          gender,
        })
      ).unwrap();

      console.log('Profile updated successfully');
      
      // Refetch profile to ensure UI is in sync
      await dispatch(fetchUserProfile()).unwrap();

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Save profile error:', error);
      const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || error?.toString() || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          <Text style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {uploadingAvatar ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="large" color="#16A085" />
              </View>
            ) : profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={[styles.avatar, { backgroundColor: theme.colors.backgroundSecondary }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Ionicons name="person" size={60} color={theme.colors.textSecondary} />
              </View>
            )}
            
            <TouchableOpacity style={styles.editAvatarButton} onPress={handlePickImage}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {profile?.avatar && (
            <TouchableOpacity onPress={handleDeleteAvatar} style={styles.removeAvatarButton}>
              <Text style={styles.removeAvatarText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Phone Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 9876543210"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="phone-pad"
          />
        </View>

        {/* Date of Birth */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Date of Birth</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, !dateOfBirth && styles.datePlaceholder, { color: dateOfBirth ? theme.colors.text : theme.colors.textTertiary }]}>
              {formatDate(dateOfBirth)}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Gender */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Gender</Text>
          <View style={styles.genderContainer}>
            {[
              { value: 'male', label: 'Male', icon: 'male' },
              { value: 'female', label: 'Female', icon: 'female' },
              { value: 'other', label: 'Other', icon: 'transgender' },
              { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: 'help-circle' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  gender === option.value && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
                ]}
                onPress={() => setGender(option.value as any)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={gender === option.value ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.genderLabel,
                    { color: theme.colors.textSecondary },
                    gender === option.value && { color: theme.colors.primary, fontWeight: '500' },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A085',
  },
  saveButtonDisabled: {
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16A085',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  removeAvatarButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  removeAvatarText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  datePlaceholder: {
    color: '#9CA3AF',
  },
  genderContainer: {
    gap: 12,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  genderOptionSelected: {
    borderColor: '#16A085',
    backgroundColor: '#F0FDF4',
  },
  genderLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 12,
  },
  genderLabelSelected: {
    color: '#16A085',
    fontWeight: '500',
  },
});


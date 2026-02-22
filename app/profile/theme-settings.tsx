import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';

type ThemeOption = {
  mode: 'light' | 'dark' | 'system';
  label: string;
  description: string;
  icon: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    mode: 'light',
    label: 'Light Mode',
    description: 'Always use light theme',
    icon: 'sunny',
  },
  {
    mode: 'dark',
    label: 'Dark Mode',
    description: 'Always use dark theme',
    icon: 'moon',
  },
  {
    mode: 'system',
    label: 'System Default',
    description: 'Follow device settings',
    icon: 'phone-portrait',
  },
];

export default function ThemeSettingsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    theme.setThemeMode(mode);
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]} 
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theme Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Theme Preview */}
        <View style={[styles.previewCard, { backgroundColor: theme.colors.card }, theme.shadows.md]}>
          <View style={styles.previewHeader}>
            <Ionicons 
              name={theme.isDark ? 'moon' : 'sunny'} 
              size={32} 
              color={theme.colors.primary} 
            />
            <View style={styles.previewInfo}>
              <Text style={[styles.previewTitle, { color: theme.colors.text }]}>
                Current Theme
              </Text>
              <Text style={[styles.previewSubtitle, { color: theme.colors.textSecondary }]}>
                {theme.isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
          </View>
          
          <View style={[styles.previewColors, { borderTopColor: theme.colors.border }]}>
            <View style={styles.colorRow}>
              <View style={[styles.colorBox, { backgroundColor: theme.colors.primary }]} />
              <View style={[styles.colorBox, { backgroundColor: theme.colors.card }]} />
              <View style={[styles.colorBox, { backgroundColor: theme.colors.text }]} />
              <View style={[styles.colorBox, { backgroundColor: theme.colors.backgroundTertiary }]} />
            </View>
          </View>
        </View>

        {/* Theme Options */}
        <View style={styles.optionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            CHOOSE THEME
          </Text>
          
          {THEME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.mode}
              style={[
                styles.optionCard,
                { backgroundColor: theme.colors.card },
                theme.themeMode === option.mode && { 
                  borderColor: theme.colors.primary,
                  borderWidth: 2,
                },
                theme.shadows.sm,
              ]}
              onPress={() => handleThemeChange(option.mode)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[
                  styles.optionIcon,
                  { backgroundColor: theme.themeMode === option.mode 
                    ? theme.colors.primary + '20' 
                    : theme.colors.backgroundTertiary 
                  }
                ]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={24} 
                    color={theme.themeMode === option.mode 
                      ? theme.colors.primary 
                      : theme.colors.textSecondary
                    } 
                  />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                    {option.description}
                  </Text>
                </View>
              </View>
              
              {theme.themeMode === option.mode && (
                <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.card }, theme.shadows.sm]}>
          <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              About Theme Settings
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Your theme preference will be saved and applied across the entire app. 
              Choose "System Default" to automatically match your device settings.
            </Text>
          </View>
        </View>
      </ScrollView>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  previewCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewInfo: {
    marginLeft: 16,
    flex: 1,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewColors: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorBox: {
    flex: 1,
    height: 40,
    borderRadius: 10,
  },
  optionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    marginLeft: 16,
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
});

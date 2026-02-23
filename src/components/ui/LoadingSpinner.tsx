import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  text,
  fullScreen = false,
  overlay = false,
}) => {
  const theme = useTheme();
  const spinnerColor = color || theme.colors.primary;

  if (overlay) {
    return (
      <View style={styles.overlayContainer}>
        <View style={[
          styles.overlayContent,
          { 
            backgroundColor: theme.colors.card,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }
        ]}>
          <ActivityIndicator size={size} color={spinnerColor} />
          {text && (
            <Text style={[styles.overlayText, { color: theme.colors.textSecondary }]}>{text}</Text>
          )}
        </View>
      </View>
    );
  }

  if (fullScreen) {
    return (
      <View style={[styles.fullScreenContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size={size} color={spinnerColor} />
        {text && (
          <Text style={[styles.fullScreenText, { color: theme.colors.textSecondary }]}>{text}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && (
        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>{text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  fullScreenText: {
    color: '#6B7280',
    marginTop: 16,
    fontSize: 16,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlayContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  overlayText: {
    color: '#6B7280',
    marginTop: 16,
    fontSize: 16,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  text: {
    color: '#6B7280',
    marginTop: 8,
    fontSize: 14,
  },
});

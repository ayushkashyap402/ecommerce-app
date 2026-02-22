import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon,
}) => {
  const getButtonStyle = (): ViewStyle[] => {
    const styles: ViewStyle[] = [buttonStyles.base];
    
    if (fullWidth) styles.push(buttonStyles.fullWidth);
    
    switch (variant) {
      case 'primary':
        styles.push(buttonStyles.primary);
        break;
      case 'secondary':
        styles.push(buttonStyles.secondary);
        break;
      case 'outline':
        styles.push(buttonStyles.outline);
        break;
      case 'danger':
        styles.push(buttonStyles.danger);
        break;
    }
    
    switch (size) {
      case 'sm':
        styles.push(buttonStyles.sm);
        break;
      case 'md':
        styles.push(buttonStyles.md);
        break;
      case 'lg':
        styles.push(buttonStyles.lg);
        break;
    }
    
    if (disabled || isLoading) styles.push(buttonStyles.disabled);
    
    return styles;
  };

  const getTextStyle = (): TextStyle[] => {
    const styles: TextStyle[] = [buttonStyles.text];
    
    if (variant === 'outline') {
      styles.push(buttonStyles.textOutline);
    } else {
      styles.push(buttonStyles.textWhite);
    }
    
    switch (size) {
      case 'sm':
        styles.push(buttonStyles.textSm);
        break;
      case 'md':
        styles.push(buttonStyles.textMd);
        break;
      case 'lg':
        styles.push(buttonStyles.textLg);
        break;
    }
    
    return styles;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      style={getButtonStyle()}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#16A085' : '#fff'} />
      ) : (
        <View style={buttonStyles.content}>
          {icon && <View style={buttonStyles.icon}>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const buttonStyles = StyleSheet.create({
  base: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: '#16A085',
  },
  secondary: {
    backgroundColor: '#059669',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#16A085',
  },
  danger: {
    backgroundColor: '#EF4444',
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textOutline: {
    color: '#16A085',
  },
  textSm: {
    fontSize: 14,
  },
  textMd: {
    fontSize: 16,
  },
  textLg: {
    fontSize: 18,
  },
});

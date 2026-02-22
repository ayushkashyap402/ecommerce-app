import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  icon,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getContainerStyle = () => {
    const styles = [inputStyles.container];
    if (isFocused) styles.push(inputStyles.containerFocused);
    if (error) styles.push(inputStyles.containerError);
    if (multiline) styles.push(inputStyles.containerMultiline);
    return styles;
  };

  return (
    <View style={inputStyles.wrapper}>
      {label && (
        <Text style={inputStyles.label}>{label}</Text>
      )}
      
      <View style={getContainerStyle()}>
        {icon && (
          <View style={inputStyles.iconContainer}>
            {icon}
          </View>
        )}
        
        <TextInput
          style={[inputStyles.input, multiline && inputStyles.inputMultiline]}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={inputStyles.passwordToggle}
          >
            <Text style={inputStyles.passwordToggleText}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={inputStyles.error}>{error}</Text>
      )}
    </View>
  );
};

const inputStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  containerFocused: {
    borderColor: '#000000',
  },
  containerError: {
    borderColor: '#DC3545',
  },
  containerMultiline: {
    paddingVertical: 12,
  },
  iconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: 48,
  },
  inputMultiline: {
    height: 'auto',
    minHeight: 48,
  },
  passwordToggle: {
    marginLeft: 8,
  },
  passwordToggleText: {
    color: '#6B7280',
  },
  error: {
    fontSize: 14,
    color: '#DC3545',
    marginTop: 4,
  },
});

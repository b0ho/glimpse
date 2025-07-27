import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

interface CallButtonProps {
  type: 'video' | 'audio';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: number;
}

export const CallButton: React.FC<CallButtonProps> = ({
  type,
  onPress,
  disabled = false,
  loading = false,
  size = 24,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Ionicons
          name={type === 'video' ? 'videocam' : 'call'}
          size={size}
          color={disabled ? COLORS.gray : COLORS.primary}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: SIZES.base,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
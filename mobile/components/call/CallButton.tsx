import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface CallButtonProps {
  type: 'video' | 'audio';
  onPress: () => void;
  disabled?: boolean;
}

export const CallButton: React.FC<CallButtonProps> = ({ type, onPress, disabled }) => {
  return (
    <TouchableOpacity 
      style={[styles.button, disabled && styles.disabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{type === 'video' ? '영상통화' : '음성통화'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: 'white',
    fontSize: 12,
  },
});
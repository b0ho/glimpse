import React from 'react';
import { TouchableOpacity, Text} from 'react-native';

interface CallButtonProps {
  type: 'video' | 'audio';
  onPress: () => void;
  disabled?: boolean;
}

export const CallButton: React.FC<CallButtonProps> = ({ type, onPress, disabled }) => {
  return (
    <TouchableOpacity 
      className="button" 
      onPress={onPress}
      disabled={disabled}
    >
      <Text className="text">{type === 'video' ? '영상통화' : '음성통화'}</Text>
    </TouchableOpacity>
  );
};


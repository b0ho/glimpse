import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface IconWrapperProps {
  name: string;
  size?: number;
  color?: string;
  focused?: boolean;
}

export const IconWrapper = ({ name, size = 24, color = '#000', focused }: IconWrapperProps) => {
  return (
    <View style={styles.container}>
      <Icon name={name} size={size} color={focused ? '#FF6B6B' : color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
/**
 * 공통 빈 상태 컴포넌트
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  colors: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'folder-open-outline',
  title,
  description,
  action,
  colors,
}) => {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={64} color={colors.TEXT.LIGHT} />
      <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>
        {title}
      </Text>
      {description && (
        <Text style={[styles.description, { color: colors.TEXT.SECONDARY }]}>
          {description}
        </Text>
      )}
      {action && (
        <View style={styles.actionContainer}>
          {action}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 24,
  },
});
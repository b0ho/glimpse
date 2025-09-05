/**
 * 빈 섹션 표시 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';

interface EmptySectionProps {
  title: string;
  description: string;
  type: 'search' | 'match';
  onAddPress?: () => void;
  colors: any;
  t: (key: string) => string;
}

export const EmptySection: React.FC<EmptySectionProps> = ({
  title,
  description,
  type,
  onAddPress,
  colors,
  t,
}) => {
  return (
    <View style={[styles.emptySection, { backgroundColor: colors.SURFACE }]}>
      <Icon
        name={type === 'search' ? 'search-outline' : 'heart-outline'}
        size={48}
        color={colors.TEXT.TERTIARY}
      />
      <Text style={[styles.emptyTitle, { color: colors.TEXT.PRIMARY }]}>
        {title}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.TEXT.SECONDARY }]}>
        {description}
      </Text>
      {type === 'search' && onAddPress && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.PRIMARY }]}
          onPress={onAddPress}
        >
          <Icon name="add-outline" size={20} color={colors.TEXT.WHITE} />
          <Text style={[styles.addButtonText, { color: colors.TEXT.WHITE }]}>
            {t('search.addNew')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptySection: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
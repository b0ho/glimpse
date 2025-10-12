/**
 * 그룹 빈 상태 컴포넌트
 */
import React from 'react';
import { View, Text} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface GroupsEmptyStateProps {
  t: (key: string) => string;
}

export const GroupsEmptyState: React.FC<GroupsEmptyStateProps> = ({ t }) => {
  const { colors } = useTheme();

  return (
    <View className="emptyState">
      <Text className="emptyStateEmoji">🔍</Text>
      <Text className="emptyStateTitle">
        {t('group:explore.empty.title')}
      </Text>
      <Text className="emptyStateSubtitle">
        {t('group:explore.empty.subtitle')}
      </Text>
    </View>
  );
};


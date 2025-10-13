/**
 * 그룹 화면 헤더 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';

interface GroupsHeaderProps {
  t: (key: string) => string;
}

export const GroupsHeader: React.FC<GroupsHeaderProps> = ({ t }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  return (
    <View className="bg-white dark:bg-gray-800 px-4 py-4">
      <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t('main.title')}
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {t('main.subtitle')}
      </Text>

      {/* 그룹 생성 및 찾기 버튼 */}
      <View className="flex-row gap-x-2 mt-4">
        <TouchableOpacity
          className="flex-1 bg-red-500 flex-row items-center justify-center px-4 py-3 rounded-xl"
          onPress={() => (navigation as any).navigate('CreateGroup')}
        >
          <Icon name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text className="text-white font-semibold ml-2 flex-shrink-0">
            {t('main.actions.createGroup')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-white dark:bg-gray-700 flex-row items-center justify-center px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600"
          onPress={() => (navigation as any).navigate('JoinGroup', { inviteCode: '' })}
        >
          <Icon name="search-outline" size={20} color={colors.PRIMARY} />
          <Text className="text-gray-900 dark:text-gray-100 font-semibold ml-2 flex-shrink-0">
            {t('main.actions.findGroup')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


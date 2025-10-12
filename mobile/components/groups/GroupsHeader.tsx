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
    <View className="header">
      <Text className="headerTitle">{t('main.title')}</Text>
      <Text className="headerSubtitle">
        {t('main.subtitle')}
      </Text>
      
      {/* 그룹 생성 및 찾기 버튼 */}
      <View className="actionButtons">
        <TouchableOpacity
          className="actionButton flex-row items-center"
          onPress={() => navigation.navigate('CreateGroup' as never)}
        >
          <Icon name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text className="actionButtonText flex-shrink-0">{t('main.actions.createGroup')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="actionButton flex-row items-center"
          onPress={() => navigation.navigate('JoinGroup' as never, { inviteCode: '' } as never)}
        >
          <Icon name="search-outline" size={20} color={colors.PRIMARY} />
          <Text className="actionButtonText flex-shrink-0">{t('main.actions.findGroup')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


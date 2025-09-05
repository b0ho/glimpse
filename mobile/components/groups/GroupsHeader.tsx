/**
 * 그룹 화면 헤더 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
      <Text style={[styles.headerTitle, { color: colors.PRIMARY }]}>{t('main.title')}</Text>
      <Text style={[styles.headerSubtitle, { color: colors.TEXT.PRIMARY }]}>
        {t('main.subtitle')}
      </Text>
      
      {/* 그룹 생성 및 찾기 버튼 */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.PRIMARY }]}
          onPress={() => navigation.navigate('CreateGroup' as never)}
        >
          <Icon name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>{t('main.actions.createGroup')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.BACKGROUND, borderColor: colors.PRIMARY, borderWidth: 1 }]}
          onPress={() => navigation.navigate('JoinGroup' as never, { inviteCode: '' } as never)}
        >
          <Icon name="search-outline" size={20} color={colors.PRIMARY} />
          <Text style={[styles.actionButtonText, { color: colors.PRIMARY }]}>{t('main.actions.findGroup')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
/**
 * 홈 화면 헤더 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import { shadowPresets } from '@/utils/styles/platformStyles';

interface HomeHeaderProps {
  t: (key: string) => string;
  remainingLikes: number;
  receivedLikesCount: number;
  userName?: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ t, remainingLikes, receivedLikesCount, userName }) => {
  const { colors } = useTheme();
  const navigation = useNavigation() as any;

  return (
    <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
      <Text style={[styles.headerTitle, { color: colors.PRIMARY }]}>Glimpse</Text>
      <Text style={[styles.headerSubtitle, { color: colors.TEXT.PRIMARY }]}>
        {t('home:header.greeting', { name: userName || t('common:user.defaultName') || '사용자' })}
      </Text>
      <View style={styles.headerStats}>
        <Text style={[styles.statsText, { color: colors.TEXT.SECONDARY }]}>
          {t('home:header.receivedLikes', { count: receivedLikesCount })}
        </Text>
        <Text style={[styles.statsText, { color: colors.TEXT.SECONDARY }]}>
          {t('home:header.remainingLikes', { count: remainingLikes })}
        </Text>
      </View>
      
      {/* 위치 기반 기능 버튼들 */}
      <View style={styles.locationButtonsContainer}>
        <TouchableOpacity
          style={[styles.locationButton, { backgroundColor: colors.SURFACE, borderColor: colors.PRIMARY + '20' }]}
          onPress={() => navigation.navigate('NearbyGroups' as never)}
        >
          <Icon name="location-outline" size={20} color={colors.PRIMARY} />
          <Text style={[styles.locationButtonText, { color: colors.TEXT.PRIMARY }]}>
            {t('navigation:screens.nearbyGroups')}
          </Text>
          <Icon name="chevron-forward" size={16} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.locationButton, { backgroundColor: colors.SURFACE, borderColor: colors.PRIMARY + '20' }]}
          onPress={() => navigation.navigate('NearbyUsers' as never)}
        >
          <Icon name="people-outline" size={20} color={colors.PRIMARY} />
          <Text style={[styles.locationButtonText, { color: colors.TEXT.PRIMARY }]}>
            {t('navigation:screens.nearbyUsers')}
          </Text>
          <Icon name="chevron-forward" size={16} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statsText: {
    fontSize: 13,
  },
  locationButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  likeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerBottom: {
    flexDirection: 'row',
    gap: 8,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  locationButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
});
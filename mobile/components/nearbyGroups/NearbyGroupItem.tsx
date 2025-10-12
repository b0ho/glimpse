/**
 * NearbyGroupItem 컴포넌트 (StyleSheet 버전)
 *
 * @module NearbyGroupItem
 * @description 근처 그룹 목록에서 개별 그룹을 표시하는 카드 컴포넌트 (StyleSheet 스타일링 적용)
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LocationGroup } from '@/types/nearbyGroups';
import { useTheme } from '@/hooks/useTheme';
import { shadowStyles } from '@/utils/shadowStyles';
import { SPACING, FONT_SIZES } from '@/utils/constants';

/**
 * NearbyGroupItem Props 인터페이스
 *
 * @interface NearbyGroupItemProps
 */
interface NearbyGroupItemProps {
  /** 표시할 그룹 정보 */
  group: LocationGroup;
  /** 그룹 카드 클릭 시 실행될 핸들러 */
  onPress: (group: LocationGroup) => void;
  /** 그룹 가입 버튼 클릭 시 실행될 핸들러 */
  onJoin: (group: LocationGroup) => void;
  /** 그룹 탈퇴 버튼 클릭 시 실행될 핸들러 */
  onLeave: (group: LocationGroup) => void;
  /** 거리를 포맷팅하는 함수 (미터 → 문자열) */
  formatDistance: (meters: number) => string;
  /** 번역 함수 */
  t: (key: string) => string;
}

/**
 * NearbyGroupItem 컴포넌트
 *
 * @component
 * @param {NearbyGroupItemProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 그룹 카드 UI
 *
 * @description
 * 근처 그룹 화면에서 개별 그룹 정보를 카드 형태로 표시합니다. (StyleSheet 버전)
 * - 그룹 이름, 설명, 가입 상태 표시
 * - 거리, 멤버 수, 만료 시간 표시
 * - 가입/탈퇴 액션 버튼 제공
 * - 동적 테마 색상 적용
 *
 * @example
 * ```tsx
 * <NearbyGroupItem
 *   group={locationGroup}
 *   onPress={handleGroupPress}
 *   onJoin={handleJoinGroup}
 *   onLeave={handleLeaveGroup}
 *   formatDistance={(meters) => `${meters}m`}
 *   t={(key) => translate(key)}
 * />
 * ```
 *
 * @category Component
 * @subcategory NearbyGroups
 */
export const NearbyGroupItem: React.FC<NearbyGroupItemProps> = ({
  group,
  onPress,
  onJoin,
  onLeave,
  formatDistance,
  t,
}) => {
  const { colors } = useTheme();

  /**
   * 그룹 만료까지 남은 시간을 계산하고 포맷팅
   * @returns {string | null} 남은 시간 문자열 또는 null
   */
  const getRemainingTime = () => {
    if (!group.expiresAt) return null;
    
    const now = new Date();
    const expires = new Date(group.expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) return t('nearbygroups:expired');
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return t('nearbygroups:hoursRemaining', { hours });
    }
    return t('nearbygroups:minutesRemaining', { minutes });
  };

  return (
    <TouchableOpacity
      style={[styles.groupCard, { backgroundColor: colors.SURFACE }]}
      onPress={() => onPress(group)}
      activeOpacity={0.7}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, { color: colors.TEXT.PRIMARY }]}>
            {group.name}
          </Text>
          <Text style={[styles.groupDescription, { color: colors.TEXT.SECONDARY }]}>
            {group.description}
          </Text>
        </View>
        {group.isJoined && (
          <View style={[styles.joinedBadge, { backgroundColor: colors.SUCCESS + '20' }]}>
            <Text style={[styles.joinedText, { color: colors.SUCCESS }]}>
              {t('nearbygroups:joined')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.groupStats}>
        <View style={styles.statItem}>
          <Icon name="location-outline" size={16} color={colors.TEXT.SECONDARY} />
          <Text style={[styles.statText, { color: colors.TEXT.SECONDARY }]}>
            {formatDistance(group.distance || 0)}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Icon name="people-outline" size={16} color={colors.TEXT.SECONDARY} />
          <Text style={[styles.statText, { color: colors.TEXT.SECONDARY }]}>
            {t('nearbygroups:memberCount', { 
              count: group.activeMembers,
              total: group.memberCount 
            })}
          </Text>
        </View>
        
        {group.expiresAt && (
          <View style={styles.statItem}>
            <Icon name="time-outline" size={16} color={colors.TEXT.SECONDARY} />
            <Text style={[styles.statText, { color: colors.TEXT.SECONDARY }]}>
              {getRemainingTime()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.groupActions}>
        {group.isJoined ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.leaveButton]}
            onPress={() => onLeave(group)}
          >
            <Text style={[styles.actionButtonText, { color: colors.ERROR }]}>
              {t('nearbygroups:leave')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.joinButton, { backgroundColor: colors.PRIMARY }]}
            onPress={() => onJoin(group)}
          >
            <Text style={[styles.actionButtonText, { color: colors.WHITE }]}>
              {t('nearbygroups:join')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  groupCard: {
    padding: SPACING.MD,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    borderRadius: 12,
    ...shadowStyles.medium,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: FONT_SIZES.SM,
  },
  joinedBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: SPACING.SM,
  },
  joinedText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
  },
  groupStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.MD,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.MD,
    marginVertical: 4,
  },
  statText: {
    fontSize: FONT_SIZES.SM,
    marginLeft: 4,
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
  },
  joinButton: {
    minWidth: 80,
    alignItems: 'center',
  },
  leaveButton: {
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  actionButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    textAlign: 'center',
  },
});
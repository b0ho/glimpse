/**
 * NearbyGroupItem 컴포넌트 (NativeWind v4 완전 재작성)
 *
 * @module NearbyGroupItem
 * @description 근처 그룹 목록에서 개별 그룹을 표시하는 아름다운 카드 컴포넌트
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LocationGroup } from '@/types/nearbyGroups';
import { useTheme } from '@/hooks/useTheme';

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
  t: (key: string, options?: any) => string;
}

/**
 * NearbyGroupItem 컴포넌트
 *
 * @component
 * @param {NearbyGroupItemProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 아름다운 그룹 카드 UI
 *
 * @description
 * 근처 그룹 화면에서 개별 그룹 정보를 아름다운 카드 형태로 표시합니다.
 * - 완전한 NativeWind v4 스타일링
 * - 다크모드 완벽 지원 (dark: prefix)
 * - 그림자 효과와 호버 상태
 * - 명확한 정보 구조와 가독성
 * - 아름다운 버튼 디자인
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
      className="mx-4 mb-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl"
      onPress={() => onPress(group)}
      activeOpacity={0.7}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
      }}
    >
      {/* 헤더: 그룹명 + 가입 상태 배지 */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {group.name}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300 leading-5">
            {group.description}
          </Text>
        </View>

        {group.isJoined && (
          <View className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
            <Text className="text-xs font-semibold text-green-700 dark:text-green-400">
              {t('nearbygroups:joined')}
            </Text>
          </View>
        )}
      </View>

      {/* 통계 정보 */}
      <View className="flex-row items-center mb-4 flex-wrap">
        {/* 거리 */}
        <View className="flex-row items-center mr-4 mb-1">
          <Icon name="location-outline" size={16} color={colors.TEXT.SECONDARY} />
          <Text className="text-sm text-gray-600 dark:text-gray-400 ml-1">
            {formatDistance(group.distance || 0)}
          </Text>
        </View>

        {/* 멤버 수 */}
        <View className="flex-row items-center mr-4 mb-1">
          <Icon name="people-outline" size={16} color={colors.TEXT.SECONDARY} />
          <Text className="text-sm text-gray-600 dark:text-gray-400 ml-1">
            {group.activeMembers || 0}/{group.memberCount || 0} {t('nearbygroups:members')}
          </Text>
        </View>

        {/* 만료 시간 */}
        {group.expiresAt && (
          <View className="flex-row items-center mb-1">
            <Icon name="time-outline" size={16} color={colors.TEXT.SECONDARY} />
            <Text className="text-sm text-gray-600 dark:text-gray-400 ml-1">
              {getRemainingTime()}
            </Text>
          </View>
        )}
      </View>

      {/* 액션 버튼 */}
      <View className="flex-row">
        {group.isJoined ? (
          <TouchableOpacity
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg items-center"
            onPress={() => onLeave(group)}
            activeOpacity={0.7}
          >
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('nearbygroups:leave')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="flex-1 py-3 bg-red-500 rounded-lg items-center"
            onPress={() => onJoin(group)}
            activeOpacity={0.7}
          >
            <Text className="text-sm font-semibold text-white">
              {t('nearbygroups:join')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

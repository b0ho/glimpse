/**
 * 즉석 미팅 현황 화면 (NativeWind v4 버전)
 *
 * @screen
 * @description 현재 참가 중인 즉석 미팅의 상태를 실시간으로 모니터링하고 관리하는 화면
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootNavigationProp } from '@/types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { useInstantMeetingStore } from '@/store/instantMeetingStore';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

/**
 * 즉석 미팅 현황 컴포넌트
 *
 * @component
 * @returns {JSX.Element} 실시간 미팅 상태 대시보드
 *
 * @description
 * 사용자가 참가한 즉석 미팅의 현재 상태를 확인하고 관리할 수 있는 화면입니다.
 * - 실시간 참가자 수 표시 및 남은 시간 카운트다운
 * - 자동 매칭 시스템 상태 모니터링
 * - 매칭 성공 현황 및 통계 확인
 * - 특징 정보 업데이트 기능
 * - 매칭된 사람들 목록 조회
 * - 미팅 나가기 기능 (확인 Alert 포함)
 *
 * @navigation
 * - From: JoinInstantMeetingScreen (참가 완료 후), InstantTab (미팅 목록에서)
 * - To: UpdateFeatures (특징 수정), InstantMatches (매칭 목록), 이전 화면 (나가기)
 *
 * @example
 * ```tsx
 * // 즉석 미팅 참가 후 자동 이동
 * navigation.replace('InstantMeeting');
 *
 * // 미팅 목록에서 선택하여 이동
 * navigation.navigate('InstantMeeting');
 * ```
 *
 * @category Screen
 * @subcategory Instant
 */
export function InstantMeetingScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const { t } = useAndroidSafeTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {
    currentMeeting,
    participantCount,
    myStats,
    fetchMeetingDetails,
    leaveInstantMeeting,
    updateFeatures,
  } = useInstantMeetingStore();

  const [timeLeft, setTimeLeft] = useState('');
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    if (currentMeeting) {
      fetchMeetingDetails(currentMeeting.id);
      
      // 남은 시간 계산
      const timer = setInterval(() => {
        const now = new Date();
        const expires = new Date(currentMeeting.expiresAt);
        const diff = expires.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeLeft(t('instant:meeting.expired'));
          clearInterval(timer);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(t('instant:meeting.timeFormat', { hours, minutes }));
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentMeeting]);

  const handleUpdateFeatures = () => {
    navigation.navigate('UpdateFeatures', { 
      meetingId: currentMeeting!.id 
    });
  };

  const handleViewMatches = () => {
    navigation.navigate('InstantMatches', { 
      meetingId: currentMeeting!.id 
    });
  };

  const handleLeaveMeeting = () => {
    Alert.alert(
      t('instant:meeting.leaveMeeting.title'),
      t('instant:meeting.leaveMeeting.message'),
      [
        { text: t('instant:meeting.leaveMeeting.cancel'), style: 'cancel' },
        { 
          text: t('instant:meeting.leaveMeeting.confirm'), 
          style: 'destructive',
          onPress: async () => {
            await leaveInstantMeeting();
            navigation.goBack();
          }
        }
      ]
    );
  };

  if (!currentMeeting) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
        <Text className="text-gray-900 dark:text-white text-lg font-semibold">{currentMeeting.name}</Text>
        <TouchableOpacity onPress={handleLeaveMeeting}>
          <Icon name="exit-outline" size={24} color={isDark ? '#F87171' : '#EF4444'} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* 참가자 현황 */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-6 items-center mb-4 shadow-sm">
          <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">{t('instant:meeting.participants')}</Text>
          <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-2">
            {t('instant:meeting.participantsCount', { count: participantCount })}
          </Text>
          <Text className="text-blue-500 dark:text-blue-400 text-sm">
            {t('instant:meeting.timeLeft', { time: timeLeft })}
          </Text>
        </View>

        {/* 자동 매칭 상태 */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-6 items-center mb-4 shadow-sm">
          <Icon name="sync" size={32} color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mt-3">
            {t('instant:meeting.autoMatching')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-sm mt-2 text-center">
            {t('instant:meeting.matchingDescription')}
          </Text>
          {myStats.matches === 0 && (
            <TouchableOpacity 
              className="bg-blue-500 dark:bg-blue-600 px-6 py-3 rounded-lg mt-4"
              onPress={handleUpdateFeatures}
            >
              <Text className="text-white text-sm font-semibold">{t('instant:meeting.updateFeatures')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 내 매칭 현황 */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-4">
            {t('instant:meeting.myMatches')}
          </Text>
          <View className="flex-row justify-around">
            <View className="flex-1 items-center">
              <Text className="text-gray-600 dark:text-gray-400 text-xs mb-1">{t('instant:meeting.matchCount')}</Text>
              <Text className="text-gray-900 dark:text-white text-lg font-semibold">{myStats.matches}</Text>
            </View>
          </View>
        </View>

        {/* 매칭 확인 버튼 */}
        {myStats.matches > 0 && (
          <TouchableOpacity
            className="bg-white dark:bg-gray-800 rounded-xl p-4 flex-row items-center justify-between shadow-sm"
            onPress={handleViewMatches}
          >
            <Text className="text-blue-500 dark:text-blue-400 text-base font-semibold">
              {t('instant:meeting.viewMatches', { count: myStats.matches })}
            </Text>
            <Icon name="chevron-forward" size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
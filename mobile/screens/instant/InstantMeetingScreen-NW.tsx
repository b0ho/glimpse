import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootNavigationProp } from '@/types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { useInstantMeetingStore } from '@/store/instantMeetingStore';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

export function InstantMeetingScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const { t } = useAndroidSafeTranslation();
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
          <Icon name="arrow-back" size={24} className="text-gray-900 dark:text-white" />
        </TouchableOpacity>
        <Text className="text-gray-900 dark:text-white text-lg font-semibold">{currentMeeting.name}</Text>
        <TouchableOpacity onPress={handleLeaveMeeting}>
          <Icon name="exit-outline" size={24} className="text-red-500 dark:text-red-400" />
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
          <Icon name="sync" size={32} className="text-blue-500 dark:text-blue-400" />
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
            <Icon name="chevron-forward" size={20} className="text-blue-500 dark:text-blue-400" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
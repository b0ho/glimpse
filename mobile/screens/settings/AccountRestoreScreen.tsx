/**
 * 계정 복구 화면
 *
 * @screen
 * @description 삭제 예정인 계정을 복구할 수 있는 화면. 7일 대기 기간 내에 계정 삭제를 취소하고 복구할 수 있습니다.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { COLORS } from '@/constants/theme';
import { useAuthStore } from '@/store/slices/authSlice';
import { authService } from '@/services/api/authService';
import { ServerConnectionError } from '@/components/ServerConnectionError';

/**
 * 계정 삭제 상태 인터페이스
 *
 * @interface DeletionStatus
 * @property {boolean} isScheduledForDeletion - 삭제 예약 여부
 * @property {string} [deletionRequestedAt] - 삭제 요청 일시
 * @property {string} [scheduledDeletionAt] - 삭제 예정 일시
 * @property {number} [daysRemaining] - 남은 일수
 * @property {string} [reason] - 삭제 사유
 */
interface DeletionStatus {
  isScheduledForDeletion: boolean;
  deletionRequestedAt?: string;
  scheduledDeletionAt?: string;
  daysRemaining?: number;
  reason?: string;
}

/**
 * 계정 복구 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element}
 *
 * @description
 * 삭제 예정인 계정의 상태를 확인하고 복구할 수 있는 화면입니다.
 * - 삭제 예정 상태 조회 및 표시
 * - 남은 복구 기간 표시 (7일 이내)
 * - 계정 복구 실행
 * - 복구 불가능한 경우 안내
 *
 * @features
 * - 삭제 상태 자동 조회
 * - 남은 일수에 따른 색상 표시 (긴급도)
 * - 복구 확인 다이얼로그
 * - 서버 연결 에러 처리
 *
 * @navigation
 * - From: SettingsScreen (설정 화면)
 * - To: 이전 화면으로 복귀 (복구 완료 시)
 *
 * @example
 * ```tsx
 * // 설정 화면에서 이동
 * navigation.navigate('AccountRestore');
 * ```
 */
export const AccountRestoreScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { t } = useAndroidSafeTranslation();
  
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serverConnectionError, setServerConnectionError] = useState(false);
  
  useEffect(() => {
    fetchDeletionStatus();
  }, []);

  const fetchDeletionStatus = async () => {
    setIsLoading(true);
    setServerConnectionError(false);
    try {
      // TODO: 실제 API 호출로 대체 필요
      // const response = await authService.getDeletionStatus();
      // setDeletionStatus(response.data);
      
      // 현재는 서버 API가 없으므로 에러 상태 설정
      setDeletionStatus(null);
      setServerConnectionError(true);
    } catch (error) {
      console.error('Failed to fetch deletion status:', error);
      setDeletionStatus(null);
      setServerConnectionError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!deletionStatus) return;

    Alert.alert(
      t('settings:deleteAccount.restore.confirmTitle'),
      t('settings:deleteAccount.restore.confirmMessage'),
      [
        { text: t('common:buttons.cancel'), style: 'cancel' },
        {
          text: t('settings:deleteAccount.restore.confirmButton'),
          style: 'default',
          onPress: handleRestoreConfirmed,
        },
      ]
    );
  };

  const handleRestoreConfirmed = async () => {
    setIsRestoring(true);
    
    try {
      // TODO: 실제 API 호출로 대체 필요
      // await authService.restoreAccount();
      throw new Error('서버 API가 구현되지 않았습니다');
      
      Alert.alert(
        t('settings:deleteAccount.restore.successTitle'),
        t('settings:deleteAccount.restore.successMessage'),
        [
          {
            text: t('common:buttons.confirm'),
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Account restore error:', error);
      Alert.alert(
        t('settings:deleteAccount.restore.errorTitle'),
        t('settings:deleteAccount.restore.errorMessage')
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysRemainingColorClass = (days?: number) => {
    if (!days) return 'text-gray-500 dark:text-gray-500';
    if (days <= 1) return 'text-red-500 dark:text-red-400';
    if (days <= 3) return 'text-orange-500 dark:text-orange-400';
    return 'text-blue-500 dark:text-blue-400';
  };

  // 서버 연결 에러 시 에러 화면 표시
  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={() => {
          setServerConnectionError(false);
          fetchDeletionStatus();
        }}
        message="계정 삭제 상태를 불러올 수 없습니다"
      />
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-1 justify-center items-center p-6">
          <ActivityIndicator size="large" className="text-blue-500" />
          <Text className="text-gray-900 dark:text-white text-base mt-4 text-center">
            {t('settings:deleteAccount.loadingStatus')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!deletionStatus?.isScheduledForDeletion) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-1 justify-center items-center p-6">
          <Icon name="checkmark-circle" size={64} color="#10B981" />
          <Text className="text-gray-900 dark:text-white text-xl font-semibold mt-4 text-center">
            {t('settings:deleteAccount.restore.notScheduledTitle')}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-base mt-3 text-center">
            {t('settings:deleteAccount.restore.notScheduledMessage')}
          </Text>
          <TouchableOpacity
            className="bg-blue-500 dark:bg-blue-600 rounded-xl py-4 px-8 mt-8"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white text-base font-semibold">
              {t('common:buttons.back')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-1"
        >
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text className="text-gray-900 dark:text-white text-lg font-semibold">
          {t('settings:deleteAccount.restore.title')}
        </Text>
        <View className="w-10" />
      </View>
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* 상태 카드 */}
        <View className={`rounded-xl p-6 mt-6 mx-4 items-center border ${
          deletionStatus.daysRemaining && deletionStatus.daysRemaining <= 1
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : deletionStatus.daysRemaining && deletionStatus.daysRemaining <= 3
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }`}>
          <View className="mb-4">
            <Icon
              name="hourglass-outline"
              size={32}
              color={
                !deletionStatus.daysRemaining ? "#6B7280" :
                deletionStatus.daysRemaining <= 1 ? "#EF4444" :
                deletionStatus.daysRemaining <= 3 ? "#F97316" :
                "#3B82F6"
              }
            />
          </View>
          
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-6 text-center">
            {t('settings:deleteAccount.restore.statusTitle')}
          </Text>
          
          <View className="w-full space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 dark:text-gray-400 text-base">
                {t('settings:deleteAccount.restore.daysRemaining')}
              </Text>
              <Text className={`text-2xl font-bold ${getDaysRemainingColorClass(deletionStatus.daysRemaining)}`}>
                {deletionStatus.daysRemaining}일
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 dark:text-gray-400 text-base">
                {t('settings:deleteAccount.restore.requestedAt')}
              </Text>
              <Text className="text-gray-900 dark:text-white text-base font-semibold">
                {deletionStatus.deletionRequestedAt && formatDate(deletionStatus.deletionRequestedAt)}
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 dark:text-gray-400 text-base">
                {t('settings:deleteAccount.restore.scheduledAt')}
              </Text>
              <Text className="text-gray-900 dark:text-white text-base font-semibold">
                {deletionStatus.scheduledDeletionAt && formatDate(deletionStatus.scheduledDeletionAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* 복구 안내 */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 mx-4">
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-4">
            {t('settings:deleteAccount.restore.infoTitle')}
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row items-start gap-3">
              <Icon name="checkmark-circle" size={20} color="#10B981" />
              <Text className="text-gray-900 dark:text-white text-base flex-1">
                {t('settings:deleteAccount.restore.info.1')}
              </Text>
            </View>

            <View className="flex-row items-start gap-3">
              <Icon name="checkmark-circle" size={20} color="#10B981" />
              <Text className="text-gray-900 dark:text-white text-base flex-1">
                {t('settings:deleteAccount.restore.info.2')}
              </Text>
            </View>

            <View className="flex-row items-start gap-3">
              <Icon name="checkmark-circle" size={20} color="#10B981" />
              <Text className="text-gray-900 dark:text-white text-base flex-1">
                {t('settings:deleteAccount.restore.info.3')}
              </Text>
            </View>
          </View>
        </View>

        {/* 복구 버튼 */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-green-500 dark:bg-green-600 rounded-xl py-4 mx-4 mt-8"
          onPress={handleRestore}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Icon name="refresh" size={20} color="#FFFFFF" />
              <Text className="text-white text-base font-bold ml-2">
                {t('settings:deleteAccount.restore.button')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* 주의사항 */}
        <View className="flex-row items-start bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 mt-6 mx-4 mb-8">
          <Icon name="information-circle" size={24} color="#F97316" />
          <Text className="text-gray-900 dark:text-white text-base flex-1 ml-3">
            {t('settings:deleteAccount.restore.warning')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
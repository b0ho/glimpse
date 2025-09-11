import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { useProfileData } from '@/hooks/profile/useProfileData';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { EditNicknameModal } from '@/components/modals/EditNicknameModal';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { ThemeSelector } from '@/components/settings/ThemeSelector';
import { LetterFromFounder } from '@/components/profile/LetterFromFounder';
import { PremiumSection } from '@/components/profile/PremiumSection';
import { ActivityStats } from '@/components/profile/ActivityStats';
import { LikeSystemStatus } from '@/components/profile/LikeSystemStatus';
import { cn } from '@/lib/utils';

/**
 * 프로필 화면 컴포넌트 - NativeWind 버전
 * @component
 * @returns {JSX.Element} 프로필 화면 UI
 * @description 사용자 프로필, 통계, 프리미엄 상태, 설정 기능을 제공하는 화면
 */
export const ProfileScreen = () => {
  const isFocused = useIsFocused();
  const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
  
  const navigation = useNavigation();
  const { t } = useAndroidSafeTranslation('profile');
  const { colors, isDarkMode } = useTheme();
  
  const {
    isPremiumUser,
    currentPlan,
    joinedGroupsCount,
    sentLikesCount,
    receivedLikesCount,
    matchesCount,
    handleSignOut,
    handleEditNickname,
    handleDeleteAccount,
    isLoggingOut,
  } = useProfileData(t);

  // 웹에서 포커스되지 않은 경우 렌더링하지 않음
  if (Platform.OS === 'web' && !isFocused) {
    return null;
  }

  /**
   * 설정 섹션 렌더링
   * @returns {JSX.Element} 설정 메뉴 UI
   */
  const renderSettingsSection = () => (
    <View className="mb-6">
      <Text className={cn(
        "text-lg font-bold mb-4 px-4",
        isDarkMode ? "text-white" : "text-gray-900"
      )}>
        {t('common:navigation.settings')}
      </Text>
      
      <View className={cn(
        "mx-4 rounded-2xl p-1",
        isDarkMode ? "bg-gray-900" : "bg-white",
        "shadow-md"
      )}>
        <LanguageSelector onLanguageChange={() => {}} />
        <ThemeSelector onThemeChange={() => {}} />
        
        <TouchableOpacity 
          className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800"
          onPress={() => navigation.navigate('MyGroups' as never)}
        >
          <View className="flex-row items-center flex-1">
            <Ionicons name="layers-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#4B5563'} />
            <Text className={cn(
              "ml-3 text-base",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              {t('profile:settings.myGroups')}
            </Text>
          </View>
          <Text className={cn(
            "text-lg",
            isDarkMode ? "text-gray-500" : "text-gray-400"
          )}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800"
          onPress={() => navigation.navigate('NotificationSettings' as never)}
        >
          <View className="flex-row items-center flex-1">
            <Ionicons name="notifications-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#4B5563'} />
            <Text className={cn(
              "ml-3 text-base",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              {t('profile:settings.notificationSettings')}
            </Text>
          </View>
          <Text className={cn(
            "text-lg",
            isDarkMode ? "text-gray-500" : "text-gray-400"
          )}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800"
          onPress={() => navigation.navigate('PrivacyPolicy' as never)}
        >
          <View className="flex-row items-center flex-1">
            <Ionicons name="document-text-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#4B5563'} />
            <Text className={cn(
              "ml-3 text-base",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              {t('profile:settings.privacy')}
            </Text>
          </View>
          <Text className={cn(
            "text-lg",
            isDarkMode ? "text-gray-500" : "text-gray-400"
          )}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800"
          onPress={() => navigation.navigate('TermsOfService' as never)}
        >
          <View className="flex-row items-center flex-1">
            <Ionicons name="book-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#4B5563'} />
            <Text className={cn(
              "ml-3 text-base",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              {t('profile:settings.terms')}
            </Text>
          </View>
          <Text className={cn(
            "text-lg",
            isDarkMode ? "text-gray-500" : "text-gray-400"
          )}>{'>'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-row items-center justify-between p-4"
          onPress={() => navigation.navigate('Support' as never)}
        >
          <View className="flex-row items-center flex-1">
            <Ionicons name="help-circle-outline" size={20} color={isDarkMode ? '#9CA3AF' : '#4B5563'} />
            <Text className={cn(
              "ml-3 text-base",
              isDarkMode ? "text-gray-300" : "text-gray-700"
            )}>
              {t('profile:settings.support')}
            </Text>
          </View>
          <Text className={cn(
            "text-lg",
            isDarkMode ? "text-gray-500" : "text-gray-400"
          )}>{'>'}</Text>
        </TouchableOpacity>
      </View>
      
      {/* 운영자의 편지 */}
      <LetterFromFounder />
    </View>
  );

  /**
   * 위험 섹션 렌더링
   * @returns {JSX.Element} 로그아웃/계정 삭제 UI
   */
  const renderDangerSection = () => (
    <View className="mb-6 px-4">
      <TouchableOpacity
        className={cn(
          "flex-row items-center justify-center py-4 px-6 rounded-xl mb-3",
          isLoggingOut ? "bg-gray-400" : "bg-orange-500",
          isLoggingOut && "opacity-60"
        )}
        onPress={handleSignOut}
        disabled={isLoggingOut}
        activeOpacity={0.8}
      >
        <Ionicons 
          name="log-out-outline" 
          size={20} 
          color="white" 
          style={{ marginRight: 8 }}
        />
        <Text className="text-white font-semibold text-base">
          {isLoggingOut ? t('profile:settings.loggingOut') : t('profile:settings.logout')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className="py-3"
        onPress={handleDeleteAccount}
      >
        <Text className="text-red-500 text-center text-sm">
          {t('profile:settings.deleteAccount')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // 웹에서 포커스되지 않은 경우 빈 View 반환
  if (Platform.OS === 'web' && !isFocused) {
    return <View className="flex-1" />;
  }

  return (
    <SafeAreaView 
      className={cn('flex-1', isDarkMode ? 'bg-gray-950' : 'bg-gray-50')}
      edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
    >
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className={cn(
          "px-4 py-6 border-b",
          isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        )}>
          <Text className={cn(
            "text-2xl font-bold text-primary-500 mb-1"
          )}>{t('profile:title')}</Text>
          <Text className={cn(
            "text-base",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            {t('profile:subtitle')}
          </Text>
        </View>
        
        <PremiumSection 
          isPremiumUser={isPremiumUser}
          currentPlan={currentPlan}
        />
        
        <ActivityStats
          joinedGroupsCount={joinedGroupsCount}
          sentLikesCount={sentLikesCount}
          receivedLikesCount={receivedLikesCount}
          matchesCount={matchesCount}
        />
        
        <LikeSystemStatus 
          isPremiumUser={isPremiumUser}
        />
        
        {renderSettingsSection()}
        {renderDangerSection()}
        
        <View className="px-4 py-8">
          <Text className={cn(
            "text-center text-xs",
            isDarkMode ? "text-gray-600" : "text-gray-400"
          )}>
            {t('profile:footer.version')}{'\n'}
            {t('profile:footer.tagline')}
          </Text>
        </View>
      </ScrollView>
      
      <EditNicknameModal
        visible={isNicknameModalVisible}
        onClose={() => setIsNicknameModalVisible(false)}
        onSuccess={() => {
          Alert.alert(t('common:status.success'), t('common:modals.editNickname.changeSuccess'));
        }}
      />
    </SafeAreaView>
  );
};
/**
 * 프로필 편집 화면 (NativeWind v4 버전)
 *
 * @screen
 * @description 사용자 프로필 상세 정보를 편집하는 화면 - 기본 정보, SNS 계정, 회사/학교 정보, 외모 정보 등을 관리
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { useTheme } from '@/hooks/useTheme';
import { useProfileEditForm } from '@/hooks/profile/useProfileEditForm';
import { useSocialAccounts } from '@/hooks/profile/useSocialAccounts';
import { BasicInfoSection } from '@/components/profile/edit/BasicInfoSection';
import { SocialAccountsSection } from '@/components/profile/edit/SocialAccountsSection';
import { cn } from '@/lib/utils';

/**
 * 프로필 편집 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element} 프로필 편집 폼 화면
 *
 * @description
 * 사용자의 상세 프로필 정보를 편집할 수 있는 화면입니다.
 * - 기본 정보: 닉네임, 실명, 성별, 생년월일, 자기소개
 * - 연락처 정보: 이메일, 전화번호
 * - SNS 계정: 인스타그램, 페이스북 등 소셜 미디어 ID
 * - 플랫폼 ID: 카카오톡, 라인 등 메신저 ID
 * - 게임 ID: 롤, 배그 등 게임 닉네임
 * - 회사/학교 정보: 직장, 학교, 전공, 거주 지역
 * - 외모 정보: 키, 몸무게, 외모 특징 등
 *
 * @navigation
 * - From: ProfileScreen의 설정 메뉴 또는 프로필 영역
 * - To: 저장 후 이전 화면으로 복귀
 *
 * @example
 * ```tsx
 * // ProfileScreen에서 네비게이션
 * navigation.navigate('ProfileEdit');
 * ```
 *
 * @category Screen
 * @subcategory Profile
 */
export const ProfileEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  
  const {
    // Basic info
    nickname, setNickname,
    realName, setRealName,
    selectedGender, setSelectedGender,
    birthdate, setBirthdate,
    bio, setBio,
    
    // Contact info
    email, setEmail,
    phoneNumber, setPhoneNumber,
    
    // Social accounts
    socialIds, setSocialIds,
    platformIds, setPlatformIds,
    gameIds, setGameIds,
    
    // Work/Education
    companyName, setCompanyName,
    school, setSchool,
    major, setMajor,
    location, setLocation,
    appearance, setAppearance,
    
    // Part-time job
    partTimeJobPlace, setPartTimeJobPlace,
    partTimeJobPosition, setPartTimeJobPosition,
    partTimeJobHours, setPartTimeJobHours,
    
    // UI states
    toggles,
    toggleSection,
    loading,
    
    // Actions
    handleSave,
  } = useProfileEditForm();
  
  const {
    addSocialId,
    removeSocialId,
    updateSocialId,
    addPlatformId,
    removePlatformId,
    updatePlatformId,
    addGameId,
    removeGameId,
    updateGameId,
  } = useSocialAccounts(
    socialIds, setSocialIds,
    platformIds, setPlatformIds,
    gameIds, setGameIds
  );
  
  return (
    <SafeAreaView 
      className={cn(
        "flex-1",
"bg-white dark:bg-gray-900"
      )}
      style={{ backgroundColor: colors.BACKGROUND }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View 
          className={cn(
            "flex-row items-center justify-between px-4 py-3 border-b",
"border-gray-200 dark:border-gray-700"
          )}
          style={{ borderBottomColor: colors.BORDER }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={28} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text 
            className="text-xl font-semibold"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            내 정보 편집
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text 
              className="text-lg font-semibold"
              style={{ color: colors.PRIMARY }}
            >
              {loading ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* 기본 정보 섹션 */}
          <BasicInfoSection
            nickname={nickname}
            setNickname={setNickname}
            realName={realName}
            setRealName={setRealName}
            selectedGender={selectedGender}
            setSelectedGender={setSelectedGender}
            birthdate={birthdate}
            setBirthdate={setBirthdate}
            bio={bio}
            setBio={setBio}
          />
          
          {/* 연락처 정보 섹션 */}
          <View className="p-4">
            <Text 
              className="text-lg font-semibold mb-4"
              style={{ color: colors.TEXT.PRIMARY }}
            >
              연락처 정보
            </Text>
            
            <View className="mb-4">
              <Text 
                className="text-sm font-medium mb-2"
                style={{ color: colors.TEXT.SECONDARY }}
              >
                이메일
              </Text>
              <CrossPlatformInput
                className={cn(
                  "px-4 py-3 rounded-lg border",
"bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                )}
                style={{ 
                  color: colors.TEXT.PRIMARY, 
                  borderColor: colors.BORDER 
                }}
                placeholder="example@email.com"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View className="mb-4">
              <Text 
                className="text-sm font-medium mb-2"
                style={{ color: colors.TEXT.SECONDARY }}
              >
                전화번호
              </Text>
              <CrossPlatformInput
                className={cn(
                  "px-4 py-3 rounded-lg border",
"bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                )}
                style={{ 
                  color: colors.TEXT.PRIMARY, 
                  borderColor: colors.BORDER 
                }}
                placeholder="010-0000-0000"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* SNS 계정 섹션 */}
          <SocialAccountsSection
            socialIds={socialIds}
            platformIds={platformIds}
            gameIds={gameIds}
            addSocialId={addSocialId}
            removeSocialId={removeSocialId}
            updateSocialId={updateSocialId}
            addPlatformId={addPlatformId}
            removePlatformId={removePlatformId}
            updatePlatformId={updatePlatformId}
            addGameId={addGameId}
            removeGameId={removeGameId}
            updateGameId={updateGameId}
          />

          {/* 회사/학교 정보 섹션 */}
          <View className="p-4">
            <Text 
              className="text-lg font-semibold mb-4"
              style={{ color: colors.TEXT.PRIMARY }}
            >
              회사/학교 정보
            </Text>
            
            <View className="mb-4">
              <Text 
                className="text-sm font-medium mb-2"
                style={{ color: colors.TEXT.SECONDARY }}
              >
                회사명
              </Text>
              <CrossPlatformInput
                className={cn(
                  "px-4 py-3 rounded-lg border",
"bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                )}
                style={{ 
                  color: colors.TEXT.PRIMARY, 
                  borderColor: colors.BORDER 
                }}
                placeholder="회사명을 입력하세요"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={companyName}
                onChangeText={setCompanyName}
              />
            </View>
            
            <View className="mb-4">
              <Text 
                className="text-sm font-medium mb-2"
                style={{ color: colors.TEXT.SECONDARY }}
              >
                학교
              </Text>
              <CrossPlatformInput
                className={cn(
                  "px-4 py-3 rounded-lg border",
"bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                )}
                style={{ 
                  color: colors.TEXT.PRIMARY, 
                  borderColor: colors.BORDER 
                }}
                placeholder="학교명을 입력하세요"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={school}
                onChangeText={setSchool}
              />
            </View>

            <View className="mb-4">
              <Text 
                className="text-sm font-medium mb-2"
                style={{ color: colors.TEXT.SECONDARY }}
              >
                전공
              </Text>
              <CrossPlatformInput
                className={cn(
                  "px-4 py-3 rounded-lg border",
"bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                )}
                style={{ 
                  color: colors.TEXT.PRIMARY, 
                  borderColor: colors.BORDER 
                }}
                placeholder="전공을 입력하세요"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={major}
                onChangeText={setMajor}
              />
            </View>

            <View className="mb-4">
              <Text 
                className="text-sm font-medium mb-2"
                style={{ color: colors.TEXT.SECONDARY }}
              >
                거주 지역
              </Text>
              <CrossPlatformInput
                className={cn(
                  "px-4 py-3 rounded-lg border",
"bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                )}
                style={{ 
                  color: colors.TEXT.PRIMARY, 
                  borderColor: colors.BORDER 
                }}
                placeholder="거주 지역을 입력하세요"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* 추가 정보 섹션 */}
          <View className="p-4">
            <Text 
              className="text-lg font-semibold mb-4"
              style={{ color: colors.TEXT.PRIMARY }}
            >
              외모 정보
            </Text>
            
            <View className="mb-6">
              <Text 
                className="text-sm font-medium mb-2"
                style={{ color: colors.TEXT.SECONDARY }}
              >
                외모 설명
              </Text>
              <CrossPlatformInput
                className={cn(
                  "px-4 py-3 rounded-lg border h-24",
"bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                )}
                style={{ 
                  color: colors.TEXT.PRIMARY, 
                  borderColor: colors.BORDER,
                  textAlignVertical: 'top'
                }}
                placeholder="키, 몸무게, 외모 특징 등을 자유롭게 적어주세요"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={appearance}
                onChangeText={setAppearance}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
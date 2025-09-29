/**
 * 관심상대 등록 화면 - NativeWind 버전
 * 
 * 이 파일은 1,685줄에서 약 400줄로 리팩토링된 것의 NativeWind 버전입니다.
 * 입력 컴포넌트, 비즈니스 로직, 유틸리티가 모두 분리되었습니다.
 */
import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

// 공통 컴포넌트
import { ScreenHeader } from '@/components/common';

// 커스텀 훅
import { useInterestForm } from '@/hooks/interest/useInterestForm';

// 컴포넌트
import { InterestTypeSelector } from '@/components/interest/InterestTypeSelector-NW';
import { DurationSelector } from '@/components/interest/DurationSelector-NW';
import {
  PhoneInputField,
  EmailInputField,
  BirthdateInputField,
  SocialInputField,
  CompanyInputField,
  SchoolInputField,
  GameInputField,
  LocationInputField,
  PlatformInputField,
  PartTimeJobInputField,
  NicknameInputField,
} from '@/components/interest/inputs';

// 타입
import { InterestType } from '@/types/interest';
import { useAuthStore } from '@/store/slices/authSlice';
import { SubscriptionTier } from '@/types/subscription';
import { cn } from '@/lib/utils';

export const AddInterestScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useAndroidSafeTranslation();
  const { getSubscriptionTier, user } = useAuthStore();
  
  // MY_INFO 타입인지 확인 (내 정보 등록 모드)
  const registrationType = route.params?.type;
  const isMyInfoMode = registrationType === 'MY_INFO';
  
  const relationshipType = route.params?.relationshipType || 'romantic';
  const subscriptionTier = getSubscriptionTier();

  // 폼 상태 관리를 커스텀 훅으로 위임
  const {
    selectedType,
    value,
    name,
    metadata,
    selectedGender,
    birthdate,
    showBirthdateOption,
    companyName,
    department,
    showAdditionalOptions,
    expiresAt,
    selectedDuration,
    loading,
    setSelectedType,
    setValue,
    setName,
    setMetadata,
    setSelectedGender,
    setBirthdate,
    setShowBirthdateOption,
    setCompanyName,
    setDepartment,
    setShowAdditionalOptions,
    setExpiresAt,
    setSelectedDuration,
    handleSubmit,
    handleSelectContact,
  } = useInterestForm({ relationshipType, t });

  // 입력 필드 렌더링
  const renderInputField = () => {
    if (!selectedType) return null;

    const commonProps = {
      t,
    };

    switch (selectedType) {
      case InterestType.PHONE:
        return (
          <PhoneInputField
            value={value}
            onChange={setValue}
            onContactPress={handleSelectContact}
            name={name}
            onNameChange={setName}
            selectedGender={selectedGender}
            onGenderSelect={setSelectedGender}
            {...commonProps}
          />
        );

      case InterestType.EMAIL:
        return (
          <EmailInputField
            value={value}
            onChange={setValue}
            name={name}
            onNameChange={setName}
            selectedGender={selectedGender}
            onGenderSelect={setSelectedGender}
            {...commonProps}
          />
        );

      case InterestType.BIRTHDATE:
        return (
          <BirthdateInputField
            value={value}
            onChange={setValue}
            name={name}
            onNameChange={setName}
            selectedGender={selectedGender}
            onGenderSelect={setSelectedGender}
            showAdditionalOptions={showAdditionalOptions}
            onToggleAdditionalOptions={() => setShowAdditionalOptions(!showAdditionalOptions)}
            birthdate={birthdate}
            onBirthdateChange={setBirthdate}
            {...commonProps}
          />
        );

      case InterestType.SOCIAL_ID:
        return (
          <SocialInputField
            value={value}
            onChange={setValue}
            selectedPlatform={metadata.platform}
            onPlatformSelect={(platform) => setMetadata({ ...metadata, platform })}
            name={name}
            onNicknameChange={setName}
            showAdditionalOptions={showAdditionalOptions}
            onToggleAdditionalOptions={() => setShowAdditionalOptions(!showAdditionalOptions)}
            selectedGender={selectedGender}
            onGenderSelect={setSelectedGender}
            {...commonProps}
          />
        );

      case InterestType.COMPANY:
        return (
          <CompanyInputField
            companyName={companyName}
            onCompanyNameChange={setCompanyName}
            department={department}
            onDepartmentChange={setDepartment}
            nickname={showAdditionalOptions ? name : undefined}
            onNicknameChange={setName}
            showAdditionalOptions={showAdditionalOptions}
            name={name}
            onNameChange={setName}
            selectedGender={selectedGender}
            onGenderSelect={setSelectedGender}
            {...commonProps}
          />
        );

      case InterestType.SCHOOL:
        return (
          <SchoolInputField
            schoolName={companyName}
            onSchoolNameChange={setCompanyName}
            selectedLevel={metadata.level}
            onLevelSelect={(level) => setMetadata({ ...metadata, level })}
            major={department}
            onMajorChange={setDepartment}
            nickname={showAdditionalOptions ? name : undefined}
            onNicknameChange={setName}
            showAdditionalOptions={showAdditionalOptions}
            name={name}
            onNameChange={setName}
            selectedGender={selectedGender}
            onGenderSelect={setSelectedGender}
            {...commonProps}
          />
        );

      case InterestType.GAME_ID:
        return (
          <GameInputField
            value={value}
            onChange={setValue}
            selectedGame={metadata.game}
            onGameSelect={(game) => setMetadata({ ...metadata, game })}
            name={name}
            onNameChange={setName}
            selectedGender={selectedGender}
            onGenderSelect={setSelectedGender}
            {...commonProps}
          />
        );

      case InterestType.LOCATION:
        return (
          <LocationInputField
            value={value}
            onChange={setValue}
            name={name}
            onNameChange={setName}
            selectedGender={selectedGender}
            onGenderSelect={setSelectedGender}
            {...commonProps}
          />
        );

      case InterestType.PLATFORM:
        return (
          <PlatformInputField
            platformName={metadata.platformName || ''}
            onPlatformNameChange={(platformName) => setMetadata({ ...metadata, platformName })}
            userId={value}
            onUserIdChange={setValue}
            name={name}
            onNameChange={setName}
            selectedGender={selectedGender}
            onGenderSelect={setSelectedGender}
            {...commonProps}
          />
        );

      case InterestType.PART_TIME_JOB:
        return (
          <PartTimeJobInputField
            workplace={companyName}
            onWorkplaceChange={setCompanyName}
            position={department}
            onPositionChange={setDepartment}
            nickname={showAdditionalOptions ? name : undefined}
            onNicknameChange={setName}
            name={name}
            onNameChange={setName}
            selectedGender={selectedGender}
            onGenderSelect={setSelectedGender}
            {...commonProps}
          />
        );

      case InterestType.NICKNAME:
        return (
          <NicknameInputField
            value={value}
            onChange={setValue}
            description={metadata.description}
            onDescriptionChange={(description) => setMetadata({ ...metadata, description })}
            name={name}
            onNameChange={setName}
            selectedGender={selectedGender}
            onGenderSelect={setSelectedGender}
            {...commonProps}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* 헤더 */}
        <ScreenHeader 
          title={isMyInfoMode ? '내 정보 등록' : t('interest:findTitle')}
        />

        <ScrollView 
          className="px-4 pb-24"
          showsVerticalScrollIndicator={false}
        >
          {/* MY_INFO 모드일 때 간단한 프로필 폼 */}
          {isMyInfoMode ? (
            <View className="mt-4">
              {/* 안내 메시지 */}
              <View className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 mb-6">
                <View className="flex-row items-center mb-2">
                  <Icon name="information-circle-outline" size={24} color="#3B82F6" />
                  <Text className="ml-2 text-blue-900 dark:text-blue-200 font-semibold">
                    내 정보 안내
                  </Text>
                </View>
                <Text className="text-sm text-blue-800 dark:text-blue-300 leading-5">
                  등록한 정보는 암호화되어 저장되며, 상대방도 같은 정보를 등록했을 때만 매칭됩니다.
                </Text>
              </View>
              
              {/* 전화번호 필드 (기본값 설정) */}
              <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3">
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">전화번호</Text>
                <Text className="text-base text-gray-900 dark:text-white">
                  {user?.phoneNumber || '전화번호 없음'}
                </Text>
              </View>
              
              {/* 닉네임 필드 */}
              <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3">
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">닉네임</Text>
                <Text className="text-base text-gray-900 dark:text-white">
                  {user?.nickname || '닉네임 없음'}
                </Text>
              </View>
              
              {/* 추가 정보 안내 */}
              <TouchableOpacity
                className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 flex-row items-center justify-between"
                onPress={() => {
                  // 프로필 편집 화면으로 이동
                  navigation.navigate('Profile');
                }}
              >
                <Text className="text-gray-700 dark:text-gray-300">
                  추가 정보를 입력하려면 프로필을 수정하세요
                </Text>
                <Icon name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
              
              {/* 완료 버튼 */}
              <TouchableOpacity
                className="py-4 rounded-xl items-center mt-6 bg-blue-500 dark:bg-blue-600"
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <Text className="text-white text-base font-semibold">
                  완료
                </Text>
              </TouchableOpacity>
            </View>
          ) : !selectedType ? (
            <InterestTypeSelector
              selectedType={selectedType}
              onTypeSelect={setSelectedType}
              t={t}
            />
          ) : (
            <>
              {/* 선택된 타입 표시 */}
              <TouchableOpacity
                className="flex-row items-center bg-white dark:bg-gray-800 p-4 rounded-xl my-4 gap-3"
                onPress={() => setSelectedType(null)}
              >
                <Icon name="chevron-back" size={20} color={"#6B7280"} />
                <Icon 
                  name={interestTypes.find(t => t.type === selectedType)?.icon || 'help'} 
                  size={24} 
                  color={"#3B82F6"}
                />
                <Text className="text-gray-900 dark:text-white text-base font-medium flex-1">
                  {t(`interest:types.${selectedType}`)}
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm">
                  {t('common:change')}
                </Text>
              </TouchableOpacity>

              {/* 입력 필드 */}
              <View className="my-4">
                {renderInputField()}
              </View>

              {/* 기간 선택 */}
              <DurationSelector
                selectedDuration={selectedDuration}
                onDurationSelect={setSelectedDuration}
                expiresAt={expiresAt}
                onExpiresAtChange={setExpiresAt}
                isUnlimitedAllowed={subscriptionTier === SubscriptionTier.PREMIUM}
                t={t}
              />

              {/* 제출 버튼 */}
              <TouchableOpacity
                className={cn(
                  "py-4 rounded-xl items-center mt-6 bg-blue-500 dark:bg-blue-600",
                  loading && "opacity-60"
                )}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    {t('interest:buttons.register')}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// 타입 설정 헬퍼 (임시)
const interestTypes = [
  { type: InterestType.PHONE, icon: 'call-outline' },
  { type: InterestType.EMAIL, icon: 'mail-outline' },
  { type: InterestType.SOCIAL_ID, icon: 'logo-instagram' },
  { type: InterestType.BIRTHDATE, icon: 'calendar-outline' },
  { type: InterestType.LOCATION, icon: 'location-outline' },
  { type: InterestType.NICKNAME, icon: 'at-outline' },
  { type: InterestType.COMPANY, icon: 'business-outline' },
  { type: InterestType.SCHOOL, icon: 'school-outline' },
  { type: InterestType.PART_TIME_JOB, icon: 'time-outline' },
  { type: InterestType.PLATFORM, icon: 'globe-outline' },
  { type: InterestType.GAME_ID, icon: 'game-controller-outline' },
];
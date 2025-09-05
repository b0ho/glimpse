/**
 * 관심상대 등록 화면 - 모듈화된 버전
 * 
 * 이 파일은 1,685줄에서 약 400줄로 리팩토링되었습니다.
 * 입력 컴포넌트, 비즈니스 로직, 유틸리티가 모두 분리되었습니다.
 */
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

// 공통 컴포넌트
import { ScreenHeader } from '@/components/common';

// 커스텀 훅
import { useInterestForm } from '@/hooks/interest/useInterestForm';

// 컴포넌트
import { InterestTypeSelector } from '@/components/interest/InterestTypeSelector';
import { DurationSelector } from '@/components/interest/DurationSelector';
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

export const AddInterestScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation();
  const { getSubscriptionTier } = useAuthStore();
  
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
            colors={colors}
            t={t}
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
            colors={colors}
            t={t}
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
            colors={colors}
            t={t}
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
            colors={colors}
            t={t}
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
            colors={colors}
            t={t}
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
            colors={colors}
            t={t}
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
            colors={colors}
            t={t}
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
            colors={colors}
            t={t}
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
            colors={colors}
            t={t}
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
            colors={colors}
            t={t}
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
            colors={colors}
            t={t}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* 헤더 */}
        <ScreenHeader 
          title={t('interest:findTitle')}
          colors={colors}
        />

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 타입 선택 */}
          {!selectedType ? (
            <InterestTypeSelector
              selectedType={selectedType}
              onTypeSelect={setSelectedType}
              colors={colors}
              t={t}
            />
          ) : (
            <>
              {/* 선택된 타입 표시 */}
              <TouchableOpacity
                style={[styles.selectedTypeCard, { backgroundColor: colors.SURFACE }]}
                onPress={() => setSelectedType(null)}
              >
                <Icon name="chevron-back" size={20} color={colors.TEXT.SECONDARY} />
                <Icon 
                  name={interestTypes.find(t => t.type === selectedType)?.icon || 'help'} 
                  size={24} 
                  color={colors.PRIMARY} 
                />
                <Text style={[styles.selectedTypeText, { color: colors.TEXT.PRIMARY }]}>
                  {t(`interest:types.${selectedType}`)}
                </Text>
                <Text style={[styles.changeText, { color: colors.TEXT.SECONDARY }]}>
                  {t('common:change')}
                </Text>
              </TouchableOpacity>

              {/* 입력 필드 */}
              <View style={styles.inputSection}>
                {renderInputField()}
              </View>

              {/* 기간 선택 */}
              <DurationSelector
                selectedDuration={selectedDuration}
                onDurationSelect={setSelectedDuration}
                expiresAt={expiresAt}
                onExpiresAtChange={setExpiresAt}
                isUnlimitedAllowed={subscriptionTier === SubscriptionTier.PREMIUM}
                colors={colors}
                t={t}
              />

              {/* 제출 버튼 */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: colors.PRIMARY,
                    opacity: loading ? 0.6 : 1,
                  }
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.TEXT.WHITE} />
                ) : (
                  <Text style={[styles.submitButtonText, { color: colors.TEXT.WHITE }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  selectedTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    gap: 12,
  },
  selectedTypeText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  changeText: {
    fontSize: 14,
  },
  inputSection: {
    marginVertical: 16,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

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

// Text 컴포넌트 import 추가
import { Text } from 'react-native';
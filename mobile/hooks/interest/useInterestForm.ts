/**
 * 관심상대 등록 폼 관리 커스텀 훅
 */
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useInterestStore } from '@/store/slices/interestSlice';
import { InterestType, Gender } from '@/types/interest';
import { RelationshipIntent } from '@/shared/types';
import { saveLocalInterestCard } from '@/utils/secureLocalStorage';
import { secureInterestService } from '@/services/secureInterestService';
import { validateInterestForm, FormValidationParams } from '@/utils/interest/formValidation';
import { useSubscriptionLimits } from './useSubscriptionLimits';
import Toast from 'react-native-toast-message';

interface UseInterestFormProps {
  relationshipType: string;
  t: (key: string) => string;
}

export const useInterestForm = ({ relationshipType, t }: UseInterestFormProps) => {
  const navigation = useNavigation<any>();
  const { createSearch } = useInterestStore();
  const { 
    checkSubscriptionLimits, 
    getDefaultExpiryDate, 
    getInitialDuration,
    getLimitMessage,
    getUpgradeMessage,
  } = useSubscriptionLimits();

  // Form state
  const [selectedType, setSelectedType] = useState<InterestType | null>(null);
  const [value, setValue] = useState('');
  const [name, setName] = useState('');
  const [metadata, setMetadata] = useState<any>({});
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);
  const [birthdate, setBirthdate] = useState<string>('');
  const [showBirthdateOption, setShowBirthdateOption] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [department, setDepartment] = useState('');
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date>(getDefaultExpiryDate());
  const [selectedDuration, setSelectedDuration] = useState<'3days' | '2weeks' | 'unlimited'>(getInitialDuration() as any);
  const [loading, setLoading] = useState(false);

  const relationshipIntent = relationshipType === 'romantic' ? RelationshipIntent.ROMANTIC : RelationshipIntent.FRIEND;

  /**
   * 타입 선택 핸들러
   */
  const handleTypeSelect = useCallback(async (type: InterestType) => {
    const canRegister = await checkSubscriptionLimits(type);
    
    if (!canRegister) {
      Alert.alert(
        t('interest:limitReached'),
        getLimitMessage(),
        [
          { text: t('common:close'), style: 'cancel' },
          { 
            text: t('interest:upgrade'), 
            onPress: () => navigation.navigate('Premium'),
            style: 'default'
          },
        ]
      );
      return;
    }

    setSelectedType(type);
    // 타입 변경 시 관련 상태 초기화
    setValue('');
    setMetadata({});
    setSelectedGender(null);
    setBirthdate('');
    setCompanyName('');
    setDepartment('');
    setShowAdditionalOptions(false);
  }, [checkSubscriptionLimits, getLimitMessage, navigation, t]);

  /**
   * 연락처 선택 핸들러
   */
  const handleSelectContact = useCallback(async () => {
    // TODO: 연락처 선택 기능 구현
    Alert.alert(
      t('interest:contactAccess'),
      t('interest:contactAccessMessage'),
      [{ text: t('common:confirm'), style: 'default' }]
    );
  }, [t]);

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = useCallback(async () => {
    console.log('[useInterestForm] handleSubmit - starting submission');
    
    // 회사/학교/아르바이트 타입의 경우 value를 companyName으로 설정
    let finalValue = value;
    if ((selectedType === InterestType.COMPANY || 
         selectedType === InterestType.SCHOOL || 
         selectedType === InterestType.PART_TIME_JOB) && companyName) {
      finalValue = companyName;
    }
    
    // 유효성 검사
    const validationParams: FormValidationParams = {
      selectedType,
      value: finalValue,
      metadata,
      selectedGender,
      name,
      birthdate,
      companyName,
      department,
    };

    const validation = validateInterestForm(validationParams);
    if (!validation.isValid) {
      Alert.alert(t('common:error'), validation.errorMessage || t('interest:invalidInput'));
      return;
    }

    // 구독 제한 재확인
    if (selectedType && !(await checkSubscriptionLimits(selectedType))) {
      Alert.alert(
        t('interest:limitReached'),
        getUpgradeMessage(),
        [
          { text: t('common:close'), style: 'cancel' },
          { 
            text: t('interest:upgrade'), 
            onPress: () => navigation.navigate('Premium'),
            style: 'default'
          },
        ]
      );
      return;
    }

    setLoading(true);
    
    try {
      // 관심상대 카드 저장
      const savedCard = await saveLocalInterestCard({
        userId: 'current_user',
        type: selectedType!,
        value: finalValue,
        name: name || undefined,
        metadata: {
          ...metadata,
          gender: selectedGender,
          birthdate: birthdate || undefined,
          companyName: companyName || undefined,
          department: department || undefined,
          relationshipIntent,
        },
        status: 'active',
        expiresAt: expiresAt.toISOString(),
      });

      console.log('[useInterestForm] Card saved locally:', savedCard.id);

      // 서버에 저장 시도 (실패해도 계속 진행)
      try {
        const encryptedCard = await secureInterestService.encryptInterestCard({
          type: selectedType!,
          value: finalValue,
          name: name || undefined,
          metadata: {
            ...metadata,
            gender: selectedGender,
            birthdate: birthdate || undefined,
            companyName: companyName || undefined,
            department: department || undefined,
          },
          relationshipIntent,
        });

        await createSearch({
          type: selectedType!,
          encryptedValue: encryptedCard.encryptedValue,
          encryptedMetadata: encryptedCard.encryptedMetadata,
          expiresAt,
          relationshipIntent,
          status: 'active',
        });

        console.log('[useInterestForm] Successfully synced to server');
      } catch (serverError) {
        console.error('[useInterestForm] Server sync failed:', serverError);
        // 서버 동기화 실패해도 로컬 저장은 성공
        Toast.show({
          type: 'info',
          text1: t('interest:savedLocally'),
          text2: t('interest:willSyncLater'),
        });
      }

      // 성공 알림
      Alert.alert(
        t('common:success'),
        t('interest:registrationSuccess'),
        [
          {
            text: t('common:confirm'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('[useInterestForm] Submission error:', error);
      Alert.alert(t('common:error'), t('interest:registrationFailed'));
    } finally {
      setLoading(false);
    }
  }, [
    selectedType,
    value,
    name,
    metadata,
    selectedGender,
    birthdate,
    companyName,
    department,
    relationshipIntent,
    expiresAt,
    checkSubscriptionLimits,
    createSearch,
    navigation,
    t,
    getUpgradeMessage,
  ]);

  /**
   * 폼 리셋
   */
  const resetForm = useCallback(() => {
    setSelectedType(null);
    setValue('');
    setName('');
    setMetadata({});
    setSelectedGender(null);
    setBirthdate('');
    setShowBirthdateOption(false);
    setCompanyName('');
    setDepartment('');
    setShowAdditionalOptions(false);
    setExpiresAt(getDefaultExpiryDate());
    setSelectedDuration(getInitialDuration() as any);
  }, [getDefaultExpiryDate, getInitialDuration]);

  return {
    // State
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
    relationshipIntent,

    // Setters
    setSelectedType: handleTypeSelect,
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

    // Actions
    handleSubmit,
    handleSelectContact,
    resetForm,
  };
};
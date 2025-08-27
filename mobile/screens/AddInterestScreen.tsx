import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useInterestStore } from '@/store/slices/interestSlice';
import { InterestType } from '@/types/interest';
import { RelationshipIntent } from '@/shared/types';
import { useAuthStore } from '@/store/slices/authSlice';
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from '@/types/subscription';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import * as Contacts from 'expo-contacts';

/**
 * 관심상대 등록 화면
 */
export const AddInterestScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { createSearch, searches } = useInterestStore();
  const { user, getSubscriptionTier, getSubscriptionFeatures } = useAuthStore();
  const { t } = useAndroidSafeTranslation();
  
  const subscriptionTier = getSubscriptionTier();
  const features = getSubscriptionFeatures();

  const [selectedType, setSelectedType] = useState<InterestType | null>(null);
  const [value, setValue] = useState('');
  const [name, setName] = useState(''); // 이름 필드 추가
  const [metadata, setMetadata] = useState<any>({});
  const [birthdate, setBirthdate] = useState<string>(''); // 생일 (YYYY-MM-DD)
  const [showBirthdateOption, setShowBirthdateOption] = useState(false);
  const [companyName, setCompanyName] = useState(''); // 회사/학교에서 사용할 이름
  const [department, setDepartment] = useState(''); // 부서/학과명
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  
  // 구독 티어에 따른 기본 만료일 설정
  const getDefaultExpiryDate = () => {
    const date = new Date();
    const days = features.interestSearchDuration || 3;
    date.setDate(date.getDate() + days);
    return date;
  };
  
  const [expiresAt, setExpiresAt] = useState<Date>(getDefaultExpiryDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<'3days' | '2weeks' | 'unlimited'>(() => {
    if (subscriptionTier === SubscriptionTier.BASIC) return '3days';
    if (subscriptionTier === SubscriptionTier.ADVANCED) return '2weeks';
    return 'unlimited';
  });
  const [relationshipIntent, setRelationshipIntent] = useState<RelationshipIntent>(RelationshipIntent.ROMANTIC);

  const getInterestTypes = () => [
    { type: InterestType.PHONE, label: t('interest:types.phone'), icon: 'call-outline', color: '#4CAF50' },
    { type: InterestType.EMAIL, label: t('interest:types.email'), icon: 'mail-outline', color: '#2196F3' },
    { type: InterestType.SOCIAL_ID, label: t('interest:types.socialId'), icon: 'logo-instagram', color: '#E91E63' },
    { type: InterestType.NAME, label: t('interest:types.name'), icon: 'person-outline', color: '#9C27B0' },
    { type: InterestType.GROUP, label: t('interest:types.group'), icon: 'people-outline', color: '#9C27B0' },
    { type: InterestType.LOCATION, label: t('interest:types.location'), icon: 'location-outline', color: '#FF9800' },
    { type: InterestType.APPEARANCE, label: t('interest:types.appearance'), icon: 'body-outline', color: '#795548' },
    { type: InterestType.NICKNAME, label: t('interest:types.nickname'), icon: 'at-outline', color: '#607D8B' },
    { type: InterestType.COMPANY, label: t('interest:types.company'), icon: 'business-outline', color: '#3F51B5' },
    { type: InterestType.SCHOOL, label: t('interest:types.school'), icon: 'school-outline', color: '#00BCD4' },
    { type: InterestType.HOBBY, label: t('interest:types.hobby'), icon: 'heart-outline', color: '#F44336' },
    { type: InterestType.PLATFORM, label: t('interest:types.platform'), icon: 'globe-outline', color: '#9C27B0' },
    { type: InterestType.GAME_ID, label: t('interest:types.gameId'), icon: 'game-controller-outline', color: '#673AB7' },
  ];

  const interestTypes = getInterestTypes();

  // 구독 티어에 따른 제한 확인
  const checkSubscriptionLimits = (type: InterestType): boolean => {
    // 프리미엄은 무제한
    if (subscriptionTier === SubscriptionTier.PREMIUM) return true;
    
    // 고급은 모든 유형 1개씩
    if (subscriptionTier === SubscriptionTier.ADVANCED) {
      const sameTypeSearches = searches.filter(s => s.type === type);
      if (sameTypeSearches.length >= 1) {
        Alert.alert(
          t('interest:alerts.limitTitle'),
          t('interest:alerts.advancedLimitMessage'),
          [
            { text: t('interest:alerts.confirm'), style: 'cancel' },
            { text: t('interest:alerts.upgradeButton'), onPress: () => navigation.navigate('Premium' as never) }
          ]
        );
        return false;
      }
      return true;
    }
    
    // 일반은 총 3개, 모든 유형 허용 (테스트를 위해 임시로 제한 해제)
    const allowedTypes = [
      InterestType.PHONE, 
      InterestType.EMAIL, 
      InterestType.SOCIAL_ID, 
      InterestType.NAME,
      InterestType.GROUP,
      InterestType.LOCATION,
      InterestType.APPEARANCE,
      InterestType.NICKNAME,
      InterestType.COMPANY,
      InterestType.SCHOOL,
      InterestType.HOBBY,
      InterestType.PLATFORM,
      InterestType.GAME_ID
    ];
    if (!allowedTypes.includes(type)) {
      Alert.alert(
        t('interest:alerts.limitTitle'),
        t('interest:alerts.basicLimitMessage'),
        [
          { text: t('interest:alerts.confirm'), style: 'cancel' },
          { text: t('interest:alerts.subscribeButton'), onPress: () => navigation.navigate('Premium' as never) }
        ]
      );
      return false;
    }
    
    if (searches.length >= 3) {
      Alert.alert(
        t('interest:alerts.limitTitle'),
        t('interest:alerts.basicCountMessage'),
        [
          { text: t('interest:alerts.confirm'), style: 'cancel' },
          { text: t('interest:alerts.subscribeButton'), onPress: () => navigation.navigate('Premium' as never) }
        ]
      );
      return false;
    }
    
    const sameTypeSearches = searches.filter(s => s.type === type);
    if (sameTypeSearches.length >= 1) {
      Alert.alert(
        t('interest:alerts.limitTitle'),
        t('interest:alerts.basicTypeMessage'),
        [{ text: t('interest:alerts.confirm'), style: 'cancel' }]
      );
      return false;
    }
    
    return true;
  };

  const handleSelectContact = async () => {
    // 연락처 기능은 추후 구현
    Alert.alert(t('interest:alerts.limitTitle'), t('interest:alerts.contactsNotReady'));
    // const { status } = await Contacts.requestPermissionsAsync();
    // if (status === 'granted') {
    //   const { data } = await Contacts.getContactsAsync({
    //     fields: [Contacts.Fields.PhoneNumbers],
    //   });

    //   if (data.length > 0) {
    //     // 연락처 선택 모달 표시 (간단화를 위해 첫 번째 연락처 사용)
    //     const contact = data[0];
    //     if (contact.phoneNumbers && contact.phoneNumbers[0]) {
    //       setValue(contact.phoneNumbers[0].number!);
    //     }
    //   }
    // }
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert(t('interest:errors.selectType'), t('interest:errors.selectType'));
      return;
    }

    if (!value.trim()) {
      Alert.alert(t('interest:errors.enterValue'), t('interest:errors.enterValue'));
      return;
    }

    // 소셜 계정 타입일 때 플랫폼 필수 검증
    if (selectedType === InterestType.SOCIAL_ID && !metadata.platform) {
      Alert.alert(t('interest:errors.selectPlatform'), t('interest:errors.selectPlatform'));
      return;
    }

    // 기타 플랫폼 타입일 때 플랫폼명 필수 검증
    if (selectedType === InterestType.PLATFORM && !metadata.platformName) {
      Alert.alert(t('interest:errors.enterPlatformName'), t('interest:errors.enterPlatformName'));
      return;
    }
    
    // 게임 타입일 때 게임명 필수 검증
    if (selectedType === InterestType.GAME_ID && !metadata.gameName) {
      Alert.alert(t('interest:errors.enterGameName'), t('interest:errors.enterGameName'));
      return;
    }

    setLoading(true);
    try {
      // metadata 구성
      const searchMetadata = { ...metadata };
      
      // NAME 타입일 때 생일 정보 추가
      if (selectedType === InterestType.NAME && birthdate) {
        searchMetadata.birthdate = birthdate;
      }
      
      // COMPANY 타입일 때 추가 정보
      if (selectedType === InterestType.COMPANY && showAdditionalOptions) {
        if (companyName.trim()) searchMetadata.employeeName = companyName.trim();
        if (department.trim()) searchMetadata.department = department.trim();
        if (birthdate) searchMetadata.birthdate = birthdate;
      }
      
      // SCHOOL 타입일 때 추가 정보
      if (selectedType === InterestType.SCHOOL && showAdditionalOptions) {
        if (companyName.trim()) searchMetadata.studentName = companyName.trim();
        if (department.trim()) searchMetadata.major = department.trim();
        if (birthdate) searchMetadata.birthdate = birthdate;
      }
      
      // 공통 이름 필드
      if (name.trim()) {
        searchMetadata.name = name.trim();
      }

      await createSearch({
        type: selectedType,
        value: value.trim(),
        metadata: { 
          ...searchMetadata, 
          relationshipIntent 
        },
        expiresAt: expiresAt?.toISOString(),
      });

      console.log('[AddInterestScreen] 관심상대 등록 성공, 화면 전환');
      // Alert 대신 바로 뒤로 이동
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(t('interest:errors.registrationError'), error.message || t('interest:errors.registrationError'));
    } finally {
      setLoading(false);
    }
  };

  const renderInputField = () => {
    if (!selectedType) return null;

    switch (selectedType) {
      case InterestType.PHONE:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder={t('interest:placeholders.phone')}
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: colors.PRIMARY }]}
              onPress={handleSelectContact}
            >
              <Icon name="person-add-outline" size={20} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>{t('interest:buttons.selectFromContacts')}</Text>
            </TouchableOpacity>
          </View>
        );

      case InterestType.EMAIL:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder={t('interest:placeholders.email')}
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        );

      case InterestType.SOCIAL_ID:
        return (
          <View style={styles.inputContainer}>
            {/* 소셜 플랫폼 드롭다운 (필수) */}
            <View style={styles.dropdownContainer}>
              <Text style={[styles.inputLabel, { color: colors.TEXT.PRIMARY }]}>
                소셜 플랫폼 선택 <Text style={{ color: colors.ERROR }}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.dropdown,
                  { 
                    borderColor: !metadata.platform ? colors.ERROR : colors.BORDER,
                    backgroundColor: colors.SURFACE 
                  },
                  metadata.showPlatformPicker && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                ]}
                onPress={() => setMetadata({ ...metadata, showPlatformPicker: !metadata.showPlatformPicker })}
              >
                <View style={styles.dropdownContent}>
                  {metadata.platform ? (
                    <View style={styles.selectedPlatform}>
                      <Icon 
                        name={
                          metadata.platform === 'instagram' ? 'logo-instagram' :
                          metadata.platform === 'kakao' ? 'chatbubble-ellipses-outline' :
                          metadata.platform === 'facebook' ? 'logo-facebook' :
                          metadata.platform === 'twitter' ? 'logo-twitter' :
                          metadata.platform === 'tiktok' ? 'logo-tiktok' :
                          'at-outline'
                        }
                        size={20}
                        color={colors.PRIMARY}
                      />
                      <Text style={[styles.dropdownText, { color: colors.TEXT.PRIMARY }]}>
                        {metadata.platform === 'instagram' ? 'Instagram' :
                         metadata.platform === 'kakao' ? 'KakaoTalk' :
                         metadata.platform === 'facebook' ? 'Facebook' :
                         metadata.platform === 'twitter' ? 'Twitter (X)' :
                         metadata.platform === 'tiktok' ? 'TikTok' :
                         metadata.platform}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.dropdownPlaceholder, { color: colors.TEXT.TERTIARY }]}>
                      소셜 플랫폼을 선택하세요
                    </Text>
                  )}
                  <Icon 
                    name={metadata.showPlatformPicker ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.TEXT.SECONDARY} 
                  />
                </View>
              </TouchableOpacity>
              
              {/* 드롭다운 옵션 - 상대 위치로 변경 */}
              {metadata.showPlatformPicker && (
                <View style={[
                  styles.dropdownOptionsRelative, 
                  { 
                    backgroundColor: colors.SURFACE, 
                    borderColor: colors.BORDER,
                    borderTopWidth: 0,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    marginTop: -1, // 경계선 겹침 제거
                  }
                ]}>
                  {[
                    { id: 'instagram', name: 'Instagram', icon: 'logo-instagram' },
                    { id: 'kakao', name: 'KakaoTalk', icon: 'chatbubble-ellipses-outline' },
                    { id: 'facebook', name: 'Facebook', icon: 'logo-facebook' },
                    { id: 'twitter', name: 'Twitter (X)', icon: 'logo-twitter' },
                    { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok' },
                  ].map((platform) => (
                    <TouchableOpacity
                      key={platform.id}
                      style={[
                        styles.dropdownOption,
                        metadata.platform === platform.id && { backgroundColor: colors.PRIMARY + '10' }
                      ]}
                      onPress={() => setMetadata({ ...metadata, platform: platform.id, showPlatformPicker: false })}
                    >
                      <Icon name={platform.icon} size={20} color={colors.PRIMARY} />
                      <Text style={[styles.dropdownOptionText, { color: colors.TEXT.PRIMARY }]}>
                        {platform.name}
                      </Text>
                      {metadata.platform === platform.id && (
                        <Icon name="checkmark" size={20} color={colors.PRIMARY} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* 소셜 계정 ID 입력 */}
            <TextInput
              style={[
                styles.input, 
                { 
                  color: colors.TEXT.PRIMARY, 
                  borderColor: colors.BORDER, 
                  marginTop: metadata.showPlatformPicker ? 8 : 12  // 드롭다운 열렸을 때 간격 조정
                }
              ]}
              placeholder={
                metadata.platform === 'kakao' ? "카카오톡 ID를 입력하세요" :
                "소셜 계정 ID를 입력하세요 (@제외)"
              }
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
              autoCapitalize="none"
            />
            
            {!metadata.platform && (
              <Text style={[styles.errorText, { color: colors.ERROR }]}>
                소셜 플랫폼을 먼저 선택해주세요
              </Text>
            )}
          </View>
        );

      case InterestType.NAME:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="이름을 입력하세요 (성명)"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
            />
            
            {/* 생일 추가 옵션 */}
            <TouchableOpacity
              style={[styles.optionRow, { backgroundColor: colors.SURFACE, marginTop: 12 }]}
              onPress={() => setShowBirthdateOption(!showBirthdateOption)}
            >
              <Icon name="calendar-outline" size={20} color={colors.PRIMARY} />
              <Text style={[styles.optionLabel, { color: colors.TEXT.PRIMARY }]}>
                생일 추가 (동명이인 구분)
              </Text>
              <Icon 
                name={showBirthdateOption ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.TEXT.SECONDARY} 
              />
            </TouchableOpacity>
            
            {showBirthdateOption && (
              <View style={styles.birthdateContainer}>
                <Text style={[styles.birthdateLabel, { color: colors.TEXT.SECONDARY }]}>
                  생년월일 (선택)
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                  placeholder="YYYY-MM-DD (예: 1995-03-15)"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={birthdate}
                  onChangeText={(text) => {
                    // 자동 하이픈 추가
                    let cleaned = text.replace(/[^0-9]/g, '');
                    if (cleaned.length >= 5 && cleaned.length <= 6) {
                      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
                    } else if (cleaned.length >= 7) {
                      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6) + '-' + cleaned.slice(6, 8);
                    }
                    setBirthdate(cleaned);
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <Text style={[styles.birthdateHint, { color: colors.TEXT.TERTIARY }]}>
                  동명이인이 많은 경우 정확한 매칭을 위해 사용됩니다
                </Text>
              </View>
            )}
          </View>
        );

      case InterestType.APPEARANCE:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textArea, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="인상착의를 자세히 설명해주세요&#10;예: 검은색 코트, 빨간 가방, 안경 착용"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        );

      case InterestType.COMPANY:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="회사명을 입력하세요"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
            />
            
            {/* 추가 옵션 토글 */}
            <TouchableOpacity
              style={[styles.optionRow, { backgroundColor: colors.SURFACE, marginTop: 12 }]}
              onPress={() => setShowAdditionalOptions(!showAdditionalOptions)}
            >
              <Icon name="person-add-outline" size={20} color={colors.PRIMARY} />
              <Text style={[styles.optionLabel, { color: colors.TEXT.PRIMARY }]}>
                상세 정보 추가 (이름, 부서, 생일)
              </Text>
              <Icon 
                name={showAdditionalOptions ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.TEXT.SECONDARY} 
              />
            </TouchableOpacity>
            
            {showAdditionalOptions && (
              <View style={styles.additionalOptionsContainer}>
                <Text style={[styles.optionSectionLabel, { color: colors.TEXT.SECONDARY }]}>
                  직원 정보 (선택)
                </Text>
                
                {/* 이름 */}
                <TextInput
                  style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                  placeholder="이름 (예: 김민수)"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={companyName}
                  onChangeText={setCompanyName}
                />
                
                {/* 부서 */}
                <TextInput
                  style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER, marginTop: 8 }]}
                  placeholder="부서명 (예: 마케팅팀, 개발1팀)"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={department}
                  onChangeText={setDepartment}
                />
                
                {/* 생일 */}
                <TextInput
                  style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER, marginTop: 8 }]}
                  placeholder="생년월일 YYYY-MM-DD (예: 1995-03-15)"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={birthdate}
                  onChangeText={(text) => {
                    let cleaned = text.replace(/[^0-9]/g, '');
                    if (cleaned.length >= 5 && cleaned.length <= 6) {
                      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
                    } else if (cleaned.length >= 7) {
                      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6) + '-' + cleaned.slice(6, 8);
                    }
                    setBirthdate(cleaned);
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                />
                
                <Text style={[styles.additionalOptionsHint, { color: colors.TEXT.TERTIARY }]}>
                  더 정확한 매칭을 위해 사용되며, 모든 정보는 익명으로 보호됩니다
                </Text>
              </View>
            )}
          </View>
        );

      case InterestType.SCHOOL:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="학교명을 입력하세요"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
            />
            
            {/* 추가 옵션 토글 */}
            <TouchableOpacity
              style={[styles.optionRow, { backgroundColor: colors.SURFACE, marginTop: 12 }]}
              onPress={() => setShowAdditionalOptions(!showAdditionalOptions)}
            >
              <Icon name="person-add-outline" size={20} color={colors.PRIMARY} />
              <Text style={[styles.optionLabel, { color: colors.TEXT.PRIMARY }]}>
                상세 정보 추가 (이름, 학과, 생일)
              </Text>
              <Icon 
                name={showAdditionalOptions ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.TEXT.SECONDARY} 
              />
            </TouchableOpacity>
            
            {showAdditionalOptions && (
              <View style={styles.additionalOptionsContainer}>
                <Text style={[styles.optionSectionLabel, { color: colors.TEXT.SECONDARY }]}>
                  학생 정보 (선택)
                </Text>
                
                {/* 이름 */}
                <TextInput
                  style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                  placeholder="이름 (예: 이지은)"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={companyName}
                  onChangeText={setCompanyName}
                />
                
                {/* 학과 */}
                <TextInput
                  style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER, marginTop: 8 }]}
                  placeholder="학과명 (예: 컴퓨터공학과, 경영학과)"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={department}
                  onChangeText={setDepartment}
                />
                
                {/* 생일 */}
                <TextInput
                  style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER, marginTop: 8 }]}
                  placeholder="생년월일 YYYY-MM-DD (예: 2000-05-20)"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={birthdate}
                  onChangeText={(text) => {
                    let cleaned = text.replace(/[^0-9]/g, '');
                    if (cleaned.length >= 5 && cleaned.length <= 6) {
                      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
                    } else if (cleaned.length >= 7) {
                      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6) + '-' + cleaned.slice(6, 8);
                    }
                    setBirthdate(cleaned);
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                />
                
                <Text style={[styles.additionalOptionsHint, { color: colors.TEXT.TERTIARY }]}>
                  더 정확한 매칭을 위해 사용되며, 모든 정보는 익명으로 보호됩니다
                </Text>
              </View>
            )}
          </View>
        );

      case InterestType.LOCATION:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="장소를 입력하세요 (예: 강남역 스타벅스)"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
            />
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: colors.PRIMARY }]}
              onPress={() => navigation.navigate('Map' as never)}
            >
              <Icon name="map-outline" size={20} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>지도에서 선택</Text>
            </TouchableOpacity>
          </View>
        );

      case InterestType.GROUP:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="그룹 ID 또는 이름을 입력하세요"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
            />
            <Text style={[styles.inputHint, { color: colors.TEXT.TERTIARY }]}>
              같은 그룹에 있는 사람끼리 매칭됩니다
            </Text>
          </View>
        );

      case InterestType.NICKNAME:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="닉네임 일부를 입력하세요"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
            />
            <Text style={[styles.inputHint, { color: colors.TEXT.TERTIARY }]}>
              최소 2글자 이상 입력하세요
            </Text>
          </View>
        );

      case InterestType.HOBBY:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="취미/관심사를 입력하세요 (예: 등산, 독서, 요리)"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
            />
            <Text style={[styles.inputHint, { color: colors.TEXT.TERTIARY }]}>
              콤마로 구분하여 여러 개 입력 가능합니다
            </Text>
          </View>
        );

      case InterestType.PLATFORM:
        return (
          <View style={styles.inputContainer}>
            {/* 기타 플랫폼 입력 */}
            <Text style={[styles.inputLabel, { color: colors.TEXT.PRIMARY }]}>
              플랫폼명 <Text style={{ color: colors.ERROR }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="플랫폼명을 입력하세요 (예: Discord, Slack, LinkedIn)"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={metadata.platformName || ''}
              onChangeText={(text) => setMetadata({ ...metadata, platformName: text })}
            />
            
            <Text style={[styles.inputLabel, { color: colors.TEXT.PRIMARY, marginTop: 12 }]}>
              플랫폼 아이디 <Text style={{ color: colors.ERROR }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="플랫폼에서 사용하는 아이디를 입력하세요"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
              autoCapitalize="none"
            />
            
            <Text style={[styles.inputHint, { color: colors.TEXT.TERTIARY }]}>
              Discord, Slack, LinkedIn 등 다양한 플랫폼 정보를 등록할 수 있습니다
            </Text>
          </View>
        );


      case InterestType.GAME_ID:
        return (
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.TEXT.PRIMARY }]}>
              게임명 <Text style={{ color: colors.ERROR }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="게임명을 입력하세요 (예: 리그 오브 레전드, 배틀그라운드)"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={metadata.gameName || ''}
              onChangeText={(text) => setMetadata({ ...metadata, gameName: text })}
            />
            
            <Text style={[styles.inputLabel, { color: colors.TEXT.PRIMARY, marginTop: 12 }]}>
              게임 아이디 <Text style={{ color: colors.ERROR }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="게임 내 아이디를 입력하세요"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
              autoCapitalize="none"
            />
            
            <Text style={[styles.inputHint, { color: colors.TEXT.TERTIARY }]}>
              게임 내에서 사용하는 닉네임이나 아이디를 입력해주세요
            </Text>
          </View>
        );

      default:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder={`${interestTypes.find(t => t.type === selectedType)?.label}을(를) 입력하세요`}
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
            />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={28} color={colors.TEXT.PRIMARY} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>
              {t('interest:title')}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* 검색 유형 선택 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              {t('interest:selectType')}
            </Text>
            <View style={styles.typeGrid}>
              {interestTypes.map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.typeCard,
                    { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
                    selectedType === item.type && { borderColor: item.color, borderWidth: 2 },
                  ]}
                  onPress={() => {
                    if (checkSubscriptionLimits(item.type)) {
                      setSelectedType(item.type);
                    }
                  }}
                >
                  <View style={[styles.typeIcon, { backgroundColor: item.color + '20' }]}>
                    <Icon name={item.icon} size={24} color={item.color} />
                  </View>
                  <Text style={[styles.typeLabel, { color: colors.TEXT.PRIMARY }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 관계 유형 선택 */}
          {selectedType && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                관계 유형
              </Text>
              <View style={styles.relationshipContainer}>
                <TouchableOpacity
                  style={[
                    styles.relationshipOption,
                    { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
                    relationshipIntent === RelationshipIntent.FRIEND && { 
                      borderColor: colors.PRIMARY, 
                      borderWidth: 2,
                      backgroundColor: colors.PRIMARY + '10'
                    },
                  ]}
                  onPress={() => setRelationshipIntent(RelationshipIntent.FRIEND)}
                >
                  <View style={styles.radioButton}>
                    {relationshipIntent === RelationshipIntent.FRIEND && (
                      <View style={[styles.radioButtonInner, { backgroundColor: colors.PRIMARY }]} />
                    )}
                  </View>
                  <Icon name="people-outline" size={24} color={colors.PRIMARY} />
                  <Text style={[styles.relationshipText, { color: colors.TEXT.PRIMARY }]}>
                    친구
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.relationshipOption,
                    { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
                    relationshipIntent === RelationshipIntent.ROMANTIC && { 
                      borderColor: colors.ERROR, 
                      borderWidth: 2,
                      backgroundColor: colors.ERROR + '10'
                    },
                  ]}
                  onPress={() => setRelationshipIntent(RelationshipIntent.ROMANTIC)}
                >
                  <View style={styles.radioButton}>
                    {relationshipIntent === RelationshipIntent.ROMANTIC && (
                      <View style={[styles.radioButtonInner, { backgroundColor: colors.ERROR }]} />
                    )}
                  </View>
                  <Icon name="heart-outline" size={24} color={colors.ERROR} />
                  <Text style={[styles.relationshipText, { color: colors.TEXT.PRIMARY }]}>
                    호감
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.relationshipHint, { color: colors.TEXT.TERTIARY }]}>
                같은 관계 유형끼리만 매칭됩니다
              </Text>
            </View>
          )}

          {/* 입력 필드 */}
          {selectedType && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                {t('interest:inputInfo')}
              </Text>
              {renderInputField()}
              
              {/* 이름 입력 필드 (옵션) */}
              <View style={styles.nameInputContainer}>
                <Text style={[styles.nameLabel, { color: colors.TEXT.SECONDARY }]}>
                  이름 (선택)
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                  placeholder="이름을 입력하세요 (선택사항)"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={name}
                  onChangeText={setName}
                />
                <Text style={[styles.nameHint, { color: colors.TEXT.TERTIARY }]}>
                  매칭 시 상대방이 확인할 수 있는 이름입니다
                </Text>
              </View>
            </View>
          )}

          {/* 만료일 설정 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              {t('interest:validDuration')}
            </Text>
            <View style={styles.subscriptionInfo}>
              <Icon 
                name={
                  subscriptionTier === SubscriptionTier.PREMIUM ? "star" :
                  subscriptionTier === SubscriptionTier.ADVANCED ? "star-outline" :
                  "information-circle-outline"
                } 
                size={20} 
                color={
                  subscriptionTier === SubscriptionTier.PREMIUM ? "#FFD700" :
                  subscriptionTier === SubscriptionTier.ADVANCED ? colors.PRIMARY :
                  colors.TEXT.SECONDARY
                } 
              />
              <Text style={[styles.subscriptionInfoText, { color: colors.TEXT.SECONDARY }]}>
                {subscriptionTier === SubscriptionTier.BASIC && t('interest:subscription.basic')}
                {subscriptionTier === SubscriptionTier.ADVANCED && t('interest:subscription.advanced')}
                {subscriptionTier === SubscriptionTier.PREMIUM && t('interest:subscription.premium')}
              </Text>
            </View>
            <View style={styles.durationOptions}>
              {subscriptionTier === SubscriptionTier.BASIC && (
                <TouchableOpacity
                  style={[
                    styles.durationOption,
                    { backgroundColor: colors.SURFACE, borderColor: colors.PRIMARY, borderWidth: 2 },
                  ]}
                  disabled
                >
                  <Text style={[styles.durationText, { color: colors.PRIMARY }]}>
                    {t('interest:subscription.duration3Days')}
                  </Text>
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => navigation.navigate('Premium' as never)}
                  >
                    <Text style={styles.upgradeButtonText}>{t('interest:buttons.upgrade')}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              
              {subscriptionTier === SubscriptionTier.ADVANCED && (
                <TouchableOpacity
                  style={[
                    styles.durationOption,
                    { backgroundColor: colors.SURFACE, borderColor: colors.PRIMARY, borderWidth: 2 },
                  ]}
                  disabled
                >
                  <Text style={[styles.durationText, { color: colors.PRIMARY }]}>
                    2주
                  </Text>
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => navigation.navigate('Premium' as never)}
                  >
                    <Text style={styles.upgradeButtonText}>프리미엄</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              
              {subscriptionTier === SubscriptionTier.PREMIUM && (
                <TouchableOpacity
                  style={[
                    styles.durationOption,
                    { backgroundColor: colors.PRIMARY + '10', borderColor: colors.PRIMARY, borderWidth: 2 },
                  ]}
                  disabled
                >
                  <Icon name="infinity" size={20} color={colors.PRIMARY} />
                  <Text style={[styles.durationText, { color: colors.PRIMARY, marginLeft: 8 }]}>
                    무제한
                  </Text>
                  <View style={[styles.premiumBadge, { backgroundColor: '#FFD700' }]}>
                    <Icon name="star" size={12} color="#FFFFFF" />
                    <Text style={styles.premiumText}>프리미엄</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={[styles.dateDisplay, { backgroundColor: colors.SURFACE }]}>
              <Icon name="calendar-outline" size={20} color={colors.TEXT.SECONDARY} />
              <Text style={[styles.dateText, { color: colors.TEXT.PRIMARY }]}>
                만료일: {expiresAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>
          </View>

          {/* 등록 버튼 */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.PRIMARY },
              (!selectedType || !value.trim() || loading) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedType || !value.trim() || loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? t('interest:buttons.registering') : t('interest:buttons.register')}
            </Text>
          </TouchableOpacity>

          {/* 안내 메시지 */}
          <View style={[styles.infoBox, { backgroundColor: colors.INFO + '20' }]}>
            <Icon name="information-circle-outline" size={20} color={colors.INFO} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.TEXT.PRIMARY }]}>
                {t('interest:info.title')}
              </Text>
              <Text style={[styles.infoText, { color: colors.TEXT.SECONDARY }]}>
                {t('interest:info.content')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker - 추후 구현 */}
      {/* {showDatePicker && (
        <DateTimePicker
          value={expiresAt || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setExpiresAt(date);
          }}
        />
      )} */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  typeCard: {
    width: '30%',
    marginHorizontal: '1.5%',
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // 드롭다운 스타일
  dropdownContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedPlatform: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  dropdownPlaceholder: {
    fontSize: 16,
  },
  dropdownOptions: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 12,
    elevation: 999,  // Android에서 높은 우선순위
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 9999,  // iOS에서 높은 우선순위
  },
  dropdownOptionsRelative: {
    borderWidth: 1,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 250,  // 최대 높이 제한
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  dropdownOptionText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  socialOptions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  socialOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  socialOptionActive: {
    borderWidth: 2,
  },
  socialOptionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  durationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 15,
    marginHorizontal: 5,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recommendText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  premiumBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  disabledOption: {
    opacity: 0.5,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
  },
  optionValue: {
    fontSize: 14,
  },
  submitButton: {
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  relationshipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  relationshipOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  relationshipText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  relationshipHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 5,
    marginLeft: 10,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 10,
  },
  nameInputContainer: {
    marginTop: 20,
  },
  nameLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  nameHint: {
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  subscriptionInfoText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  upgradeButton: {
    position: 'absolute',
    top: -8,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  birthdateContainer: {
    marginTop: 12,
  },
  birthdateLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  birthdateHint: {
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  additionalOptionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
  optionSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  additionalOptionsHint: {
    fontSize: 12,
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
    fontStyle: 'italic',
  },
});
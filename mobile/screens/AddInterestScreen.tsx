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
import { useAuthStore } from '@/store/slices/authSlice';
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from '@/types/subscription';
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

  const interestTypes = [
    { type: InterestType.PHONE, label: '전화번호', icon: 'call-outline', color: '#4CAF50' },
    { type: InterestType.EMAIL, label: '이메일', icon: 'mail-outline', color: '#2196F3' },
    { type: InterestType.SOCIAL_ID, label: '소셜 계정', icon: 'logo-instagram', color: '#E91E63' },
    { type: InterestType.NAME, label: '이름', icon: 'person-outline', color: '#9C27B0' },
    { type: InterestType.GROUP, label: '특정 그룹', icon: 'people-outline', color: '#9C27B0' },
    { type: InterestType.LOCATION, label: '장소', icon: 'location-outline', color: '#FF9800' },
    { type: InterestType.APPEARANCE, label: '인상착의', icon: 'body-outline', color: '#795548' },
    { type: InterestType.NICKNAME, label: '닉네임', icon: 'at-outline', color: '#607D8B' },
    { type: InterestType.COMPANY, label: '회사', icon: 'business-outline', color: '#3F51B5' },
    { type: InterestType.SCHOOL, label: '학교', icon: 'school-outline', color: '#00BCD4' },
    { type: InterestType.HOBBY, label: '취미/관심사', icon: 'heart-outline', color: '#F44336' },
    { type: InterestType.PLATFORM, label: '게임 플랫폼', icon: 'game-controller-outline', color: '#9C27B0' },
    { type: InterestType.GAME_ID, label: '게임 아이디', icon: 'gamepad-variant-outline', color: '#673AB7' },
  ];

  // 구독 티어에 따른 제한 확인
  const checkSubscriptionLimits = (type: InterestType): boolean => {
    // 프리미엄은 무제한
    if (subscriptionTier === SubscriptionTier.PREMIUM) return true;
    
    // 고급은 모든 유형 1개씩
    if (subscriptionTier === SubscriptionTier.ADVANCED) {
      const sameTypeSearches = searches.filter(s => s.type === type);
      if (sameTypeSearches.length >= 1) {
        Alert.alert(
          '등록 제한',
          '고급 구독자는 각 유형별로 1개씩만 등록 가능합니다.\n프리미엄으로 업그레이드하여 무제한 등록하세요!',
          [
            { text: '확인', style: 'cancel' },
            { text: '업그레이드', onPress: () => navigation.navigate('Premium' as never) }
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
        '등록 제한',
        '일반 사용자는 전화번호, 이메일, 소셜계정만 등록 가능합니다.\n더 많은 유형을 사용하려면 구독하세요!',
        [
          { text: '확인', style: 'cancel' },
          { text: '구독하기', onPress: () => navigation.navigate('Premium' as never) }
        ]
      );
      return false;
    }
    
    if (searches.length >= 3) {
      Alert.alert(
        '등록 제한',
        '일반 사용자는 최대 3개까지만 등록 가능합니다.\n더 많이 등록하려면 구독하세요!',
        [
          { text: '확인', style: 'cancel' },
          { text: '구독하기', onPress: () => navigation.navigate('Premium' as never) }
        ]
      );
      return false;
    }
    
    const sameTypeSearches = searches.filter(s => s.type === type);
    if (sameTypeSearches.length >= 1) {
      Alert.alert(
        '등록 제한',
        '일반 사용자는 각 유형별로 1개씩만 등록 가능합니다.',
        [{ text: '확인', style: 'cancel' }]
      );
      return false;
    }
    
    return true;
  };

  const handleSelectContact = async () => {
    // 연락처 기능은 추후 구현
    Alert.alert('알림', '연락처 연동 기능은 준비 중입니다.');
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
      Alert.alert('오류', '검색 유형을 선택해주세요');
      return;
    }

    if (!value.trim()) {
      Alert.alert('오류', '검색 값을 입력해주세요');
      return;
    }

    // 소셜 계정 타입일 때 플랫폼 필수 검증
    if (selectedType === InterestType.SOCIAL_ID && !metadata.platform) {
      Alert.alert('오류', '소셜 플랫폼을 선택해주세요');
      return;
    }

    // 게임 플랫폼 타입일 때 플랫폼 필수 검증
    if (selectedType === InterestType.PLATFORM && !metadata.platform) {
      Alert.alert('오류', '게임 플랫폼을 선택해주세요');
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
        metadata: searchMetadata,
        expiresAt: expiresAt?.toISOString(),
      });

      console.log('[AddInterestScreen] 관심상대 등록 성공, 화면 전환');
      // Alert 대신 바로 뒤로 이동
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('오류', error.message || '등록 중 오류가 발생했습니다');
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
              placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
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
              <Text style={styles.contactButtonText}>연락처에서 선택</Text>
            </TouchableOpacity>
          </View>
        );

      case InterestType.EMAIL:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="이메일을 입력하세요"
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
            {/* 게임 플랫폼 드롭다운 */}
            <View style={styles.dropdownContainer}>
              <Text style={[styles.inputLabel, { color: colors.TEXT.PRIMARY }]}>
                게임 플랫폼 선택 <Text style={{ color: colors.ERROR }}>*</Text>
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
                          metadata.platform === 'steam' ? 'logo-steam' :
                          metadata.platform === 'battlenet' ? 'game-controller-outline' :
                          metadata.platform === 'playstation' ? 'logo-playstation' :
                          metadata.platform === 'xbox' ? 'logo-xbox' :
                          metadata.platform === 'nintendo' ? 'game-controller-outline' :
                          metadata.platform === 'mobile' ? 'phone-portrait-outline' :
                          'game-controller-outline'
                        }
                        size={20}
                        color={colors.PRIMARY}
                      />
                      <Text style={[styles.dropdownText, { color: colors.TEXT.PRIMARY }]}>
                        {metadata.platform === 'steam' ? 'Steam' :
                         metadata.platform === 'battlenet' ? 'Battle.net' :
                         metadata.platform === 'playstation' ? 'PlayStation' :
                         metadata.platform === 'xbox' ? 'Xbox' :
                         metadata.platform === 'nintendo' ? 'Nintendo Switch' :
                         metadata.platform === 'mobile' ? '모바일 게임' :
                         metadata.platform}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.dropdownPlaceholder, { color: colors.TEXT.TERTIARY }]}>
                      게임 플랫폼을 선택하세요
                    </Text>
                  )}
                  <Icon 
                    name={metadata.showPlatformPicker ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.TEXT.SECONDARY} 
                  />
                </View>
              </TouchableOpacity>
              
              {/* 플랫폼 드롭다운 옵션 */}
              {metadata.showPlatformPicker && (
                <View style={[
                  styles.dropdownOptionsRelative, 
                  { 
                    backgroundColor: colors.SURFACE, 
                    borderColor: colors.BORDER,
                    borderTopWidth: 0,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    marginTop: -1,
                  }
                ]}>
                  {[
                    { id: 'steam', name: 'Steam', icon: 'logo-steam' },
                    { id: 'battlenet', name: 'Battle.net', icon: 'game-controller-outline' },
                    { id: 'playstation', name: 'PlayStation', icon: 'logo-playstation' },
                    { id: 'xbox', name: 'Xbox', icon: 'logo-xbox' },
                    { id: 'nintendo', name: 'Nintendo Switch', icon: 'game-controller-outline' },
                    { id: 'mobile', name: '모바일 게임', icon: 'phone-portrait-outline' },
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

            {!metadata.platform && (
              <Text style={[styles.errorText, { color: colors.ERROR }]}>
                게임 플랫폼을 먼저 선택해주세요
              </Text>
            )}
          </View>
        );

      case InterestType.GAME_ID:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="게임 아이디를 입력하세요 (예: PlayerName123)"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
              autoCapitalize="none"
            />
            <Text style={[styles.inputHint, { color: colors.TEXT.TERTIARY }]}>
              특수문자 및 공백 없이 입력해주세요
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
              관심상대 등록
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* 검색 유형 선택 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              검색 유형 선택
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

          {/* 입력 필드 */}
          {selectedType && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                검색 정보 입력
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
              검색 유효 기간
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
                {subscriptionTier === SubscriptionTier.BASIC && '일반: 3일'}
                {subscriptionTier === SubscriptionTier.ADVANCED && '고급: 2주'}
                {subscriptionTier === SubscriptionTier.PREMIUM && '프리미엄: 무제한'}
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
                    3일
                  </Text>
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => navigation.navigate('Premium' as never)}
                  >
                    <Text style={styles.upgradeButtonText}>업그레이드</Text>
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
              {loading ? '등록 중...' : '관심상대 등록'}
            </Text>
          </TouchableOpacity>

          {/* 안내 메시지 */}
          <View style={[styles.infoBox, { backgroundColor: colors.INFO + '20' }]}>
            <Icon name="information-circle-outline" size={20} color={colors.INFO} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.TEXT.PRIMARY }]}>
                매칭률을 높이는 방법
              </Text>
              <Text style={[styles.infoText, { color: colors.TEXT.SECONDARY }]}>
                • 정확한 정보를 입력해주세요{'\n'}
                • 특히 전화번호, 이메일은 정확해야 매칭됩니다{'\n'}
                • 등록한 조건과 일치하는 사용자가 있으면 자동 매칭됩니다{'\n'}
                • 매칭 전까지 모든 정보는 익명으로 보호됩니다
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
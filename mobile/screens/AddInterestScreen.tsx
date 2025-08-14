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
// import DateTimePicker from '@react-native-community/datetimepicker';
// import * as Contacts from 'expo-contacts';

/**
 * 관심상대 등록 화면
 */
export const AddInterestScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { createSearch } = useInterestStore();
  const { user } = useAuthStore();

  const [selectedType, setSelectedType] = useState<InterestType | null>(null);
  const [value, setValue] = useState('');
  const [name, setName] = useState(''); // 이름 필드 추가
  const [metadata, setMetadata] = useState<any>({});
  
  // 기본 만료일을 2주로 설정
  const getDefaultExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14); // 2주 후
    return date;
  };
  
  const [expiresAt, setExpiresAt] = useState<Date>(getDefaultExpiryDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<'1week' | '2weeks' | '1month' | 'custom'>('2weeks');

  const interestTypes = [
    { type: InterestType.PHONE, label: '전화번호', icon: 'call-outline', color: '#4CAF50' },
    { type: InterestType.EMAIL, label: '이메일', icon: 'mail-outline', color: '#2196F3' },
    { type: InterestType.SOCIAL_ID, label: '소셜 계정', icon: 'logo-instagram', color: '#E91E63' },
    { type: InterestType.GROUP, label: '특정 그룹', icon: 'people-outline', color: '#9C27B0' },
    { type: InterestType.LOCATION, label: '장소', icon: 'location-outline', color: '#FF9800' },
    { type: InterestType.APPEARANCE, label: '인상착의', icon: 'person-outline', color: '#795548' },
    { type: InterestType.NICKNAME, label: '닉네임', icon: 'at-outline', color: '#607D8B' },
    { type: InterestType.COMPANY, label: '회사', icon: 'business-outline', color: '#3F51B5' },
    { type: InterestType.SCHOOL, label: '학교', icon: 'school-outline', color: '#00BCD4' },
    { type: InterestType.HOBBY, label: '취미/관심사', icon: 'heart-outline', color: '#F44336' },
  ];

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

    setLoading(true);
    try {
      await createSearch({
        type: selectedType,
        value: value.trim(),
        metadata: {
          ...metadata,
          name: name.trim() || undefined, // 이름이 입력된 경우에만 포함
        },
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
            <TextInput
              style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
              placeholder="소셜 계정 ID를 입력하세요 (@제외)"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={value}
              onChangeText={setValue}
              autoCapitalize="none"
            />
            <View style={styles.socialOptions}>
              <TouchableOpacity
                style={[styles.socialOption, metadata.platform === 'instagram' && styles.socialOptionActive]}
                onPress={() => setMetadata({ ...metadata, platform: 'instagram' })}
              >
                <Icon name="logo-instagram" size={20} color={metadata.platform === 'instagram' ? colors.PRIMARY : colors.TEXT.SECONDARY} />
                <Text style={[styles.socialOptionText, { color: metadata.platform === 'instagram' ? colors.PRIMARY : colors.TEXT.SECONDARY }]}>
                  Instagram
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialOption, metadata.platform === 'kakao' && styles.socialOptionActive]}
                onPress={() => setMetadata({ ...metadata, platform: 'kakao' })}
              >
                <Icon name="chatbubble-ellipses-outline" size={20} color={metadata.platform === 'kakao' ? colors.PRIMARY : colors.TEXT.SECONDARY} />
                <Text style={[styles.socialOptionText, { color: metadata.platform === 'kakao' ? colors.PRIMARY : colors.TEXT.SECONDARY }]}>
                  KakaoTalk
                </Text>
              </TouchableOpacity>
            </View>
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
                  onPress={() => setSelectedType(item.type)}
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
            <View style={styles.durationOptions}>
              <TouchableOpacity
                style={[
                  styles.durationOption,
                  { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
                  selectedDuration === '1week' && { borderColor: colors.PRIMARY, borderWidth: 2 },
                ]}
                onPress={() => {
                  setSelectedDuration('1week');
                  const date = new Date();
                  date.setDate(date.getDate() + 7);
                  setExpiresAt(date);
                }}
              >
                <Text style={[styles.durationText, { color: selectedDuration === '1week' ? colors.PRIMARY : colors.TEXT.PRIMARY }]}>
                  1주일
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.durationOption,
                  { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
                  selectedDuration === '2weeks' && { borderColor: colors.PRIMARY, borderWidth: 2 },
                ]}
                onPress={() => {
                  setSelectedDuration('2weeks');
                  const date = new Date();
                  date.setDate(date.getDate() + 14);
                  setExpiresAt(date);
                }}
              >
                <Text style={[styles.durationText, { color: selectedDuration === '2weeks' ? colors.PRIMARY : colors.TEXT.PRIMARY }]}>
                  2주일
                </Text>
                <View style={[styles.recommendBadge, { backgroundColor: colors.PRIMARY }]}>
                  <Text style={styles.recommendText}>기본</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.durationOption,
                  { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
                  selectedDuration === '1month' && { borderColor: colors.PRIMARY, borderWidth: 2 },
                  !user?.isPremium && styles.disabledOption,
                ]}
                onPress={() => {
                  if (!user?.isPremium) {
                    Alert.alert('프리미엄 기능', '1개월 이상 설정은 프리미엄 회원만 가능합니다.');
                    return;
                  }
                  setSelectedDuration('1month');
                  const date = new Date();
                  date.setMonth(date.getMonth() + 1);
                  setExpiresAt(date);
                }}
                disabled={!user?.isPremium}
              >
                <Text style={[styles.durationText, { color: selectedDuration === '1month' ? colors.PRIMARY : colors.TEXT.PRIMARY }]}>
                  1개월
                </Text>
                {!user?.isPremium && (
                  <View style={[styles.premiumBadge, { backgroundColor: '#FFD700' }]}>
                    <Icon name="star" size={12} color="#FFFFFF" />
                    <Text style={styles.premiumText}>프리미엄</Text>
                  </View>
                )}
              </TouchableOpacity>
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
});
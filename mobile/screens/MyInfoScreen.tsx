import React, { useState, useEffect } from 'react';
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
import { useAuthStore } from '@/store/slices/authSlice';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MyInfo {
  realName: string; // 본명 (필수, 유일)
  profileNickname: string; // 프로필 닉네임 (필수, 유일)
  phone: string[];
  email: string[];
  nickname: string[]; // 검색용 닉네임들
  company: string[];
  school: string[];
  hobby: string[];
}

/**
 * 내 정보 등록/수정 화면
 */
export const MyInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { t } = useAndroidSafeTranslation('myinfo');
  
  const [myInfo, setMyInfo] = useState<MyInfo>({
    realName: user?.realName || '',
    profileNickname: user?.nickname || '',
    phone: [],
    email: [],
    nickname: [],
    company: [],
    school: [],
    hobby: [],
  });
  const [showInput, setShowInput] = useState<{[key: string]: boolean}>({
    realName: false,
    profileNickname: false,
    phone: false,
    email: false,
    nickname: false,
    company: false,
    school: false,
    hobby: false,
  });
  const [currentInputs, setCurrentInputs] = useState<{[key: string]: string}>({
    realName: '',
    profileNickname: '',
    phone: '',
    email: '',
    nickname: '',
    company: '',
    school: '',
    hobby: '',
  });

  useEffect(() => {
    loadMyInfo();
  }, []);

  const loadMyInfo = async () => {
    try {
      const storedInfo = await AsyncStorage.getItem('my-search-info');
      if (storedInfo) {
        const parsed = JSON.parse(storedInfo);
        setMyInfo({
          ...parsed,
          realName: parsed.realName || user?.realName || '',
        });
      } else if (user) {
        // 기본값으로 사용자 정보 설정
        const defaultInfo: MyInfo = {
          realName: user.realName || '',
          phone: user.phoneNumber ? [user.phoneNumber] : [],
          email: user.email ? [user.email] : [],
          nickname: user.nickname ? [user.nickname] : [],
          company: [],
          school: [],
          hobby: [],
        };
        setMyInfo(defaultInfo);
      }
    } catch (error) {
      console.error('Failed to load my info:', error);
    }
  };

  const addItem = async (key: keyof MyInfo) => {
    const value = currentInputs[key].trim();
    if (!value) {
      Alert.alert(t('common.notification'), t('alerts.valueRequired'));
      return;
    }
    
    if (key === 'realName' || key === 'profileNickname') {
      // 본명 또는 프로필 닉네임 수정
      const updatedInfo = {
        ...myInfo,
        [key]: value,
      };
      setMyInfo(updatedInfo);
      // 즉시 저장
      await AsyncStorage.setItem('my-search-info', JSON.stringify(updatedInfo));
      
      // 프로필 닉네임이 변경되면 authStore도 업데이트
      if (key === 'profileNickname' && user) {
        user.nickname = value;
      }
    } else {
      // 중복 체크
      if ((myInfo[key] as string[]).includes(value)) {
        Alert.alert(t('common.notification'), t('alerts.alreadyRegistered'));
        return;
      }
      
      const updatedInfo = {
        ...myInfo,
        [key]: [...(myInfo[key] as string[]), value],
      };
      setMyInfo(updatedInfo);
      // 즉시 저장
      await AsyncStorage.setItem('my-search-info', JSON.stringify(updatedInfo));
    }
    
    setCurrentInputs({
      ...currentInputs,
      [key]: '',
    });
    setShowInput({
      ...showInput,
      [key]: false,
    });
  };

  const removeItem = async (key: keyof MyInfo, index: number) => {
    if (key === 'realName') return; // 본명은 수정 불가
    
    const newList = [...(myInfo[key] as string[])];
    newList.splice(index, 1);
    const updatedInfo = {
      ...myInfo,
      [key]: newList,
    };
    setMyInfo(updatedInfo);
    // 즉시 저장
    await AsyncStorage.setItem('my-search-info', JSON.stringify(updatedInfo));
  };

  const infoFields = [
    {
      key: 'phone',
      label: t('fields.phone'),
      icon: 'call-outline',
      placeholder: '010-0000-0000',
      keyboardType: 'phone-pad' as const,
      color: '#4CAF50',
    },
    {
      key: 'email',
      label: t('fields.email'),
      icon: 'mail-outline',
      placeholder: 'example@gmail.com',
      keyboardType: 'email-address' as const,
      color: '#2196F3',
    },
    {
      key: 'nickname',
      label: t('fields.nickname'),
      icon: 'at-outline',
      placeholder: t('fields.nicknamePlaceholder'),
      keyboardType: 'default' as const,
      color: '#607D8B',
    },
    {
      key: 'company',
      label: t('fields.company'),
      icon: 'business-outline',
      placeholder: t('fields.companyPlaceholder'),
      keyboardType: 'default' as const,
      color: '#3F51B5',
    },
    {
      key: 'school',
      label: t('fields.school'),
      icon: 'school-outline',
      placeholder: t('fields.schoolPlaceholder'),
      keyboardType: 'default' as const,
      color: '#00BCD4',
    },
    {
      key: 'hobby',
      label: t('fields.hobby'),
      icon: 'heart-outline',
      placeholder: t('fields.hobbyPlaceholder'),
      keyboardType: 'default' as const,
      color: '#F44336',
    },
  ];

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
              {t('title')}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* 설명 */}
          <View style={[styles.descriptionBox, { backgroundColor: colors.SUCCESS + '15' }]}>
            <Icon name="information-circle" size={20} color={colors.SUCCESS} />
            <Text style={[styles.descriptionText, { color: colors.TEXT.PRIMARY }]}>
              {t('tips.title')}
            </Text>
            <Text style={[styles.descriptionSubtext, { color: colors.TEXT.SECONDARY }]}>
              {t('tips.content')}
            </Text>
          </View>

          {/* 정보 입력 필드 */}
          <View style={styles.fieldsContainer}>
            {/* 본명 필드 (필수) */}
            <View style={styles.fieldWrapper}>
              <View style={styles.fieldHeader}>
                <View style={[styles.fieldIcon, { backgroundColor: colors.PRIMARY + '20' }]}>
                  <Icon name="person" size={20} color={colors.PRIMARY} />
                </View>
                <Text style={[styles.fieldLabel, { color: colors.TEXT.PRIMARY }]}>
                  본명 (필수)
                </Text>
                {/* 본명 수정 버튼 */}
                {!showInput.realName && (
                  <TouchableOpacity
                    style={[styles.addFieldButton, { backgroundColor: colors.PRIMARY }]}
                    onPress={() => {
                      setShowInput({ ...showInput, realName: true });
                      setCurrentInputs({ ...currentInputs, realName: myInfo.realName });
                    }}
                  >
                    <Icon name="create-outline" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* 본명 표시 또는 입력 필드 */}
              {showInput.realName ? (
                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        color: colors.TEXT.PRIMARY,
                        backgroundColor: colors.SURFACE,
                        borderColor: colors.BORDER,
                        flex: 1,
                      },
                    ]}
                    placeholder={t('fields.realNamePlaceholder')}
                    placeholderTextColor={colors.TEXT.TERTIARY}
                    value={currentInputs.realName || ''}
                    onChangeText={(text) => setCurrentInputs({ ...currentInputs, realName: text })}
                    autoFocus={true}
                  />
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.PRIMARY }]}
                    onPress={() => addItem('realName')}
                  >
                    <Icon name="checkmark" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                    onPress={() => {
                      setShowInput({ ...showInput, realName: false });
                      setCurrentInputs({ ...currentInputs, realName: '' });
                    }}
                  >
                    <Icon name="close" size={20} color={colors.TEXT.SECONDARY} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.realNameField, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
                  <Text style={[styles.realNameText, { color: myInfo.realName ? colors.TEXT.PRIMARY : colors.TEXT.TERTIARY }]}>
                    {myInfo.realName || t('fields.realNamePrompt')}
                  </Text>
                </View>
              )}
            </View>

            {/* 프로필 닉네임 필드 (필수, 유일) */}
            <View style={styles.fieldWrapper}>
              <View style={styles.fieldHeader}>
                <View style={[styles.fieldIcon, { backgroundColor: colors.SUCCESS + '20' }]}>
                  <Icon name="at" size={20} color={colors.SUCCESS} />
                </View>
                <Text style={[styles.fieldLabel, { color: colors.TEXT.PRIMARY }]}>
                  프로필 닉네임 (필수)
                </Text>
                {/* 닉네임 수정 버튼 */}
                {!showInput.profileNickname && (
                  <TouchableOpacity
                    style={[styles.addFieldButton, { backgroundColor: colors.PRIMARY }]}
                    onPress={() => {
                      setShowInput({ ...showInput, profileNickname: true });
                      setCurrentInputs({ ...currentInputs, profileNickname: myInfo.profileNickname });
                    }}
                  >
                    <Icon name="create-outline" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* 닉네임 표시 또는 입력 필드 */}
              {showInput.profileNickname ? (
                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        color: colors.TEXT.PRIMARY,
                        backgroundColor: colors.SURFACE,
                        borderColor: colors.BORDER,
                        flex: 1,
                      },
                    ]}
                    placeholder={t('fields.profileNicknamePlaceholder')}
                    placeholderTextColor={colors.TEXT.TERTIARY}
                    value={currentInputs.profileNickname || ''}
                    onChangeText={(text) => setCurrentInputs({ ...currentInputs, profileNickname: text })}
                    autoFocus={true}
                  />
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.PRIMARY }]}
                    onPress={() => addItem('profileNickname')}
                  >
                    <Icon name="checkmark" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                    onPress={() => {
                      setShowInput({ ...showInput, profileNickname: false });
                      setCurrentInputs({ ...currentInputs, profileNickname: '' });
                    }}
                  >
                    <Icon name="close" size={20} color={colors.TEXT.SECONDARY} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.realNameField, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
                  <Text style={[styles.realNameText, { color: myInfo.profileNickname ? colors.TEXT.PRIMARY : colors.TEXT.TERTIARY }]}>
                    {myInfo.profileNickname || t('fields.profileNicknamePrompt')}
                  </Text>
                </View>
              )}
            </View>

            {infoFields.map((field) => (
              <View key={field.key} style={styles.fieldWrapper}>
                <View style={styles.fieldHeader}>
                  <View style={[styles.fieldIcon, { backgroundColor: field.color + '20' }]}>
                    <Icon name={field.icon} size={20} color={field.color} />
                  </View>
                  <Text style={[styles.fieldLabel, { color: colors.TEXT.PRIMARY }]}>
                    {field.label}
                  </Text>
                  {/* 추가 버튼 */}
                  <TouchableOpacity
                    style={[styles.addFieldButton, { backgroundColor: colors.PRIMARY }]}
                    onPress={() => setShowInput({ ...showInput, [field.key]: true })}
                  >
                    <Icon name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                {/* 등록된 항목 표시 */}
                {myInfo[field.key as keyof MyInfo].length > 0 && (
                  <View style={styles.itemsList}>
                    {myInfo[field.key as keyof MyInfo].map((item, index) => (
                      <View key={index} style={[styles.itemChip, { backgroundColor: colors.SURFACE }]}>
                        <Text style={[styles.itemText, { color: colors.TEXT.PRIMARY }]}>
                          {item}
                        </Text>
                        <TouchableOpacity onPress={() => removeItem(field.key as keyof MyInfo, index)}>
                          <Icon name="close-circle" size={18} color={colors.ERROR} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* 입력 필드 - + 버튼 클릭시에만 표시 */}
                {showInput[field.key] && (
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[
                        styles.input,
                        { 
                          color: colors.TEXT.PRIMARY,
                          backgroundColor: colors.SURFACE,
                          borderColor: colors.BORDER,
                          flex: 1,
                        },
                      ]}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.TEXT.TERTIARY}
                      value={currentInputs[field.key] || ''}
                      onChangeText={(text) => setCurrentInputs({ ...currentInputs, [field.key]: text })}
                      keyboardType={field.keyboardType}
                      autoCapitalize={field.key === 'email' ? 'none' : 'sentences'}
                      autoFocus={true}
                    />
                    <TouchableOpacity
                      style={[styles.addButton, { backgroundColor: colors.PRIMARY }]}
                      onPress={() => addItem(field.key as keyof MyInfo)}
                    >
                      <Icon name="checkmark" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cancelButton, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                      onPress={() => {
                        setShowInput({ ...showInput, [field.key]: false });
                        setCurrentInputs({ ...currentInputs, [field.key]: '' });
                      }}
                    >
                      <Icon name="close" size={20} color={colors.TEXT.SECONDARY} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* 프리미엄 프로모션 */}
          {!user?.isPremium && (
            <TouchableOpacity
              style={[styles.premiumPromo, { backgroundColor: '#FFD700' + '20' }]}
              onPress={() => navigation.navigate('Premium' as never)}
            >
              <Icon name="star" size={24} color="#FFD700" />
              <View style={styles.premiumPromoContent}>
                <Text style={[styles.premiumPromoTitle, { color: colors.TEXT.PRIMARY }]}>
                  프리미엄으로 업그레이드
                </Text>
                <Text style={[styles.premiumPromoText, { color: colors.TEXT.SECONDARY }]}>
                  더 많은 검색 옵션과 무제한 매칭을 즐기세요
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.TEXT.SECONDARY} />
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  descriptionBox: {
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 15,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 25,
  },
  descriptionSubtext: {
    fontSize: 13,
    lineHeight: 20,
    marginLeft: 25,
  },
  fieldsContainer: {
    paddingHorizontal: 20,
  },
  fieldWrapper: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  itemText: {
    fontSize: 14,
    marginRight: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
  },
  addFieldButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginLeft: 'auto',
  },
  realNameField: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  realNameText: {
    fontSize: 15,
    fontWeight: '500',
  },
  premiumPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
  },
  premiumPromoContent: {
    flex: 1,
    marginLeft: 12,
  },
  premiumPromoTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  premiumPromoText: {
    fontSize: 13,
  },
});
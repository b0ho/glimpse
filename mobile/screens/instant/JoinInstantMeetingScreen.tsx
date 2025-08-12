import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { RootNavigationProp, JoinInstantMeetingScreenProps } from '@/types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { useInstantMeetingStore } from '@/store/instantMeetingStore';
import { COLORS_EXTENDED as COLORS, FONTS, SIZES } from '@/utils/constants';

interface FeatureOption {
  label: string;
  value: string;
}

const UPPER_WEAR_OPTIONS: FeatureOption[] = [
  { label: '흰색', value: 'white' },
  { label: '검은색', value: 'black' },
  { label: '회색', value: 'gray' },
  { label: '네이비', value: 'navy' },
  { label: '베이지', value: 'beige' },
  { label: '빨간색', value: 'red' },
  { label: '파란색', value: 'blue' },
  { label: '기타', value: 'other' },
];

const LOWER_WEAR_OPTIONS: FeatureOption[] = [
  { label: '청바지', value: 'jeans' },
  { label: '면바지', value: 'cotton_pants' },
  { label: '반바지', value: 'shorts' },
  { label: '치마', value: 'skirt' },
  { label: '원피스', value: 'dress' },
  { label: '운동복', value: 'sportswear' },
  { label: '기타', value: 'other' },
];

export function JoinInstantMeetingScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<JoinInstantMeetingScreenProps['route']>();
  const { code } = route.params;
  const { joinMeetingWithFeatures } = useInstantMeetingStore();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  
  // 내 특징
  const [myUpperWear, setMyUpperWear] = useState('');
  const [myLowerWear, setMyLowerWear] = useState('');
  const [myGlasses, setMyGlasses] = useState<boolean | null>(null);
  const [mySpecialFeatures, setMySpecialFeatures] = useState('');
  
  // 찾는 사람 특징
  const [lookingUpperWear, setLookingUpperWear] = useState('');
  const [lookingLowerWear, setLookingLowerWear] = useState('');
  const [lookingGlasses, setLookingGlasses] = useState<boolean | null>(null);
  const [lookingSpecialFeatures, setLookingSpecialFeatures] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step === 1 && !nickname.trim()) {
      Alert.alert(t('common:status.notification'), t('instant:join.errors.enterNickname'));
      return;
    }
    
    if (step === 2 && (!myUpperWear || !myLowerWear)) {
      Alert.alert(t('common:status.notification'), t('instant:join.errors.requiredClothing'));
      return;
    }

    if (step === 3 && (!lookingUpperWear || !lookingLowerWear)) {
      Alert.alert(t('common:status.notification'), t('instant:join.errors.requiredTargetClothing'));
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const features = {
        myFeatures: {
          upperWear: myUpperWear,
          lowerWear: myLowerWear,
          glasses: myGlasses,
          specialFeatures: mySpecialFeatures.trim() || undefined,
        },
        lookingForFeatures: {
          upperWear: lookingUpperWear,
          lowerWear: lookingLowerWear,
          glasses: lookingGlasses,
          specialFeatures: lookingSpecialFeatures.trim() || undefined,
        },
      };

      await joinMeetingWithFeatures(code, nickname, features);
      
      navigation.replace('InstantMeeting');
    } catch (error) {
      Alert.alert(t('common:status.error'), t('instant:join.errors.joinFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('instant:join.step1.title')}</Text>
      <Text style={styles.stepDescription}>
        {t('instant:join.step1.description')}
      </Text>
      
      <TextInput
        style={styles.nicknameInput}
        placeholder={t('instant:join.step1.placeholder')}
        placeholderTextColor={COLORS.textLight}
        value={nickname}
        onChangeText={setNickname}
        autoFocus
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('instant:join.step2.title')}</Text>
      <Text style={styles.stepDescription}>
        {t('instant:join.step2.description')}
      </Text>

      <ScrollView style={styles.featureContainer}>
        {/* 상의 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('instant:join.clothing.upperWear')} *</Text>
          <View style={styles.optionGrid}>
            {UPPER_WEAR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  myUpperWear === option.value && styles.optionButtonActive
                ]}
                onPress={() => setMyUpperWear(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  myUpperWear === option.value && styles.optionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 하의 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>하의 *</Text>
          <View style={styles.optionGrid}>
            {LOWER_WEAR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  myLowerWear === option.value && styles.optionButtonActive
                ]}
                onPress={() => setMyLowerWear(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  myLowerWear === option.value && styles.optionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 안경 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>안경</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                myGlasses === true && styles.radioButtonActive
              ]}
              onPress={() => setMyGlasses(true)}
            >
              <Text style={[
                styles.radioText,
                myGlasses === true && styles.radioTextActive
              ]}>
                착용
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                myGlasses === false && styles.radioButtonActive
              ]}
              onPress={() => setMyGlasses(false)}
            >
              <Text style={[
                styles.radioText,
                myGlasses === false && styles.radioTextActive
              ]}>
                미착용
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 특별한 특징 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>특별한 특징</Text>
          <TextInput
            style={styles.textInput}
            placeholder="예: 노트북에 개발 스티커"
            placeholderTextColor={COLORS.textLight}
            value={mySpecialFeatures}
            onChangeText={setMySpecialFeatures}
          />
        </View>
      </ScrollView>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>찾는 사람 특징</Text>
      <Text style={styles.stepDescription}>
        만나고 싶은 사람의 특징을 입력해주세요
      </Text>

      <ScrollView style={styles.featureContainer}>
        {/* 상의 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('instant:join.clothing.upperWear')} *</Text>
          <View style={styles.optionGrid}>
            {UPPER_WEAR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  lookingUpperWear === option.value && styles.optionButtonActive
                ]}
                onPress={() => setLookingUpperWear(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  lookingUpperWear === option.value && styles.optionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 하의 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>하의 *</Text>
          <View style={styles.optionGrid}>
            {LOWER_WEAR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  lookingLowerWear === option.value && styles.optionButtonActive
                ]}
                onPress={() => setLookingLowerWear(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  lookingLowerWear === option.value && styles.optionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 안경 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>안경</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                lookingGlasses === true && styles.radioButtonActive
              ]}
              onPress={() => setLookingGlasses(true)}
            >
              <Text style={[
                styles.radioText,
                lookingGlasses === true && styles.radioTextActive
              ]}>
                착용
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                lookingGlasses === false && styles.radioButtonActive
              ]}
              onPress={() => setLookingGlasses(false)}
            >
              <Text style={[
                styles.radioText,
                lookingGlasses === false && styles.radioTextActive
              ]}>
                미착용
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                lookingGlasses === null && styles.radioButtonActive
              ]}
              onPress={() => setLookingGlasses(null)}
            >
              <Text style={[
                styles.radioText,
                lookingGlasses === null && styles.radioTextActive
              ]}>
                상관없음
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 특별한 특징 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>특별한 특징</Text>
          <TextInput
            style={styles.textInput}
            placeholder="예: 분홍색 텀블러"
            placeholderTextColor={COLORS.textLight}
            value={lookingSpecialFeatures}
            onChangeText={setLookingSpecialFeatures}
          />
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>즉석 모임 참가 ({step}/3)</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            isSubmitting && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={isSubmitting}
        >
          <Text style={styles.nextButtonText}>
            {isSubmitting ? '처리 중...' : step === 3 ? '완료' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding * 0.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    ...FONTS.h4,
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: SIZES.padding,
  },
  stepTitle: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SIZES.base,
    textAlign: 'center',
  },
  stepDescription: {
    ...FONTS.body3,
    color: COLORS.textLight,
    marginBottom: SIZES.padding * 2,
    textAlign: 'center',
    lineHeight: 22,
  },
  nicknameInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...FONTS.h3,
    color: COLORS.text,
    textAlign: 'center',
  },
  featureContainer: {
    flex: 1,
  },
  section: {
    marginBottom: SIZES.padding * 1.5,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SIZES.base / 2,
  },
  optionButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding * 0.75,
    paddingHorizontal: SIZES.padding,
    margin: SIZES.base / 2,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    ...FONTS.body3,
    color: COLORS.text,
  },
  optionTextActive: {
    color: COLORS.white,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: SIZES.padding,
  },
  radioButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  radioText: {
    ...FONTS.body3,
    color: COLORS.text,
  },
  radioTextActive: {
    color: COLORS.white,
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...FONTS.body3,
    color: COLORS.text,
  },
  footer: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useInstantMeetingStore } from '@/store/instantMeetingStore';
import { COLORS, FONTS, SIZES } from '@/utils/constants';

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

export function ExpressInterestScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { meetingId } = route.params as { meetingId: string };
  const { expressInterest } = useInstantMeetingStore();

  const [upperWear, setUpperWear] = useState('');
  const [lowerWear, setLowerWear] = useState('');
  const [glasses, setGlasses] = useState<boolean | null>(null);
  const [specialFeatures, setSpecialFeatures] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!upperWear || !lowerWear) {
      Alert.alert('알림', '상의와 하의 정보는 필수입니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const features = {
        upperWear,
        lowerWear,
        glasses,
        specialFeatures: specialFeatures.trim() || undefined,
      };

      const result = await expressInterest(meetingId, features);
      
      if (result.matchCount > 0) {
        Alert.alert(
          '매칭 성공! 🎉',
          `${result.matchCount}명과 매칭되었습니다.`,
          [
            { 
              text: '확인',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert(
          '호감 전달 완료',
          '상대방도 당신에게 호감을 표현하면 매칭이 성사됩니다.',
          [
            { 
              text: '확인',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('오류', '호감 표현 중 문제가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>호감 표현하기</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          마음에 드는 사람의 특징을 입력해주세요
        </Text>

        {/* 상의 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상의 색상 *</Text>
          <View style={styles.optionGrid}>
            {UPPER_WEAR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  upperWear === option.value && styles.optionButtonActive
                ]}
                onPress={() => setUpperWear(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  upperWear === option.value && styles.optionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 하의 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>하의 종류 *</Text>
          <View style={styles.optionGrid}>
            {LOWER_WEAR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  lowerWear === option.value && styles.optionButtonActive
                ]}
                onPress={() => setLowerWear(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  lowerWear === option.value && styles.optionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 안경 착용 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>안경</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                glasses === true && styles.radioButtonActive
              ]}
              onPress={() => setGlasses(true)}
            >
              <Text style={[
                styles.radioText,
                glasses === true && styles.radioTextActive
              ]}>
                착용
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                glasses === false && styles.radioButtonActive
              ]}
              onPress={() => setGlasses(false)}
            >
              <Text style={[
                styles.radioText,
                glasses === false && styles.radioTextActive
              ]}>
                미착용
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioButton,
                glasses === null && styles.radioButtonActive
              ]}
              onPress={() => setGlasses(null)}
            >
              <Text style={[
                styles.radioText,
                glasses === null && styles.radioTextActive
              ]}>
                상관없음
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 특별한 특징 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>특별한 특징 (선택)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="예: 맥북에 개발 스티커 많음"
            placeholderTextColor={COLORS.textLight}
            value={specialFeatures}
            onChangeText={setSpecialFeatures}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!upperWear || !lowerWear || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!upperWear || !lowerWear || isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '전송 중...' : '호감 보내기'}
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
    ...FONTS.h3,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
  },
  description: {
    ...FONTS.body3,
    color: COLORS.textLight,
    marginBottom: SIZES.padding * 1.5,
    textAlign: 'center',
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
});
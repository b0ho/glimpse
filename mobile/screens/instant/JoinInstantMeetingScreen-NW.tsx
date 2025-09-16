import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { RootNavigationProp, JoinInstantMeetingScreenProps } from '@/types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { useInstantMeetingStore } from '@/store/instantMeetingStore';

interface FeatureOption {
  label: string;
  value: string;
}

export function JoinInstantMeetingScreen() {
  const navigation = useNavigation<RootNavigationProp>();
  const route = useRoute<JoinInstantMeetingScreenProps['route']>();
  const { code } = route.params;
  const { joinMeetingWithFeatures } = useInstantMeetingStore();
  const { t } = useAndroidSafeTranslation();

  const UPPER_WEAR_OPTIONS: FeatureOption[] = [
    { label: t('instant:join.clothing.colors.white'), value: 'white' },
    { label: t('instant:join.clothing.colors.black'), value: 'black' },
    { label: t('instant:join.clothing.colors.gray'), value: 'gray' },
    { label: t('instant:join.clothing.colors.navy'), value: 'navy' },
    { label: t('instant:join.clothing.colors.beige'), value: 'beige' },
    { label: t('instant:join.clothing.colors.red'), value: 'red' },
    { label: t('instant:join.clothing.colors.blue'), value: 'blue' },
    { label: t('instant:join.clothing.colors.other'), value: 'other' },
  ];

  const LOWER_WEAR_OPTIONS: FeatureOption[] = [
    { label: t('instant:join.clothing.types.jeans'), value: 'jeans' },
    { label: t('instant:join.clothing.types.cotton_pants'), value: 'cotton_pants' },
    { label: t('instant:join.clothing.types.shorts'), value: 'shorts' },
    { label: t('instant:join.clothing.types.skirt'), value: 'skirt' },
    { label: t('instant:join.clothing.types.dress'), value: 'dress' },
    { label: t('instant:join.clothing.types.sportswear'), value: 'sportswear' },
    { label: t('instant:join.clothing.types.other'), value: 'other' },
  ];

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
      Alert.alert(t('common:notification'), t('instant:join.errors.enterNickname'));
      return;
    }
    
    if (step === 2 && (!myUpperWear || !myLowerWear)) {
      Alert.alert(t('common:notification'), t('instant:join.errors.requiredClothing'));
      return;
    }

    if (step === 3 && (!lookingUpperWear || !lookingLowerWear)) {
      Alert.alert(t('common:notification'), t('instant:join.errors.requiredTargetClothing'));
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
      Alert.alert(t('common:error'), t('instant:join.errors.joinFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <View className="flex-1 p-4">
      <Text className="text-gray-900 dark:text-white text-2xl font-bold text-center mb-3">
        {t('instant:join.step1.title')}
      </Text>
      <Text className="text-gray-600 dark:text-gray-400 text-sm text-center mb-8 leading-6">
        {t('instant:join.step1.description')}
      </Text>
      
      <TextInput
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-lg text-gray-900 dark:text-white text-center"
        placeholder={t('instant:join.step1.placeholder')}
        placeholderTextColor="#9CA3AF"
        value={nickname}
        onChangeText={setNickname}
        autoFocus
      />
    </View>
  );

  const renderStep2 = () => (
    <View className="flex-1 p-4">
      <Text className="text-gray-900 dark:text-white text-2xl font-bold text-center mb-3">
        {t('instant:join.step2.title')}
      </Text>
      <Text className="text-gray-600 dark:text-gray-400 text-sm text-center mb-8 leading-6">
        {t('instant:join.step2.description')}
      </Text>

      <ScrollView className="flex-1">
        {/* 상의 */}
        <View className="mb-6">
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-4">
            {t('instant:join.clothing.upperWear')} *
          </Text>
          <View className="flex-row flex-wrap -mx-1">
            {UPPER_WEAR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`bg-white dark:bg-gray-800 border rounded-lg py-3 px-4 m-1 ${
                  myUpperWear === option.value 
                    ? 'border-blue-500 bg-blue-500 dark:bg-blue-600' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onPress={() => setMyUpperWear(option.value)}
              >
                <Text
                  className={`text-sm ${
                    myUpperWear === option.value 
                      ? 'text-white' 
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 하의 */}
        <View className="mb-6">
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-4">하의 *</Text>
          <View className="flex-row flex-wrap -mx-1">
            {LOWER_WEAR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`bg-white dark:bg-gray-800 border rounded-lg py-3 px-4 m-1 ${
                  myLowerWear === option.value 
                    ? 'border-blue-500 bg-blue-500 dark:bg-blue-600' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onPress={() => setMyLowerWear(option.value)}
              >
                <Text
                  className={`text-sm ${
                    myLowerWear === option.value 
                      ? 'text-white' 
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 안경 */}
        <View className="mb-6">
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-4">
            {t('instant:join.glasses.title')}
          </Text>
          <View className="flex-row gap-4">
            <TouchableOpacity
              className={`flex-1 bg-white dark:bg-gray-800 border rounded-lg py-4 items-center ${
                myGlasses === true 
                  ? 'border-blue-500 bg-blue-500 dark:bg-blue-600' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onPress={() => setMyGlasses(true)}
            >
              <Text
                className={`text-sm ${
                  myGlasses === true 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {t('instant:join.glasses.wearing')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 bg-white dark:bg-gray-800 border rounded-lg py-4 items-center ${
                myGlasses === false 
                  ? 'border-blue-500 bg-blue-500 dark:bg-blue-600' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onPress={() => setMyGlasses(false)}
            >
              <Text
                className={`text-sm ${
                  myGlasses === false 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {t('instant:join.glasses.notWearing')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 특별한 특징 */}
        <View className="mb-6">
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-4">
            {t('instant:join.features.title')}
          </Text>
          <TextInput
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-900 dark:text-white"
            placeholder={t('instant:join.features.myPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={mySpecialFeatures}
            onChangeText={setMySpecialFeatures}
          />
        </View>
      </ScrollView>
    </View>
  );

  const renderStep3 = () => (
    <View className="flex-1 p-4">
      <Text className="text-gray-900 dark:text-white text-2xl font-bold text-center mb-3">
        {t('instant:join.step3.title')}
      </Text>
      <Text className="text-gray-600 dark:text-gray-400 text-sm text-center mb-8 leading-6">
        {t('instant:join.step3.description')}
      </Text>

      <ScrollView className="flex-1">
        {/* 상의 */}
        <View className="mb-6">
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-4">
            {t('instant:join.clothing.upperWear')} *
          </Text>
          <View className="flex-row flex-wrap -mx-1">
            {UPPER_WEAR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`bg-white dark:bg-gray-800 border rounded-lg py-3 px-4 m-1 ${
                  lookingUpperWear === option.value 
                    ? 'border-blue-500 bg-blue-500 dark:bg-blue-600' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onPress={() => setLookingUpperWear(option.value)}
              >
                <Text
                  className={`text-sm ${
                    lookingUpperWear === option.value 
                      ? 'text-white' 
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 하의 */}
        <View className="mb-6">
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-4">하의 *</Text>
          <View className="flex-row flex-wrap -mx-1">
            {LOWER_WEAR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`bg-white dark:bg-gray-800 border rounded-lg py-3 px-4 m-1 ${
                  lookingLowerWear === option.value 
                    ? 'border-blue-500 bg-blue-500 dark:bg-blue-600' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onPress={() => setLookingLowerWear(option.value)}
              >
                <Text
                  className={`text-sm ${
                    lookingLowerWear === option.value 
                      ? 'text-white' 
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 안경 */}
        <View className="mb-6">
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-4">
            {t('instant:join.glasses.title')}
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 bg-white dark:bg-gray-800 border rounded-lg py-4 items-center ${
                lookingGlasses === true 
                  ? 'border-blue-500 bg-blue-500 dark:bg-blue-600' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onPress={() => setLookingGlasses(true)}
            >
              <Text
                className={`text-sm ${
                  lookingGlasses === true 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {t('instant:join.glasses.wearing')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 bg-white dark:bg-gray-800 border rounded-lg py-4 items-center ${
                lookingGlasses === false 
                  ? 'border-blue-500 bg-blue-500 dark:bg-blue-600' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onPress={() => setLookingGlasses(false)}
            >
              <Text
                className={`text-sm ${
                  lookingGlasses === false 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {t('instant:join.glasses.notWearing')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 bg-white dark:bg-gray-800 border rounded-lg py-4 items-center ${
                lookingGlasses === null 
                  ? 'border-blue-500 bg-blue-500 dark:bg-blue-600' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onPress={() => setLookingGlasses(null)}
            >
              <Text
                className={`text-sm ${
                  lookingGlasses === null 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {t('instant:join.glasses.doesntMatter')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 특별한 특징 */}
        <View className="mb-6">
          <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-4">
            {t('instant:join.features.title')}
          </Text>
          <TextInput
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-900 dark:text-white"
            placeholder={t('instant:join.features.targetPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={lookingSpecialFeatures}
            onChangeText={setLookingSpecialFeatures}
          />
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
          <Icon name="arrow-back" size={24} className="text-gray-900 dark:text-white" />
        </TouchableOpacity>
        <Text className="text-gray-900 dark:text-white text-lg font-semibold">
          {t('instant:join.title', { step })}
        </Text>
        <View className="w-6" />
      </View>

      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </KeyboardAvoidingView>

      <View className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          className={`bg-blue-500 dark:bg-blue-600 rounded-lg py-4 items-center ${
            isSubmitting ? 'opacity-50' : ''
          }`}
          onPress={handleNext}
          disabled={isSubmitting}
        >
          <Text className="text-white text-lg font-semibold">
            {isSubmitting 
              ? t('instant:join.processing') 
              : step === 3 
                ? t('instant:join.complete') 
                : t('instant:join.next')
            }
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
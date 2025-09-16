import React, { useState, useEffect } from 'react';
import {
  View,
  Text
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { usePersonaStore } from '@/store/slices/personaSlice';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { locationTracker } from '@/services/locationTracker';

interface PersonaSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PersonaSettingsModal: React.FC<PersonaSettingsModalProps> = ({ visible, onClose }) => {
  const { t } = useAndroidSafeTranslation('persona');
  const { colors } = useTheme();
  const { 
    myPersona, 
    createOrUpdatePersona, 
    isLoading, 
    fetchMyPersona,
    locationSharingEnabled,
    setLocationSharing 
  } = usePersonaStore();

  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [occupation, setOccupation] = useState('');
  const [height, setHeight] = useState('');
  const [mbti, setMbti] = useState('');
  const [drinking, setDrinking] = useState('');
  const [smoking, setSmoking] = useState('');
  const [shareLocation, setShareLocation] = useState(false);

  useEffect(() => {
    if (visible && !myPersona) {
      fetchMyPersona();
    }
    setShareLocation(locationSharingEnabled);
  }, [visible, locationSharingEnabled]);

  useEffect(() => {
    if (myPersona) {
      setNickname(myPersona.nickname || '');
      setAge(myPersona.age?.toString() || '');
      setBio(myPersona.bio || '');
      setInterests(myPersona.interests?.join(', ') || '');
      setOccupation(myPersona.occupation || '');
      setHeight(myPersona.height?.toString() || '');
      setMbti(myPersona.mbti || '');
      setDrinking(myPersona.drinking || '');
      setSmoking(myPersona.smoking || '');
    }
  }, [myPersona]);

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert(t('error'), t('nicknameRequired'));
      return;
    }

    try {
      await createOrUpdatePersona({
        nickname: nickname.trim(),
        age: age ? parseInt(age) : undefined,
        bio: bio.trim() || undefined,
        interests: interests ? interests.split(',').map(i => i.trim()).filter(Boolean) : undefined,
        occupation: occupation.trim() || undefined,
        height: height ? parseInt(height) : undefined,
        mbti: mbti.trim() || undefined,
        drinking: drinking.trim() || undefined,
        smoking: smoking.trim() || undefined,
      });

      // 위치 공유 설정 업데이트
      setLocationSharing(shareLocation);
      
      // 위치 추적 시작/중지
      if (shareLocation) {
        await locationTracker.startTracking();
      } else {
        await locationTracker.stopTracking();
      }

      Alert.alert(t('success'), t('savedSuccessfully'));
      onClose();
    } catch (error) {
      Alert.alert(t('error'), t('saveFailed'));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="modalContainer"
      >
        <View className="content">
          {/* Header */}
          <View className="header">
            <Text className="title">
              {t('settingsTitle')}
            </Text>
            <TouchableOpacity onPress={onClose} className="closeButton">
              <Ionicons name="close" size={24} color={colors.TEXT.PRIMARY} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView className="form" showsVerticalScrollIndicator={false}>
            {/* Required Field */}
            <View className="inputGroup">
              <Text className="label">
                {t('nickname')} *
              </Text>
              <TextInput
                className="input"
                value={nickname}
                onChangeText={setNickname}
                placeholder={t('nicknamePlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
                maxLength={20}
              />
              <Text className="hint">
                {t('nicknameHint')}
              </Text>
            </View>

            {/* Optional Fields */}
            <View className="inputGroup">
              <Text className="label">
                {t('age')}
              </Text>
              <TextInput
                className="input"
                value={age}
                onChangeText={setAge}
                placeholder={t('agePlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View className="inputGroup">
              <Text className="label">
                {t('bio')}
              </Text>
              <TextInput
                className="textArea"
                value={bio}
                onChangeText={setBio}
                placeholder={t('bioPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View className="inputGroup">
              <Text className="label">
                {t('interests')}
              </Text>
              <TextInput
                className="input"
                value={interests}
                onChangeText={setInterests}
                placeholder={t('interestsPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
              />
              <Text className="hint">
                {t('interestsHint')}
              </Text>
            </View>

            <View className="inputGroup">
              <Text className="label">
                {t('occupation')}
              </Text>
              <TextInput
                className="input"
                value={occupation}
                onChangeText={setOccupation}
                placeholder={t('occupationPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
              />
            </View>

            <View className="inputGroup">
              <Text className="label">
                {t('height')}
              </Text>
              <TextInput
                className="input"
                value={height}
                onChangeText={setHeight}
                placeholder={t('heightPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View className="inputGroup">
              <Text className="label">
                {t('mbti')}
              </Text>
              <TextInput
                className="input"
                value={mbti}
                onChangeText={setMbti}
                placeholder={t('mbtiPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
                maxLength={4}
                autoCapitalize="characters"
              />
            </View>

            <View className="inputGroup">
              <Text className="label">
                {t('drinking')}
              </Text>
              <TextInput
                className="input"
                value={drinking}
                onChangeText={setDrinking}
                placeholder={t('drinkingPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
              />
            </View>

            <View className="inputGroup">
              <Text className="label">
                {t('smoking')}
              </Text>
              <TextInput
                className="input"
                value={smoking}
                onChangeText={setSmoking}
                placeholder={t('smokingPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
              />
            </View>

            {/* 위치 공유 토글 */}
            <View className="locationShareGroup">
              <View className="locationShareInfo">
                <Ionicons name="location" size={20} color={colors.PRIMARY} />
                <View className="locationShareText">
                  <Text className="locationShareTitle">
                    위치 공유
                  </Text>
                  <Text className="locationShareDesc">
                    앱 사용 중 5분마다 위치를 업데이트하여 근처 사용자에게 표시됩니다
                  </Text>
                </View>
              </View>
              <Switch
                value={shareLocation}
                onValueChange={setShareLocation}
                trackColor={{ false: colors.TEXT.LIGHT, true: colors.PRIMARY }}
                thumbColor={shareLocation ? colors.PRIMARY : colors.TEXT.SECONDARY}
              />
            </View>

            <View className="buttonContainer">
              <TouchableOpacity
                className="cancelButton"
                onPress={onClose}
              >
                <Text className="cancelButtonText">
                  {t('common:buttons.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="saveButton"
                onPress={handleSave}
                disabled={isLoading}
              >
                <Text className="saveButtonText">
                  {isLoading ? t('common:status.loading') : t('common:buttons.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};


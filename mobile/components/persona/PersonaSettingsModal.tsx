import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { useTranslation } from 'react-i18next';
import { usePersonaStore } from '@/store/slices/personaSlice';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { locationTracker } from '@/services/locationTracker';

interface PersonaSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PersonaSettingsModal: React.FC<PersonaSettingsModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation('persona');
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
        style={styles.modalContainer}
      >
        <View style={[styles.content, { backgroundColor: colors.SURFACE }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
            <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>
              {t('settingsTitle')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.TEXT.PRIMARY} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Required Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
                {t('nickname')} *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                value={nickname}
                onChangeText={setNickname}
                placeholder={t('nicknamePlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
                maxLength={20}
              />
              <Text style={[styles.hint, { color: colors.TEXT.LIGHT }]}>
                {t('nicknameHint')}
              </Text>
            </View>

            {/* Optional Fields */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
                {t('age')}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                value={age}
                onChangeText={setAge}
                placeholder={t('agePlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
                {t('bio')}
              </Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                value={bio}
                onChangeText={setBio}
                placeholder={t('bioPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
                {t('interests')}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                value={interests}
                onChangeText={setInterests}
                placeholder={t('interestsPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
              />
              <Text style={[styles.hint, { color: colors.TEXT.LIGHT }]}>
                {t('interestsHint')}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
                {t('occupation')}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                value={occupation}
                onChangeText={setOccupation}
                placeholder={t('occupationPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
                {t('height')}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                value={height}
                onChangeText={setHeight}
                placeholder={t('heightPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
                {t('mbti')}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                value={mbti}
                onChangeText={setMbti}
                placeholder={t('mbtiPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
                maxLength={4}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
                {t('drinking')}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                value={drinking}
                onChangeText={setDrinking}
                placeholder={t('drinkingPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
                {t('smoking')}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                value={smoking}
                onChangeText={setSmoking}
                placeholder={t('smokingPlaceholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
              />
            </View>

            {/* 위치 공유 토글 */}
            <View style={[styles.locationShareGroup, { backgroundColor: colors.PRIMARY + '10', borderColor: colors.PRIMARY + '30' }]}>
              <View style={styles.locationShareInfo}>
                <Ionicons name="location" size={20} color={colors.PRIMARY} />
                <View style={styles.locationShareText}>
                  <Text style={[styles.locationShareTitle, { color: colors.TEXT.PRIMARY }]}>
                    위치 공유
                  </Text>
                  <Text style={[styles.locationShareDesc, { color: colors.TEXT.SECONDARY }]}>
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

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.BACKGROUND }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: colors.TEXT.PRIMARY }]}>
                  {t('common:buttons.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.PRIMARY }]}
                onPress={handleSave}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
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

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.MD,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: SPACING.MD,
  },
  inputGroup: {
    marginBottom: SPACING.MD,
  },
  label: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
    marginBottom: SPACING.XS,
  },
  input: {
    borderRadius: 8,
    padding: SPACING.SM,
    fontSize: FONT_SIZES.MD,
  },
  textArea: {
    borderRadius: 8,
    padding: SPACING.SM,
    fontSize: FONT_SIZES.MD,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: FONT_SIZES.XS,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.SM,
    marginTop: SPACING.LG,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  locationShareGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 12,
    borderWidth: 1,
  },
  locationShareInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationShareText: {
    marginLeft: SPACING.SM,
    flex: 1,
  },
  locationShareTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationShareDesc: {
    fontSize: FONT_SIZES.XS,
    lineHeight: 16,
  },
});
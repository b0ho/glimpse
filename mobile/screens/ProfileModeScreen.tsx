import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/slices/authSlice';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { apiClient } from '@/services/api/config';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

interface PersonaProfile {
  nickname?: string;
  age?: number;
  bio?: string;
  profileImage?: string;
}

export const ProfileModeScreen = React.memo(() => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user, updateUser } = useAuthStore();
  const { t } = useAndroidSafeTranslation();
  
  const [profileMode, setProfileMode] = useState<'real' | 'persona'>('real');
  const [personaProfile, setPersonaProfile] = useState<PersonaProfile>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfileMode();
  }, []);

  const loadProfileMode = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const data = await apiClient.get('/location/profile-mode');
      
      setProfileMode(data.mode || 'real');
      if (data.personaProfile) {
        setPersonaProfile(data.personaProfile);
      }
    } catch (error) {
      console.error('Load profile mode error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = async (mode: 'real' | 'persona') => {
    if (mode === 'persona' && !personaProfile.nickname) {
      setIsEditing(true);
      setProfileMode(mode);
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/location/profile-mode', {
        mode,
        personaData: mode === 'persona' ? personaProfile : undefined,
      });
      
      setProfileMode(mode);
      Alert.alert(
        t('profilemode:alerts.modeChanged'),
        mode === 'real' 
          ? t('profilemode:alerts.realModeMessage')
          : t('profilemode:alerts.personaModeMessage')
      );
    } catch (error) {
      console.error('Change profile mode error:', error);
      Alert.alert(t('profilemode:alerts.error'), t('profilemode:alerts.modeChangeError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePersona = async () => {
    if (!personaProfile.nickname) {
      Alert.alert(t('profilemode:alerts.enterNickname'), t('profilemode:alerts.enterNickname'));
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/location/profile-mode', {
        mode: 'persona',
        personaData: personaProfile,
      });
      
      setIsEditing(false);
      Alert.alert(t('profilemode:alerts.success'), t('profilemode:alerts.personaSaved'));
    } catch (error) {
      console.error('Save persona error:', error);
      Alert.alert(t('profilemode:alerts.error'), t('profilemode:alerts.personaSaveError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !personaProfile.nickname) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('profilemode:title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 모드 선택 섹션 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              {t('profilemode:profileDisplayMode')}
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.TEXT.SECONDARY }]}>
              {t('profilemode:selectProfileDescription')}
            </Text>

            <TouchableOpacity
              style={[
                styles.modeCard,
                { 
                  backgroundColor: colors.SURFACE, 
                  borderColor: profileMode === 'real' ? colors.PRIMARY : colors.BORDER,
                  borderWidth: profileMode === 'real' ? 2 : 1,
                }
              ]}
              onPress={() => handleModeChange('real')}
              disabled={isLoading}
            >
              <View style={styles.modeCardContent}>
                <Icon 
                  name="person-circle" 
                  size={48} 
                  color={profileMode === 'real' ? colors.PRIMARY : colors.TEXT.SECONDARY} 
                />
                <View style={styles.modeCardInfo}>
                  <Text style={[styles.modeCardTitle, { color: colors.TEXT.PRIMARY }]}>
                    {t('profilemode:realProfile.title')}
                  </Text>
                  <Text style={[styles.modeCardDescription, { color: colors.TEXT.SECONDARY }]}>
                    {t('profilemode:realProfile.description')}
                  </Text>
                </View>
              </View>
              {profileMode === 'real' && (
                <View style={[styles.selectedBadge, { backgroundColor: colors.PRIMARY }]}>
                  <Icon name="checkmark" size={16} color={colors.TEXT.WHITE} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                { 
                  backgroundColor: colors.SURFACE, 
                  borderColor: profileMode === 'persona' ? colors.PRIMARY : colors.BORDER,
                  borderWidth: profileMode === 'persona' ? 2 : 1,
                }
              ]}
              onPress={() => handleModeChange('persona')}
              disabled={isLoading}
            >
              <View style={styles.modeCardContent}>
                <Icon 
                  name="mask" 
                  size={48} 
                  color={profileMode === 'persona' ? colors.PRIMARY : colors.TEXT.SECONDARY} 
                />
                <View style={styles.modeCardInfo}>
                  <Text style={[styles.modeCardTitle, { color: colors.TEXT.PRIMARY }]}>
                    {t('profilemode:personaProfile.title')}
                  </Text>
                  <Text style={[styles.modeCardDescription, { color: colors.TEXT.SECONDARY }]}>
                    {t('profilemode:personaProfile.description')}
                  </Text>
                </View>
              </View>
              {profileMode === 'persona' && (
                <View style={[styles.selectedBadge, { backgroundColor: colors.PRIMARY }]}>
                  <Icon name="checkmark" size={16} color={colors.TEXT.WHITE} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* 페르소나 프로필 편집 섹션 */}
          {profileMode === 'persona' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                  {t('profilemode:personaProfile.title')}
                </Text>
                {!isEditing && (
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={[styles.editButton, { backgroundColor: colors.PRIMARY }]}
                  >
                    <Icon name="pencil" size={16} color={colors.TEXT.WHITE} />
                    <Text style={[styles.editButtonText, { color: colors.TEXT.WHITE }]}>
                      {t('profilemode:buttons.edit')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.personaCard, { backgroundColor: colors.SURFACE }]}>
                {isEditing ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
                        {t('profilemode:labels.nickname')}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          { 
                            backgroundColor: colors.BACKGROUND,
                            color: colors.TEXT.PRIMARY,
                            borderColor: colors.BORDER,
                          }
                        ]}
                        value={personaProfile.nickname}
                        onChangeText={(text) => setPersonaProfile({ ...personaProfile, nickname: text })}
                        placeholder={t('profilemode:placeholders.nickname')}
                        placeholderTextColor={colors.TEXT.LIGHT}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
                        {t('profilemode:labels.age')}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          { 
                            backgroundColor: colors.BACKGROUND,
                            color: colors.TEXT.PRIMARY,
                            borderColor: colors.BORDER,
                          }
                        ]}
                        value={personaProfile.age?.toString()}
                        onChangeText={(text) => setPersonaProfile({ ...personaProfile, age: parseInt(text) || undefined })}
                        placeholder={t('profilemode:placeholders.age')}
                        placeholderTextColor={colors.TEXT.LIGHT}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
                        {t('profilemode:labels.bio')}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.textArea,
                          { 
                            backgroundColor: colors.BACKGROUND,
                            color: colors.TEXT.PRIMARY,
                            borderColor: colors.BORDER,
                          }
                        ]}
                        value={personaProfile.bio}
                        onChangeText={(text) => setPersonaProfile({ ...personaProfile, bio: text })}
                        placeholder={t('profilemode:placeholders.bio')}
                        placeholderTextColor={colors.TEXT.LIGHT}
                        multiline
                        numberOfLines={3}
                      />
                    </View>

                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: colors.BORDER }]}
                        onPress={() => {
                          setIsEditing(false);
                          loadProfileMode();
                        }}
                      >
                        <Text style={[styles.cancelButtonText, { color: colors.TEXT.SECONDARY }]}>
                          {t('profilemode:buttons.cancel')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.PRIMARY }]}
                        onPress={handleSavePersona}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color={colors.TEXT.WHITE} />
                        ) : (
                          <Text style={[styles.saveButtonText, { color: colors.TEXT.WHITE }]}>
                            {t('profilemode:buttons.save')}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.personaAvatar, { backgroundColor: colors.PRIMARY }]}>
                      <Icon name="mask" size={32} color={colors.TEXT.WHITE} />
                    </View>
                    <Text style={[styles.personaNickname, { color: colors.TEXT.PRIMARY }]}>
                      {personaProfile.nickname || t('profilemode:personaProfile.notSet')}
                    </Text>
                    {personaProfile.age && (
                      <Text style={[styles.personaAge, { color: colors.TEXT.SECONDARY }]}>
                        {t('profilemode:age', { age: personaProfile.age })}
                      </Text>
                    )}
                    {personaProfile.bio && (
                      <Text style={[styles.personaBio, { color: colors.TEXT.SECONDARY }]}>
                        {personaProfile.bio}
                      </Text>
                    )}
                  </>
                )}
              </View>
            </View>
          )}

          {/* 안내 섹션 */}
          <View style={[styles.infoCard, { backgroundColor: colors.INFO + '10' }]}>
            <Icon name="information-circle" size={20} color={colors.INFO} />
            <Text style={[styles.infoText, { color: colors.TEXT.SECONDARY }]}>
              {t('profilemode:info.description')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.MD,
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    marginBottom: SPACING.XS,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.SM,
    marginBottom: SPACING.MD,
  },
  modeCard: {
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    position: 'relative',
  },
  modeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeCardInfo: {
    flex: 1,
    marginLeft: SPACING.MD,
  },
  modeCardTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeCardDescription: {
    fontSize: FONT_SIZES.SM,
  },
  selectedBadge: {
    position: 'absolute',
    top: SPACING.SM,
    right: SPACING.SM,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    marginLeft: 4,
  },
  personaCard: {
    borderRadius: 12,
    padding: SPACING.MD,
    alignItems: 'center',
  },
  personaAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.MD,
  },
  personaNickname: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    marginBottom: SPACING.XS,
  },
  personaAge: {
    fontSize: FONT_SIZES.MD,
    marginBottom: SPACING.SM,
  },
  personaBio: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputGroup: {
    width: '100%',
    marginBottom: SPACING.MD,
  },
  inputLabel: {
    fontSize: FONT_SIZES.SM,
    marginBottom: SPACING.XS,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    fontSize: FONT_SIZES.MD,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: SPACING.MD,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    marginLeft: SPACING.SM,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: SPACING.MD,
    marginTop: SPACING.MD,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.SM,
    lineHeight: 20,
    marginLeft: SPACING.SM,
  },
});
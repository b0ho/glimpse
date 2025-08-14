import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/slices/authSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { useTheme } from '@/hooks/useTheme';
import { GroupType, Group } from '@/types';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { groupApi } from '@/services/api/groupApi';

/**
 * 그룹 생성 폼 데이터 인터페이스
 * @interface GroupFormData
 * @property {string} name - 그룹 이름
 * @property {string} description - 그룹 설명
 * @property {GroupType} type - 그룹 유형
 * @property {number} minimumMembers - 최소 참여 인원
 * @property {boolean} isPrivate - 비공개 여부
 * @property {Object} [location] - 위치 정보 (장소 그룹의 경우)
 * @property {Date} [expiresAt] - 만료 날짜 (이벤트 그룹의 경우)
 */
interface GroupFormData {
  name: string;
  description: string;
  type: GroupType;
  minimumMembers: number;
  isPrivate: boolean;
  location?: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  expiresAt?: Date;
}

/**
 * 그룹 생성 화면 컴포넌트
 * @component
 * @returns {JSX.Element} 그룹 생성 화면 UI
 * @description 새로운 그룹을 생성하기 위한 폼 화면
 */
export const CreateGroupScreen = () => {
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    type: GroupType.CREATED,
    minimumMembers: 6,
    isPrivate: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [errors, setErrors] = useState<Partial<GroupFormData>>({});
  
  const navigation = useNavigation<any>();
  const authStore = useAuthStore();
  const groupStore = useGroupStore();
  const { t } = useTranslation(['group', 'common']);
  const { colors } = useTheme();

  /**
   * 폼 유효성 검사
   * @returns {boolean} 유효성 검사 통과 여부
   * @description 그룹 생성 폼의 필수 필드와 제약 조건을 검사
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<GroupFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('group:createGroup.validation.nameRequired');
    } else if (formData.name.length < 2) {
      newErrors.name = t('group:createGroup.validation.nameMinLength');
    } else if (formData.name.length > 30) {
      newErrors.name = t('group:createGroup.validation.nameMaxLength');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('group:createGroup.validation.descriptionRequired');
    } else if (formData.description.length < 10) {
      newErrors.description = t('group:createGroup.validation.descriptionMinLength');
    } else if (formData.description.length > 200) {
      newErrors.description = t('group:createGroup.validation.descriptionMaxLength');
    }

    if (formData.minimumMembers < 4) {
      newErrors.minimumMembers = 4;
    } else if (formData.minimumMembers > 100) {
      newErrors.minimumMembers = 100;
    }

    if (formData.type === GroupType.LOCATION && !formData.location?.address.trim()) {
      newErrors.location = { address: t('group:createGroup.validation.locationRequired') };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 그룹 생성 제출 핸들러
   * @returns {Promise<void>}
   * @description 폼 유효성 검사 후 API를 통해 그룹 생성
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(t('group:createGroup.errors.inputError'), t('group:createGroup.errors.fillAllFields'));
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('[CreateGroupScreen] 그룹 생성 시도:', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
      });
      
      // API 호출하여 그룹 생성
      const newGroup = await groupApi.createGroup({
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        settings: {
          requiresApproval: false,
          allowInvites: true,
          isPrivate: formData.isPrivate,
        },
        location: formData.type === GroupType.LOCATION && formData.location?.address ? {
          address: formData.location.address,
          latitude: formData.location.latitude,
          longitude: formData.location.longitude,
        } : undefined,
      });
      
      console.log('[CreateGroupScreen] 그룹 생성 성공:', newGroup);

      // 로컬 스토어에 추가
      console.log('[CreateGroupScreen] 로컬 스토어에 그룹 추가 시도');
      groupStore.createGroup(newGroup);
      console.log('[CreateGroupScreen] 로컬 스토어에 그룹 추가 완료');

      // 성공 시 즉시 그룹 화면으로 이동
      console.log('[CreateGroupScreen] 그룹 생성 성공 - 그룹 화면으로 이동');
      navigation.goBack();
      
      // 성공 알림은 나중에 표시 (옵션)
      setTimeout(() => {
        Alert.alert(
          t('group:createGroup.success.title'),
          t('group:createGroup.success.message', { name: newGroup.name })
        );
      }, 500);
    } catch (error: any) {
      console.error('[CreateGroupScreen] 그룹 생성 오류:', error);
      console.error('[CreateGroupScreen] 에러 스택:', error.stack);
      console.error('[CreateGroupScreen] 에러 상세:', JSON.stringify(error, null, 2));
      const errorMessage = error?.message || error?.response?.data?.message || t('group:createGroup.errors.createFailed');
      Alert.alert(t('group:createGroup.errors.createFailedTitle'), errorMessage);
    } finally {
      console.log('[CreateGroupScreen] finally 블록 실행 - isSubmitting을 false로 설정');
      setIsSubmitting(false);
    }
  };

  /**
   * 그룹 타입 선택기 렌더링
   * @returns {JSX.Element | null} 그룹 타입 선택기 모달 UI
   * @description 그룹 타입을 선택할 수 있는 모달을 표시
   */
  const renderGroupTypePicker = () => {
    if (!showTypePicker) return null;

    const groupTypes = [
      { type: GroupType.CREATED, name: t('group:groupTypes.created'), desc: t('group:groupTypes.createdDesc') },
      { type: GroupType.LOCATION, name: t('group:groupTypes.location'), desc: t('group:groupTypes.locationDesc') },
      { type: GroupType.INSTANCE, name: t('group:groupTypes.instance'), desc: t('group:groupTypes.instanceDesc') },
    ];

    return (
      <View style={[styles.pickerOverlay, { backgroundColor: colors.OVERLAY }]}>
        <View style={[styles.pickerModal, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.pickerTitle, { color: colors.TEXT.PRIMARY }]}>{t('group:createGroup.selectGroupType')}</Text>
          {groupTypes.map(({ type, name, desc }) => (
            <TouchableOpacity
              key={type}
              style={[styles.pickerItem, { borderBottomColor: colors.BORDER }]}
              onPress={() => {
                setFormData(prev => ({ ...prev, type }));
                setShowTypePicker(false);
              }}
            >
              <Text style={[styles.pickerItemName, { color: colors.TEXT.PRIMARY }]}>{name}</Text>
              <Text style={[styles.pickerItemDesc, { color: colors.TEXT.SECONDARY }]}>{desc}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.pickerCancelButton, { backgroundColor: colors.TEXT.LIGHT }]}
            onPress={() => setShowTypePicker(false)}
          >
            <Text style={[styles.pickerCancelText, { color: colors.TEXT.PRIMARY }]}>{t('common:buttons.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * 그룹 타입 이름 반환
   * @param {GroupType} type - 그룹 타입
   * @returns {string} 한글 그룹 타입명
   * @description 그룹 타입을 한글 이름으로 변환
   */
  const getGroupTypeName = (type: GroupType): string => {
    switch (type) {
      case GroupType.CREATED:
        return t('group:groupTypes.created');
      case GroupType.LOCATION:
        return t('group:groupTypes.location');
      case GroupType.INSTANCE:
        return t('group:groupTypes.instance');
      case GroupType.OFFICIAL:
        return t('group:groupTypes.official');
      default:
        return t('group:groupTypes.general');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.headerButtonText, { color: colors.TEXT.SECONDARY }]}>{t('common:buttons.cancel')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('group:createGroup.title')}</Text>
        <TouchableOpacity
          style={[
            styles.headerButton,
            [styles.submitButton, { backgroundColor: colors.PRIMARY }],
            (!formData.name.trim() || !formData.description.trim()) && [styles.submitButtonDisabled, { backgroundColor: colors.TEXT.LIGHT }],
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !formData.name.trim() || !formData.description.trim()}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.TEXT.WHITE} />
          ) : (
            <Text style={[styles.submitButtonText, { color: colors.TEXT.WHITE }]}>{t('group:createGroup.create')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.BACKGROUND }]}>
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.TEXT.PRIMARY }]}>{t('group:createGroup.groupName')} *</Text>
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.SURFACE, borderColor: colors.BORDER, color: colors.TEXT.PRIMARY },
              errors.name && [styles.textInputError, { borderColor: colors.ERROR }]
            ]}
            placeholder={t('group:createGroup.groupNamePlaceholder')}
            placeholderTextColor={colors.TEXT.LIGHT}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            maxLength={30}
          />
          {errors.name && <Text style={[styles.errorText, { color: colors.ERROR }]}>{errors.name}</Text>}
          <Text style={[styles.characterCount, { color: colors.TEXT.LIGHT }]}>{formData.name.length}/30</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.TEXT.PRIMARY }]}>{t('group:createGroup.groupDescription')} *</Text>
          <TextInput
            style={[
              styles.textAreaInput,
              { backgroundColor: colors.SURFACE, borderColor: colors.BORDER, color: colors.TEXT.PRIMARY },
              errors.description && [styles.textInputError, { borderColor: colors.ERROR }]
            ]}
            placeholder={t('group:createGroup.groupDescriptionPlaceholder')}
            placeholderTextColor={colors.TEXT.LIGHT}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />
          {errors.description && <Text style={[styles.errorText, { color: colors.ERROR }]}>{errors.description}</Text>}
          <Text style={[styles.characterCount, { color: colors.TEXT.LIGHT }]}>{formData.description.length}/200</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.TEXT.PRIMARY }]}>{t('group:createGroup.groupType')}</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={[styles.pickerButtonText, { color: colors.TEXT.PRIMARY }]}>{getGroupTypeName(formData.type)}</Text>
            <Text style={[styles.pickerButtonArrow, { color: colors.TEXT.SECONDARY }]}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {formData.type === GroupType.LOCATION && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.TEXT.PRIMARY }]}>{t('group:createGroup.location')} *</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.SURFACE, borderColor: colors.BORDER, color: colors.TEXT.PRIMARY },
                errors.location?.address && [styles.textInputError, { borderColor: colors.ERROR }]
              ]}
              placeholder={t('group:createGroup.locationPlaceholder')}
              placeholderTextColor={colors.TEXT.LIGHT}
              value={formData.location?.address || ''}
              onChangeText={(text) => 
                setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, address: text }
                }))
              }
            />
            {errors.location?.address && (
              <Text style={[styles.errorText, { color: colors.ERROR }]}>{errors.location.address}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.TEXT.PRIMARY }]}>{t('group:createGroup.minimumMembers')}</Text>
          <View style={styles.numberInputContainer}>
            <TouchableOpacity
              style={[styles.numberButton, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              onPress={() => 
                setFormData(prev => ({ 
                  ...prev, 
                  minimumMembers: Math.max(4, prev.minimumMembers - 2) 
                }))
              }
            >
              <Text style={[styles.numberButtonText, { color: colors.PRIMARY }]}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.numberDisplay, { color: colors.TEXT.PRIMARY }]}>{formData.minimumMembers}{t('group:createGroup.people')}</Text>
            <TouchableOpacity
              style={[styles.numberButton, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              onPress={() => 
                setFormData(prev => ({ 
                  ...prev, 
                  minimumMembers: Math.min(100, prev.minimumMembers + 2) 
                }))
              }
            >
              <Text style={[styles.numberButtonText, { color: colors.PRIMARY }]}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.helperText, { color: colors.TEXT.SECONDARY }]}>
            {t('group:createGroup.minimumMembersHelper')}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <View>
              <Text style={[styles.switchLabel, { color: colors.TEXT.PRIMARY }]}>{t('group:createGroup.privateGroup')}</Text>
              <Text style={[styles.switchDescription, { color: colors.TEXT.SECONDARY }]}>
                {t('group:createGroup.privateGroupDesc')}
              </Text>
            </View>
            <Switch
              value={formData.isPrivate}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, isPrivate: value }))
              }
              trackColor={{ false: colors.TEXT.LIGHT, true: colors.PRIMARY }}
            />
          </View>
        </View>

        <View style={[styles.guidelines, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
          <Text style={[styles.guidelinesTitle, { color: colors.TEXT.PRIMARY }]}>{t('group:createGroup.guidelines.title')}</Text>
          <Text style={[styles.guidelinesText, { color: colors.TEXT.SECONDARY }]}>
            {t('group:createGroup.guidelines.content')}
          </Text>
        </View>
      </ScrollView>

      {renderGroupTypePicker()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  headerButtonText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.TEXT.LIGHT,
  },
  submitButtonText: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
  },
  textAreaInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
    minHeight: 100,
  },
  textInputError: {
    borderColor: COLORS.ERROR,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
    marginTop: SPACING.XS,
  },
  errorText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.ERROR,
    marginTop: SPACING.XS,
  },
  helperText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SPACING.XS,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: SPACING.MD,
  },
  pickerButtonText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
  },
  pickerButtonArrow: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  numberDisplay: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginHorizontal: SPACING.XL,
    minWidth: 80,
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  switchDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  guidelines: {
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.MD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginTop: SPACING.LG,
  },
  guidelinesTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  guidelinesText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 20,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.LG,
    width: '85%',
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  pickerItem: {
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  pickerItemName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  pickerItemDesc: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  pickerCancelButton: {
    marginTop: SPACING.MD,
    padding: SPACING.MD,
    backgroundColor: COLORS.TEXT.LIGHT,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
  },
});
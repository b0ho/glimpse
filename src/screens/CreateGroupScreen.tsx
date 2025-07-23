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
import { useAuthStore } from '@/store/slices/authSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { GroupType, Group } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

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

export const CreateGroupScreen: React.FC = () => {
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
  
  const navigation = useNavigation();
  const authStore = useAuthStore();
  const groupStore = useGroupStore();

  const validateForm = (): boolean => {
    const newErrors: Partial<GroupFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = '그룹 이름을 입력해주세요';
    } else if (formData.name.length < 2) {
      newErrors.name = '그룹 이름은 최소 2글자 이상이어야 합니다';
    } else if (formData.name.length > 30) {
      newErrors.name = '그룹 이름은 30글자를 초과할 수 없습니다';
    }

    if (!formData.description.trim()) {
      newErrors.description = '그룹 설명을 입력해주세요';
    } else if (formData.description.length < 10) {
      newErrors.description = '그룹 설명은 최소 10글자 이상이어야 합니다';
    } else if (formData.description.length > 200) {
      newErrors.description = '그룹 설명은 200글자를 초과할 수 없습니다';
    }

    if (formData.minimumMembers < 4) {
      newErrors.minimumMembers = 4;
    } else if (formData.minimumMembers > 100) {
      newErrors.minimumMembers = 100;
    }

    if (formData.type === GroupType.LOCATION && !formData.location?.address.trim()) {
      newErrors.location = { address: '장소를 입력해주세요' };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('입력 오류', '모든 필드를 올바르게 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newGroup: Group = {
        id: `group_${Date.now()}`,
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim(),
        memberCount: 1, // 생성자가 첫 멤버
        maleCount: authStore.user?.id ? 1 : 0, // TODO: 실제 성별 정보
        femaleCount: 0,
        minimumMembers: formData.minimumMembers,
        isMatchingActive: false, // 최소 인원 달성 후 활성화
        location: formData.location && formData.location.address ? {
          ...formData.location,
          latitude: formData.location.latitude || 0,
          longitude: formData.location.longitude || 0,
        } : undefined,
        expiresAt: formData.expiresAt,
        createdBy: authStore.user?.id || 'current_user',
        createdAt: new Date(),
      };

      // 로컬 스토어에 추가
      groupStore.createGroup(newGroup);

      Alert.alert(
        '그룹 생성 완료! 🎉',
        `"${newGroup.name}" 그룹이 성공적으로 생성되었습니다.\n다른 사용자들이 참여하면 매칭이 활성화됩니다.`,
        [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Group creation error:', error);
      Alert.alert('오류', '그룹 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGroupTypePicker = () => {
    if (!showTypePicker) return null;

    const groupTypes = [
      { type: GroupType.CREATED, name: '생성 그룹', desc: '취미나 관심사 기반 그룹' },
      { type: GroupType.LOCATION, name: '장소 그룹', desc: '특정 장소 기반 그룹' },
      { type: GroupType.INSTANCE, name: '이벤트 그룹', desc: '일회성 이벤트 그룹' },
    ];

    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerModal}>
          <Text style={styles.pickerTitle}>그룹 유형 선택</Text>
          {groupTypes.map(({ type, name, desc }) => (
            <TouchableOpacity
              key={type}
              style={styles.pickerItem}
              onPress={() => {
                setFormData(prev => ({ ...prev, type }));
                setShowTypePicker(false);
              }}
            >
              <Text style={styles.pickerItemName}>{name}</Text>
              <Text style={styles.pickerItemDesc}>{desc}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.pickerCancelButton}
            onPress={() => setShowTypePicker(false)}
          >
            <Text style={styles.pickerCancelText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getGroupTypeName = (type: GroupType): string => {
    switch (type) {
      case GroupType.CREATED:
        return '생성 그룹';
      case GroupType.LOCATION:
        return '장소 그룹';
      case GroupType.INSTANCE:
        return '이벤트 그룹';
      case GroupType.OFFICIAL:
        return '공식 그룹';
      default:
        return '일반 그룹';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerButtonText}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>새 그룹 만들기</Text>
        <TouchableOpacity
          style={[
            styles.headerButton,
            styles.submitButton,
            (!formData.name.trim() || !formData.description.trim()) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !formData.name.trim() || !formData.description.trim()}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={COLORS.TEXT.WHITE} />
          ) : (
            <Text style={styles.submitButtonText}>생성</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>그룹 이름 *</Text>
          <TextInput
            style={[styles.textInput, errors.name && styles.textInputError]}
            placeholder="그룹 이름을 입력해주세요"
            placeholderTextColor={COLORS.TEXT.LIGHT}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            maxLength={30}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          <Text style={styles.characterCount}>{formData.name.length}/30</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>그룹 설명 *</Text>
          <TextInput
            style={[styles.textAreaInput, errors.description && styles.textInputError]}
            placeholder="그룹에 대해 자세히 설명해주세요"
            placeholderTextColor={COLORS.TEXT.LIGHT}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          <Text style={styles.characterCount}>{formData.description.length}/200</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>그룹 유형</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={styles.pickerButtonText}>{getGroupTypeName(formData.type)}</Text>
            <Text style={styles.pickerButtonArrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {formData.type === GroupType.LOCATION && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>장소 *</Text>
            <TextInput
              style={[
                styles.textInput, 
                errors.location?.address && styles.textInputError
              ]}
              placeholder="예: 강남역 스타벅스"
              placeholderTextColor={COLORS.TEXT.LIGHT}
              value={formData.location?.address || ''}
              onChangeText={(text) => 
                setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, address: text }
                }))
              }
            />
            {errors.location?.address && (
              <Text style={styles.errorText}>{errors.location.address}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>최소 참여 인원</Text>
          <View style={styles.numberInputContainer}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => 
                setFormData(prev => ({ 
                  ...prev, 
                  minimumMembers: Math.max(4, prev.minimumMembers - 2) 
                }))
              }
            >
              <Text style={styles.numberButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.numberDisplay}>{formData.minimumMembers}명</Text>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => 
                setFormData(prev => ({ 
                  ...prev, 
                  minimumMembers: Math.min(100, prev.minimumMembers + 2) 
                }))
              }
            >
              <Text style={styles.numberButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            매칭이 활성화되려면 최소 이 인원이 필요합니다
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <View>
              <Text style={styles.switchLabel}>비공개 그룹</Text>
              <Text style={styles.switchDescription}>
                초대받은 사용자만 참여할 수 있습니다
              </Text>
            </View>
            <Switch
              value={formData.isPrivate}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, isPrivate: value }))
              }
              trackColor={{ false: COLORS.TEXT.LIGHT, true: COLORS.PRIMARY }}
            />
          </View>
        </View>

        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>그룹 생성 가이드라인</Text>
          <Text style={styles.guidelinesText}>
            • 건전하고 긍정적인 목적의 그룹을 만들어주세요{'\n'}
            • 차별적이거나 부적절한 내용은 금지됩니다{'\n'}
            • 그룹 이름과 설명은 명확하고 이해하기 쉽게 작성해주세요{'\n'}
            • 최소 인원이 달성되면 자동으로 매칭이 활성화됩니다{'\n'}
            • 그룹 관리자는 부적절한 멤버를 제재할 수 있습니다
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
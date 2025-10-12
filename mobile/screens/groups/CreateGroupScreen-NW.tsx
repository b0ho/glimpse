/**
 * 그룹 생성 화면
 *
 * @screen
 * @description 사용자가 새로운 그룹을 생성할 수 있는 화면으로, 그룹 이름, 설명, 유형, 최소 인원, 비공개 여부 등을 설정
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuthStore } from '@/store/slices/authSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { GroupType, Group } from '@/types';
import { groupApi } from '@/services/api/groupApi';
import { cn } from '@/lib/utils';

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
 *
 * @component
 * @returns {JSX.Element}
 *
 * @description
 * 새로운 그룹을 생성하기 위한 폼 화면
 * - 그룹 이름 및 설명 입력 (필수)
 * - 그룹 타입 선택 (일반/장소/이벤트)
 * - 최소 참여 인원 설정 (4-100명)
 * - 비공개 그룹 여부 설정
 * - 장소 그룹의 경우 위치 정보 입력
 * - 실시간 입력 유효성 검사 및 피드백
 *
 * @navigation
 * - From: 그룹 탭, 그룹 목록 화면의 그룹 생성 버튼
 * - To: 생성 완료 후 그룹 목록 화면으로 이동
 *
 * @example
 * ```tsx
 * <Stack.Screen
 *   name="CreateGroup"
 *   component={CreateGroupScreen}
 *   options={{ title: '그룹 만들기' }}
 * />
 * ```
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
  const { t } = useAndroidSafeTranslation('group');

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
      <View className="absolute inset-0 bg-black/50 justify-center items-center">
        <View className={cn(
          "w-4/5 max-h-3/4 rounded-xl p-6",
          "bg-white dark:bg-gray-800"
        )}>
          <Text className={cn(
            "text-lg font-bold text-center mb-4",
            "text-gray-900 dark:text-white"
          )}>
            {t('group:createGroup.selectGroupType')}
          </Text>
          {groupTypes.map(({ type, name, desc }) => (
            <TouchableOpacity
              key={type}
              className={cn(
                "p-4 border-b",
                "border-gray-200 dark:border-gray-700"
              )}
              onPress={() => {
                setFormData(prev => ({ ...prev, type }));
                setShowTypePicker(false);
              }}
            >
              <Text className={cn(
                "text-base font-semibold",
                "text-gray-900 dark:text-white"
              )}>
                {name}
              </Text>
              <Text className={cn(
                "text-sm mt-1",
                "text-gray-600 dark:text-gray-300"
              )}>
                {desc}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            className={cn(
              "mt-4 p-4 rounded-lg items-center",
              "bg-gray-200 dark:bg-gray-600"
            )}
            onPress={() => setShowTypePicker(false)}
          >
            <Text className={cn(
              "text-base",
              "text-gray-900 dark:text-white"
            )}>
              {t('common:buttons.cancel')}
            </Text>
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
    <SafeAreaView className={cn(
      "flex-1",
      "bg-white dark:bg-gray-900"
    )}>
      <View className={cn(
        "flex-row justify-between items-center px-4 py-2 border-b",
        "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      )}>
        <TouchableOpacity
          className="px-4 py-2"
          onPress={() => navigation.goBack()}
        >
          <Text className={cn(
            "text-base",
            "text-gray-600 dark:text-gray-300"
          )}>
            {t('common:buttons.cancel')}
          </Text>
        </TouchableOpacity>
        <Text className={cn(
          "text-lg font-bold",
          "text-gray-900 dark:text-white"
        )}>
          {t('group:createGroup.title')}
        </Text>
        <TouchableOpacity
          className={cn(
            "px-4 py-2 rounded-lg",
            (!formData.name.trim() || !formData.description.trim())
              ? "bg-gray-300 dark:bg-gray-600"
              : "bg-blue-500"
          )}
          onPress={handleSubmit}
          disabled={isSubmitting || !formData.name.trim() || !formData.description.trim()}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white text-base font-semibold">
              {t('group:createGroup.create')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className={cn(
        "flex-1 p-4",
        "bg-white dark:bg-gray-900"
      )}>
        <View className="mb-6">
          <Text className={cn(
            "text-base font-semibold mb-2",
            "text-gray-900 dark:text-white"
          )}>
            {t('group:createGroup.groupName')} *
          </Text>
          <TextInput
            className={cn(
              "rounded-lg border px-4 py-4 text-base",
              errors.name ? "border-red-500" : "border-gray-200 dark:border-gray-600",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            )}
            placeholder={t('group:createGroup.groupNamePlaceholder')}
            placeholderTextColor="#6B7280"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            maxLength={30}
          />
          {errors.name && <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>}
          <Text className={cn(
            "text-right text-xs mt-1",
            "text-gray-500 dark:text-gray-400"
          )}>
            {formData.name.length}/30
          </Text>
        </View>

        <View className="mb-6">
          <Text className={cn(
            "text-base font-semibold mb-2",
            "text-gray-900 dark:text-white"
          )}>
            {t('group:createGroup.groupDescription')} *
          </Text>
          <TextInput
            className={cn(
              "rounded-lg border px-4 py-4 text-base min-h-24",
              errors.description ? "border-red-500" : "border-gray-200 dark:border-gray-600",
              "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            )}
            placeholder={t('group:createGroup.groupDescriptionPlaceholder')}
            placeholderTextColor="#6B7280"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />
          {errors.description && <Text className="text-red-500 text-sm mt-1">{errors.description}</Text>}
          <Text className={cn(
            "text-right text-xs mt-1",
            "text-gray-500 dark:text-gray-400"
          )}>
            {formData.description.length}/200
          </Text>
        </View>

        <View className="mb-6">
          <Text className={cn(
            "text-base font-semibold mb-2",
            "text-gray-900 dark:text-white"
          )}>
            {t('group:createGroup.groupType')}
          </Text>
          <TouchableOpacity
            className={cn(
              "flex-row justify-between items-center rounded-lg border px-4 py-4",
              "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
            )}
            onPress={() => setShowTypePicker(true)}
          >
            <Text className={cn(
              "text-base",
              "text-gray-900 dark:text-white"
            )}>
              {getGroupTypeName(formData.type)}
            </Text>
            <Text className={cn(
              "text-base",
              "text-gray-600 dark:text-gray-300"
            )}>
              {'>'}
            </Text>
          </TouchableOpacity>
        </View>

        {formData.type === GroupType.LOCATION && (
          <View className="mb-6">
            <Text className={cn(
              "text-base font-semibold mb-2",
              "text-gray-900 dark:text-white"
            )}>
              {t('group:createGroup.location')} *
            </Text>
            <TextInput
              className={cn(
                "rounded-lg border px-4 py-4 text-base",
                errors.location?.address ? "border-red-500" : "border-gray-200 dark:border-gray-600",
                "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              )}
              placeholder={t('group:createGroup.locationPlaceholder')}
              placeholderTextColor="#6B7280"
              value={formData.location?.address || ''}
              onChangeText={(text) => 
                setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, address: text }
                }))
              }
            />
            {errors.location?.address && (
              <Text className="text-red-500 text-sm mt-1">{errors.location.address}</Text>
            )}
          </View>
        )}

        <View className="mb-6">
          <Text className={cn(
            "text-base font-semibold mb-2",
            "text-gray-900 dark:text-white"
          )}>
            {t('group:createGroup.minimumMembers')}
          </Text>
          <View className="flex-row items-center justify-center">
            <TouchableOpacity
              className={cn(
                "w-10 h-10 rounded-full border items-center justify-center",
                "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
              )}
              onPress={() => 
                setFormData(prev => ({ 
                  ...prev, 
                  minimumMembers: Math.max(4, prev.minimumMembers - 2) 
                }))
              }
            >
              <Text className="text-blue-500 text-lg font-bold">-</Text>
            </TouchableOpacity>
            <Text className={cn(
              "text-lg font-bold mx-8 min-w-20 text-center",
              "text-gray-900 dark:text-white"
            )}>
              {formData.minimumMembers}{t('group:createGroup.people')}
            </Text>
            <TouchableOpacity
              className={cn(
                "w-10 h-10 rounded-full border items-center justify-center",
                "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
              )}
              onPress={() => 
                setFormData(prev => ({ 
                  ...prev, 
                  minimumMembers: Math.min(100, prev.minimumMembers + 2) 
                }))
              }
            >
              <Text className="text-blue-500 text-lg font-bold">+</Text>
            </TouchableOpacity>
          </View>
          <Text className={cn(
            "text-sm text-center mt-1",
            "text-gray-600 dark:text-gray-300"
          )}>
            {t('group:createGroup.minimumMembersHelper')}
          </Text>
        </View>

        <View className="mb-6">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className={cn(
                "text-base font-semibold",
                "text-gray-900 dark:text-white"
              )}>
                {t('group:createGroup.privateGroup')}
              </Text>
              <Text className={cn(
                "text-sm mt-1",
                "text-gray-600 dark:text-gray-300"
              )}>
                {t('group:createGroup.privateGroupDesc')}
              </Text>
            </View>
            <Switch
              value={formData.isPrivate}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, isPrivate: value }))
              }
              trackColor={{ 
                false: "#D1D5DB", 
                true: "#3B82F6" 
              }}
            />
          </View>
        </View>

        <View className={cn(
          "p-4 rounded-lg border mt-6",
          "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
        )}>
          <Text className={cn(
            "text-base font-semibold mb-2",
            "text-gray-900 dark:text-white"
          )}>
            {t('group:createGroup.guidelines.title')}
          </Text>
          <Text className={cn(
            "text-sm leading-5",
            "text-gray-600 dark:text-gray-300"
          )}>
            {t('group:createGroup.guidelines.content')}
          </Text>
        </View>
      </ScrollView>

      {renderGroupTypePicker()}
    </SafeAreaView>
  );
};
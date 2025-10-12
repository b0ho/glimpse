/**
 * 내 정보 등록/수정 화면 (NativeWind v4 버전)
 *
 * @screen
 * @description 매칭을 위한 상세 개인정보를 등록하고 관리하는 화면 - 전화번호, 이메일, SNS, 학교, 회사 등 다양한 정보 카테고리 지원
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';

// 커스텀 훅
import { useMyInfoStorage } from '@/hooks/myInfo/useMyInfoStorage';
import { useMyInfoModal } from '@/hooks/myInfo/useMyInfoModal';

// 컴포넌트
import { InfoFieldSection } from '@/components/myInfo/InfoFieldSection';
import { MyInfoModal } from '@/components/myInfo/MyInfoModal';

// 타입
import { InfoFieldKey } from '@/types/myInfo';
import { cn } from '@/lib/utils';

/**
 * 내 정보 등록/수정 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element} 정보 등록 폼 화면
 *
 * @description
 * 다른 사용자가 나를 찾을 수 있도록 다양한 개인정보를 등록하는 화면입니다.
 * - 기본 정보: 실명, 프로필 닉네임
 * - 연락처: 전화번호, 이메일
 * - SNS 계정: 인스타그램, 페이스북 등
 * - 생년월일
 * - 회사/학교: 직장명, 학교명, 아르바이트처
 * - 거주 지역
 * - 플랫폼 ID: 카카오톡, 라인 등
 * - 게임 ID: 롤, 배그 등
 * - 각 정보마다 대상 성별과 관계 의도 설정 가능
 *
 * @navigation
 * - From: ProfileScreen 또는 온보딩 프로세스
 * - To: 정보 저장 후 이전 화면으로 복귀
 *
 * @example
 * ```tsx
 * // ProfileScreen에서 네비게이션
 * navigation.navigate('MyInfo');
 * ```
 *
 * @remarks
 * 이 파일은 1,300줄에서 약 250줄로 리팩토링된 모듈화 버전입니다.
 * 모든 비즈니스 로직은 커스텀 훅으로, UI 컴포넌트는 별도 파일로 분리되었습니다.
 *
 * @category Screen
 * @subcategory Profile
 */
export const MyInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // 스토리지 관리
  const {
    myInfo,
    loading,
    addInfoItem,
    updateInfoItem,
    removeInfoItem,
    updateBasicInfo,
  } = useMyInfoStorage();

  // 모달 관리
  const {
    showModal,
    currentFieldType,
    modalInputs,
    editMode,
    editIndex,
    showAdditionalOptions,
    selectedGender,
    relationshipIntent,
    setModalInputs,
    setShowAdditionalOptions,
    setSelectedGender,
    setRelationshipIntent,
    openAddModal,
    closeModal,
    prepareModalData,
    confirmDelete,
  } = useMyInfoModal();

  // 필드 키 목록
  const fieldKeys: InfoFieldKey[] = [
    'phone', 'email', 'socialId', 'birthdate',
    'company', 'school', 'partTimeJob',
    'location', 'nickname', 'platform', 'gameId'
  ];

  const handleModalSave = async () => {
    const newItem = prepareModalData();
    if (!newItem) return;

    if (currentFieldType) {
      let success = false;
      if (editMode && editIndex >= 0) {
        success = await updateInfoItem(currentFieldType, editIndex, newItem);
      } else {
        success = await addInfoItem(currentFieldType, newItem);
      }
      
      if (success) {
        closeModal();
      }
    }
  };

  const handleDeleteItem = (fieldKey: InfoFieldKey, index: number) => {
    confirmDelete(() => {
      removeInfoItem(fieldKey, index);
    });
  };

  const handleBasicInfoSave = async () => {
    await updateBasicInfo(myInfo.realName, myInfo.profileNickname);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" className="text-blue-500" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* 헤더 */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={"#111827"} />
          </TouchableOpacity>
          <Text className="text-gray-900 dark:text-white text-lg font-semibold">
            내 정보 관리
          </Text>
          <View className="w-6" />
        </View>

        <ScrollView 
          className="px-4 pb-24"
          showsVerticalScrollIndicator={false}
        >
          {/* 기본 정보 섹션 */}
          <View className="bg-white dark:bg-gray-800 p-4 rounded-xl mt-4 mb-4">
            <Text className="text-gray-900 dark:text-white text-base font-semibold mb-4">
              기본 정보
            </Text>
            
            <View className="mb-4">
              <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                실명
              </Text>
              <CrossPlatformInput
                className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-base"
                placeholder="홍길동"
                value={myInfo.realName}
                onChangeText={(text) => updateBasicInfo(text, myInfo.profileNickname)}
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                프로필 닉네임
              </Text>
              <CrossPlatformInput
                className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-base"
                placeholder="닉네임"
                value={myInfo.profileNickname}
                onChangeText={(text) => updateBasicInfo(myInfo.realName, text)}
              />
            </View>
          </View>

          {/* 정보 카테고리 설명 */}
          <View className="flex-row p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
            <Icon name="information-circle-outline" size={20} color={"#3B82F6"} />
            <Text className="text-gray-600 dark:text-gray-400 text-xs ml-2 flex-1 leading-4">
              등록한 정보는 다른 사용자가 당신을 찾을 때 사용됩니다.
              여러 개의 정보를 등록할 수 있으며, 각 정보마다 대상 성별과 관계 의도를 설정할 수 있습니다.
            </Text>
          </View>

          {/* 정보 필드 섹션들 */}
          {fieldKeys.map((fieldKey) => (
            <InfoFieldSection
              key={fieldKey}
              fieldKey={fieldKey}
              items={myInfo[fieldKey]}
              onAddItem={() => openAddModal(fieldKey)}
              onEditItem={(index) => openAddModal(fieldKey, myInfo[fieldKey][index], index)}
              onDeleteItem={(index) => handleDeleteItem(fieldKey, index)}
              colors={null} // NativeWind에서는 불필요
            />
          ))}
        </ScrollView>

        {/* 모달 */}
        <MyInfoModal
          visible={showModal}
          fieldType={currentFieldType}
          modalInputs={modalInputs}
          onInputChange={(key, value) => setModalInputs({ ...modalInputs, [key]: value })}
          selectedGender={selectedGender}
          onGenderChange={setSelectedGender}
          relationshipIntent={relationshipIntent}
          onRelationshipChange={setRelationshipIntent}
          showAdditionalOptions={showAdditionalOptions}
          onToggleOptions={() => setShowAdditionalOptions(!showAdditionalOptions)}
          onSave={handleModalSave}
          onClose={closeModal}
          editMode={editMode}
          colors={null} // NativeWind에서는 불필요
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
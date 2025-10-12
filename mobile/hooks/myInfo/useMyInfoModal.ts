/**
 * My Info Modal Management Hook
 *
 * @module hooks/myInfo/useMyInfoModal
 * @description 내 정보 등록/편집 모달의 상태와 동작을 관리하는 훅입니다.
 */

import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { InfoItem, InfoFieldKey, ModalInputState } from '@/types/myInfo';

/**
 * 내 정보 모달 관리 훅
 *
 * @hook
 * @returns {Object} 모달 관련 상태 및 함수들
 * @returns {boolean} returns.showModal - 모달 표시 여부
 * @returns {InfoFieldKey | ''} returns.currentFieldType - 현재 편집 중인 필드 타입
 * @returns {ModalInputState} returns.modalInputs - 모달 입력 상태
 * @returns {boolean} returns.editMode - 편집 모드 여부
 * @returns {number} returns.editIndex - 편집 중인 항목 인덱스
 * @returns {boolean} returns.showAdditionalOptions - 추가 옵션 표시 여부
 * @returns {'male' | 'female' | 'all'} returns.selectedGender - 선택된 성별
 * @returns {'friend' | 'romantic'} returns.relationshipIntent - 관계 의도
 * @returns {Function} returns.setModalInputs - 모달 입력 상태 설정 함수
 * @returns {Function} returns.setShowAdditionalOptions - 추가 옵션 표시 설정 함수
 * @returns {Function} returns.setSelectedGender - 성별 선택 설정 함수
 * @returns {Function} returns.setRelationshipIntent - 관계 의도 설정 함수
 * @returns {Function} returns.openAddModal - 모달 열기 함수
 * @returns {Function} returns.closeModal - 모달 닫기 함수
 * @returns {Function} returns.prepareModalData - 모달 데이터 준비 함수
 * @returns {Function} returns.confirmDelete - 삭제 확인 함수
 *
 * @description
 * 내 정보 추가/편집 모달의 모든 상태와 동작을 관리합니다.
 * - 모달 열기/닫기
 * - 추가/편집 모드 관리
 * - 폼 입력 상태 관리
 * - 성별 및 관계 의도 선택
 * - 데이터 유효성 검사
 * - 삭제 확인 처리
 *
 * @example
 * ```tsx
 * const {
 *   showModal,
 *   modalInputs,
 *   editMode,
 *   openAddModal,
 *   closeModal,
 *   prepareModalData,
 *   confirmDelete
 * } = useMyInfoModal();
 *
 * // 추가 모달 열기
 * openAddModal('phone');
 *
 * // 편집 모달 열기
 * openAddModal('phone', existingItem, index);
 *
 * // 데이터 준비 및 저장
 * const newItem = prepareModalData();
 * if (newItem) {
 *   await saveItem(newItem);
 * }
 * ```
 */
export const useMyInfoModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [currentFieldType, setCurrentFieldType] = useState<InfoFieldKey | ''>('');
  const [modalInputs, setModalInputs] = useState<ModalInputState>({});
  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number>(-1);
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'all'>('all');
  const [relationshipIntent, setRelationshipIntent] = useState<'friend' | 'romantic'>('romantic');

  const openAddModal = (fieldKey: InfoFieldKey, existingItem?: InfoItem, index?: number) => {
    setCurrentFieldType(fieldKey);
    setShowAdditionalOptions(false);
    setSelectedGender('all');
    setRelationshipIntent('romantic');
    
    if (existingItem && index !== undefined) {
      // 수정 모드
      setEditMode(true);
      setEditIndex(index);
      setModalInputs({
        value: existingItem.value,
        ...existingItem.metadata,
      });
      // 저장된 메타데이터에서 성별과 관계 유형 복원
      if (existingItem.metadata?.gender) {
        setSelectedGender(existingItem.metadata.gender as 'male' | 'female' | 'all');
      }
      if (existingItem.metadata?.relationshipIntent) {
        setRelationshipIntent(existingItem.metadata.relationshipIntent as 'friend' | 'romantic');
      }
    } else {
      // 추가 모드
      setEditMode(false);
      setEditIndex(-1);
      setModalInputs({});
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalInputs({});
    setEditMode(false);
    setEditIndex(-1);
    setCurrentFieldType('');
  };

  const prepareModalData = (): InfoItem | null => {
    if (!modalInputs.value) {
      Alert.alert('알림', '필수 정보를 입력해주세요');
      return null;
    }

    const newItem: InfoItem = {
      value: modalInputs.value,
      metadata: {},
    };

    // 메타데이터 처리
    Object.keys(modalInputs).forEach(key => {
      if (key !== 'value' && modalInputs[key]) {
        newItem.metadata![key] = modalInputs[key];
      }
    });

    // 성별과 관계 유형 추가 (모든 타입에 공통)
    newItem.metadata!.gender = selectedGender;
    newItem.metadata!.relationshipIntent = relationshipIntent;

    return newItem;
  };

  const confirmDelete = (onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('이 정보를 삭제하시겠습니까?');
      if (confirmed) {
        onConfirm();
      }
    } else {
      Alert.alert(
        '삭제 확인',
        '이 정보를 삭제하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: onConfirm,
          },
        ],
      );
    }
  };

  return {
    // Modal state
    showModal,
    currentFieldType,
    modalInputs,
    editMode,
    editIndex,
    showAdditionalOptions,
    selectedGender,
    relationshipIntent,
    
    // Actions
    setModalInputs,
    setShowAdditionalOptions,
    setSelectedGender,
    setRelationshipIntent,
    openAddModal,
    closeModal,
    prepareModalData,
    confirmDelete,
  };
};
/**
 * 내 정보 모달 관리 훅
 */
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { InfoItem, InfoFieldKey, ModalInputState } from '@/types/myInfo';

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
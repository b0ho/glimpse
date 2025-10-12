/**
 * My Info Storage Management Hook
 *
 * @module hooks/myInfo/useMyInfoStorage
 * @description 내 정보 데이터를 AsyncStorage에 저장하고 관리하는 훅입니다.
 * 사용자의 연락처, 소셜 ID, 학교/회사 정보 등을 로컬에 저장합니다.
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyInfo, InfoItem, InfoFieldKey } from '@/types/myInfo';
import { useAuthStore } from '@/store/slices/authSlice';

/** AsyncStorage 키 */
const STORAGE_KEY = 'my-search-info-v2';

/**
 * 내 정보 저장소 관리 훅
 *
 * @hook
 * @returns {Object} 저장소 관련 상태 및 함수들
 * @returns {MyInfo} returns.myInfo - 내 정보 데이터
 * @returns {boolean} returns.loading - 로딩 상태
 * @returns {Function} returns.saveMyInfo - 내 정보 저장 함수
 * @returns {Function} returns.addInfoItem - 정보 항목 추가 함수
 * @returns {Function} returns.updateInfoItem - 정보 항목 업데이트 함수
 * @returns {Function} returns.removeInfoItem - 정보 항목 제거 함수
 * @returns {Function} returns.updateBasicInfo - 기본 정보 업데이트 함수
 * @returns {Function} returns.reloadMyInfo - 정보 새로고침 함수
 *
 * @description
 * AsyncStorage를 사용하여 내 정보를 로컬에 저장하고 관리합니다.
 * - 자동 로드 (마운트 시)
 * - CRUD 작업 (추가, 읽기, 업데이트, 삭제)
 * - 배열 필드 관리 (phone, email, socialId 등)
 * - 기본 정보 업데이트 (이름, 닉네임)
 *
 * @example
 * ```tsx
 * const {
 *   myInfo,
 *   loading,
 *   addInfoItem,
 *   updateInfoItem,
 *   removeInfoItem,
 *   updateBasicInfo
 * } = useMyInfoStorage();
 *
 * // 새 전화번호 추가
 * await addInfoItem('phone', {
 *   value: '010-1234-5678',
 *   metadata: { type: 'mobile' }
 * });
 *
 * // 항목 업데이트
 * await updateInfoItem('phone', 0, updatedItem);
 *
 * // 항목 제거
 * await removeInfoItem('phone', 0);
 *
 * // 기본 정보 업데이트
 * await updateBasicInfo('홍길동', '닉네임');
 * ```
 */
export const useMyInfoStorage = () => {
  const { user } = useAuthStore();
  
  const [myInfo, setMyInfo] = useState<MyInfo>({
    realName: user?.realName || '',
    profileNickname: user?.nickname || '',
    phone: [],
    email: [],
    socialId: [],
    birthdate: [],
    group: [],
    location: [],
    nickname: [],
    company: [],
    school: [],
    partTimeJob: [],
    platform: [],
    gameId: [],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMyInfo();
  }, []);

  const loadMyInfo = async () => {
    try {
      setLoading(true);
      const storedInfo = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedInfo) {
        const parsed = JSON.parse(storedInfo);
        setMyInfo(parsed);
      }
    } catch (error) {
      console.error('Failed to load my info:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMyInfo = async (updatedInfo: MyInfo) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedInfo));
      setMyInfo(updatedInfo);
      return true;
    } catch (error) {
      console.error('Failed to save my info:', error);
      return false;
    }
  };

  const addInfoItem = async (fieldKey: InfoFieldKey, item: InfoItem) => {
    const currentArray = myInfo[fieldKey] as InfoItem[];
    const updatedArray = [...currentArray, item];
    const updatedInfo = {
      ...myInfo,
      [fieldKey]: updatedArray,
    };
    return await saveMyInfo(updatedInfo);
  };

  const updateInfoItem = async (fieldKey: InfoFieldKey, index: number, item: InfoItem) => {
    const currentArray = myInfo[fieldKey] as InfoItem[];
    const updatedArray = [...currentArray];
    updatedArray[index] = item;
    const updatedInfo = {
      ...myInfo,
      [fieldKey]: updatedArray,
    };
    return await saveMyInfo(updatedInfo);
  };

  const removeInfoItem = async (fieldKey: InfoFieldKey, index: number) => {
    const currentArray = myInfo[fieldKey] as InfoItem[];
    const updatedArray = currentArray.filter((_, i) => i !== index);
    const updatedInfo = {
      ...myInfo,
      [fieldKey]: updatedArray,
    };
    return await saveMyInfo(updatedInfo);
  };

  const updateBasicInfo = async (realName: string, profileNickname: string) => {
    const updatedInfo = {
      ...myInfo,
      realName,
      profileNickname,
    };
    return await saveMyInfo(updatedInfo);
  };

  return {
    myInfo,
    loading,
    saveMyInfo,
    addInfoItem,
    updateInfoItem,
    removeInfoItem,
    updateBasicInfo,
    reloadMyInfo: loadMyInfo,
  };
};
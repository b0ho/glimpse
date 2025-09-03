/**
 * 내 정보 저장소 관리 훅
 */
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyInfo, InfoItem, InfoFieldKey } from '@/types/myInfo';
import { useAuthStore } from '@/store/slices/authSlice';

const STORAGE_KEY = 'my-search-info-v2';

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
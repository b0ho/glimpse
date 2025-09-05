/**
 * 프로필 편집 폼 관리 커스텀 훅
 */

import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/slices/authSlice';
import { ProfileEditFormData, ProfileEditToggles, SocialItem, GameItem } from '@/types/profileEdit.types';
import { Gender } from '@/types/interest';

export const useProfileEditForm = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  
  // 기본 정보 상태
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [realName, setRealName] = useState(user?.realName || '');
  const [selectedGender, setSelectedGender] = useState<Gender | null>(
    user?.gender ? user.gender as Gender : null
  );
  const [birthdate, setBirthdate] = useState(user?.birthdate || '');
  const [bio, setBio] = useState(user?.bio || '');
  
  // 연락처 정보
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  
  // 소셜 계정
  const [socialIds, setSocialIds] = useState<SocialItem[]>(user?.socialIds || []);
  const [platformIds, setPlatformIds] = useState<SocialItem[]>(user?.platformIds || []);
  const [gameIds, setGameIds] = useState<GameItem[]>(user?.gameIds || []);
  
  // 직업/학업 정보
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [school, setSchool] = useState(user?.school || '');
  const [major, setMajor] = useState(user?.major || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [studentId, setStudentId] = useState(user?.studentId || '');
  
  // 알바 정보
  const [partTimeJobPlace, setPartTimeJobPlace] = useState(user?.partTimeJob?.place || '');
  const [partTimeJobPosition, setPartTimeJobPosition] = useState(user?.partTimeJob?.position || '');
  const [partTimeJobHours, setPartTimeJobHours] = useState(user?.partTimeJob?.workingHours || '');
  
  // 기타 정보
  const [location, setLocation] = useState(user?.location || '');
  const [appearance, setAppearance] = useState(user?.appearance || '');
  const [hobbies] = useState(user?.hobbies || '');
  const [groups, setGroups] = useState<string[]>(user?.groups || []);
  
  // UI 토글 상태
  const [toggles, setToggles] = useState<ProfileEditToggles>({
    showSocialIds: false,
    showPlatformIds: false,
    showGameIds: false,
    showPartTimeJob: false,
    showGroups: false,
  });
  
  const [loading, setLoading] = useState(false);
  
  // 토글 함수
  const toggleSection = (section: keyof ProfileEditToggles) => {
    setToggles(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // 유효성 검사
  const validateForm = (): boolean => {
    if (!nickname.trim()) {
      Toast.show({
        type: 'error',
        text1: '입력 오류',
        text2: '닉네임은 필수입니다',
        position: 'bottom',
      });
      return false;
    }
    
    if (!selectedGender) {
      Toast.show({
        type: 'error',
        text1: '입력 오류',
        text2: '성별을 선택해주세요',
        position: 'bottom',
      });
      return false;
    }
    
    return true;
  };
  
  // 프로필 저장
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const profileData = {
        nickname: nickname.trim(),
        realName: realName.trim() || undefined,
        gender: selectedGender,
        birthdate: birthdate || undefined,
        bio: bio.trim() || undefined,
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        companyName: companyName.trim() || undefined,
        school: school.trim() || undefined,
        major: major.trim() || undefined,
        location: location.trim() || undefined,
        appearance: appearance.trim() || undefined,
        department: department.trim() || undefined,
        studentId: studentId.trim() || undefined,
        partTimeJob: partTimeJobPlace ? {
          place: partTimeJobPlace.trim(),
          position: partTimeJobPosition.trim() || undefined,
          workingHours: partTimeJobHours.trim() || undefined,
        } : undefined,
        socialIds: socialIds.length > 0 ? socialIds : undefined,
        platformIds: platformIds.length > 0 ? platformIds : undefined,
        gameIds: gameIds.length > 0 ? gameIds : undefined,
        hobbies: hobbies.trim() || undefined,
        groups: groups.filter(g => g.trim()).length > 0 ? groups.filter(g => g.trim()) : undefined,
      };
      
      // TODO: 서버 API 연결 필요
      console.log('프로필 데이터:', profileData);
      
      Toast.show({
        type: 'success',
        text1: '저장 완료',
        text2: '프로필이 업데이트되었습니다',
        position: 'bottom',
      });
      
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: '저장 실패',
        text2: error.message || '프로필 업데이트에 실패했습니다',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return {
    // Form states
    nickname,
    setNickname,
    realName,
    setRealName,
    selectedGender,
    setSelectedGender,
    birthdate,
    setBirthdate,
    bio,
    setBio,
    email,
    setEmail,
    phoneNumber,
    setPhoneNumber,
    socialIds,
    setSocialIds,
    platformIds,
    setPlatformIds,
    gameIds,
    setGameIds,
    companyName,
    setCompanyName,
    school,
    setSchool,
    major,
    setMajor,
    location,
    setLocation,
    appearance,
    setAppearance,
    hobbies,
    groups,
    setGroups,
    partTimeJobPlace,
    setPartTimeJobPlace,
    partTimeJobPosition,
    setPartTimeJobPosition,
    partTimeJobHours,
    setPartTimeJobHours,
    department,
    setDepartment,
    studentId,
    setStudentId,
    
    // UI states
    toggles,
    toggleSection,
    loading,
    
    // Actions
    handleSave,
  };
};
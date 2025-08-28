import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/slices/authSlice';
import { Gender } from '@/types/interest';

/**
 * 내 정보 편집 화면 - 성별과 12종 유형 정보 편집 가능
 */
export const ProfileEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  
  // 기본 정보
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [realName, setRealName] = useState(user?.realName || '');
  const [selectedGender, setSelectedGender] = useState<Gender | null>(
    user?.gender ? user.gender as Gender : null
  );
  const [birthdate, setBirthdate] = useState(user?.birthdate || '');
  const [bio, setBio] = useState(user?.bio || '');
  
  // 12종 유형 정보
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [socialIds, setSocialIds] = useState(user?.socialIds || []);
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [school, setSchool] = useState(user?.school || '');
  const [major, setMajor] = useState(user?.major || '');
  const [location, setLocation] = useState(user?.location || '');
  const [appearance, setAppearance] = useState(user?.appearance || '');
  const [platformIds, setPlatformIds] = useState(user?.platformIds || []);
  const [gameIds, setGameIds] = useState(user?.gameIds || []);
  
  // 알바 정보
  const [partTimeJobPlace, setPartTimeJobPlace] = useState(user?.partTimeJob?.place || '');
  const [partTimeJobPosition, setPartTimeJobPosition] = useState(user?.partTimeJob?.position || '');
  const [partTimeJobHours, setPartTimeJobHours] = useState(user?.partTimeJob?.workingHours || '');
  
  // 취미 정보
  const [hobbies] = useState(user?.hobbies || '');
  
  // 그룹 정보
  const [groups, setGroups] = useState<string[]>(user?.groups || []);
  const [department, setDepartment] = useState(user?.department || '');
  const [studentId, setStudentId] = useState(user?.studentId || '');
  
  // 추가 정보 표시 여부
  const [showSocialIds, setShowSocialIds] = useState(false);
  const [showPlatformIds, setShowPlatformIds] = useState(false);
  const [showGameIds, setShowGameIds] = useState(false);
  const [showPartTimeJob, setShowPartTimeJob] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!nickname.trim()) {
      Toast.show({
        type: 'error',
        text1: '입력 오류',
        text2: '닉네임은 필수입니다',
        position: 'bottom',
      });
      return;
    }

    if (!selectedGender) {
      Toast.show({
        type: 'error',
        text1: '입력 오류',
        text2: '성별을 선택해주세요',
        position: 'bottom',
      });
      return;
    }

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
        department: department.trim() || undefined,
        studentId: studentId.trim() || undefined,
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

  const addSocialId = () => {
    setSocialIds([...socialIds, { platform: '', id: '' }]);
  };

  const removeSocialId = (index: number) => {
    setSocialIds(socialIds.filter((_, i) => i !== index));
  };

  const updateSocialId = (index: number, field: 'platform' | 'id', value: string) => {
    const updated = [...socialIds];
    updated[index] = { ...updated[index], [field]: value };
    setSocialIds(updated);
  };

  const addPlatformId = () => {
    setPlatformIds([...platformIds, { platform: '', id: '' }]);
  };

  const removePlatformId = (index: number) => {
    setPlatformIds(platformIds.filter((_, i) => i !== index));
  };

  const updatePlatformId = (index: number, field: 'platform' | 'id', value: string) => {
    const updated = [...platformIds];
    updated[index] = { ...updated[index], [field]: value };
    setPlatformIds(updated);
  };

  const addGameId = () => {
    setGameIds([...gameIds, { game: '', id: '' }]);
  };

  const removeGameId = (index: number) => {
    setGameIds(gameIds.filter((_, i) => i !== index));
  };

  const updateGameId = (index: number, field: 'game' | 'id', value: string) => {
    const updated = [...gameIds];
    updated[index] = { ...updated[index], [field]: value };
    setGameIds(updated);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={28} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>
            내 정보 편집
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveButton, { color: colors.PRIMARY }]}>
              {loading ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 기본 정보 섹션 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              기본 정보
            </Text>

            {/* 닉네임 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                닉네임 <Text style={{ color: colors.ERROR }}>*</Text>
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={nickname}
                onChangeText={setNickname}
              />
            </View>

            {/* 실명 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                실명 (선택)
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="실명을 입력하세요"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={realName}
                onChangeText={setRealName}
              />
              <Text style={[styles.hint, { color: colors.TEXT.TERTIARY }]}>
                매칭 후 상대방에게 공개됩니다
              </Text>
            </View>

            {/* 성별 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                성별 <Text style={{ color: colors.ERROR }}>*</Text>
              </Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
                    selectedGender === Gender.MALE && { borderColor: colors.PRIMARY, borderWidth: 2 }
                  ]}
                  onPress={() => setSelectedGender(Gender.MALE)}
                >
                  <Icon name="male-outline" size={24} color={selectedGender === Gender.MALE ? colors.PRIMARY : colors.TEXT.SECONDARY} />
                  <Text style={[styles.genderText, { color: selectedGender === Gender.MALE ? colors.PRIMARY : colors.TEXT.SECONDARY }]}>
                    남성
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
                    selectedGender === Gender.FEMALE && { borderColor: colors.PRIMARY, borderWidth: 2 }
                  ]}
                  onPress={() => setSelectedGender(Gender.FEMALE)}
                >
                  <Icon name="female-outline" size={24} color={selectedGender === Gender.FEMALE ? colors.PRIMARY : colors.TEXT.SECONDARY} />
                  <Text style={[styles.genderText, { color: selectedGender === Gender.FEMALE ? colors.PRIMARY : colors.TEXT.SECONDARY }]}>
                    여성
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
                    selectedGender === Gender.OTHER && { borderColor: colors.PRIMARY, borderWidth: 2 }
                  ]}
                  onPress={() => setSelectedGender(Gender.OTHER)}
                >
                  <Icon name="transgender-outline" size={24} color={selectedGender === Gender.OTHER ? colors.PRIMARY : colors.TEXT.SECONDARY} />
                  <Text style={[styles.genderText, { color: selectedGender === Gender.OTHER ? colors.PRIMARY : colors.TEXT.SECONDARY }]}>
                    기타
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 생년월일 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                생년월일
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={birthdate}
                onChangeText={setBirthdate}
                maxLength={10}
              />
            </View>

            {/* 자기소개 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                자기소개
              </Text>
              <CrossPlatformInput
                style={[styles.textArea, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="자기소개를 작성해주세요"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* 연락처 정보 섹션 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              연락처 정보
            </Text>

            {/* 이메일 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                이메일
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="example@email.com"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* 전화번호 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                전화번호
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="010-0000-0000"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* 소셜 계정 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                소셜 계정
              </Text>
              <TouchableOpacity onPress={() => setShowSocialIds(!showSocialIds)}>
                <Icon 
                  name={showSocialIds ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={colors.TEXT.SECONDARY} 
                />
              </TouchableOpacity>
            </View>

            {showSocialIds && (
              <View>
                {socialIds.map((social, index) => (
                  <View key={index} style={styles.socialIdContainer}>
                    <CrossPlatformInput
                      style={[styles.socialInput, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                      placeholder="플랫폼 (인스타그램, 트위터 등)"
                      placeholderTextColor={colors.TEXT.TERTIARY}
                      value={social.platform}
                      onChangeText={(value) => updateSocialId(index, 'platform', value)}
                    />
                    <CrossPlatformInput
                      style={[styles.socialInput, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                      placeholder="아이디"
                      placeholderTextColor={colors.TEXT.TERTIARY}
                      value={social.id}
                      onChangeText={(value) => updateSocialId(index, 'id', value)}
                    />
                    <TouchableOpacity onPress={() => removeSocialId(index)}>
                      <Icon name="close-circle" size={24} color={colors.ERROR} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.PRIMARY }]} onPress={addSocialId}>
                  <Icon name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>소셜 계정 추가</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 직장/학교 정보 섹션 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              직장/학교 정보
            </Text>

            {/* 회사 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                회사명
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="회사명을 입력하세요 (예: 삼성전자, 카카오)"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={companyName}
                onChangeText={setCompanyName}
              />
              <Text style={[styles.hint, { color: colors.TEXT.TERTIARY }]}>
                회사명으로 관심상대를 찾을 수 있습니다
              </Text>
            </View>
            
            {/* 부서 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                부서/팀 (선택)
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="부서 또는 팀명 (예: 개발팀, 마케팅팀)"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={department}
                onChangeText={setDepartment}
              />
            </View>

            {/* 학교 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                학교명
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="학교명을 입력하세요 (예: 서울대학교, 연세대학교)"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={school}
                onChangeText={setSchool}
              />
              <Text style={[styles.hint, { color: colors.TEXT.TERTIARY }]}>
                학교명으로 관심상대를 찾을 수 있습니다
              </Text>
            </View>

            {/* 학과/전공 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                학과/전공
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="학과 또는 전공 (예: 컴퓨터공학과, 경영학과)"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={major}
                onChangeText={setMajor}
              />
            </View>
            
            {/* 학번 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                학번 (선택)
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="학번 (예: 2020)"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={studentId}
                onChangeText={setStudentId}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>

          {/* 위치 및 외모 정보 섹션 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              위치 및 외모 정보
            </Text>

            {/* 자주 가는 장소 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                자주 가는 장소
              </Text>
              <CrossPlatformInput
                style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="카페, 헬스장, 도서관 등 자주 가는 장소"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={location}
                onChangeText={setLocation}
              />
              <Text style={[styles.hint, { color: colors.TEXT.TERTIARY }]}>
                같은 장소를 자주 가는 사람과 매칭될 수 있습니다
              </Text>
            </View>

            {/* 인상착의 */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                인상착의 (외모 특징)
              </Text>
              <CrossPlatformInput
                style={[styles.textArea, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="예시:\n- 키: 175cm, 보통 체형\n- 긴 머리, 안경 착용\n- 주로 캐주얼한 옷차림\n- 왼손 손목에 시계 착용"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={appearance}
                onChangeText={setAppearance}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={[styles.hint, { color: colors.TEXT.TERTIARY }]}>
                외모 특징으로 서로를 찾을 수 있습니다 (선택사항)
              </Text>
            </View>
          </View>

          {/* 알바 정보 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                알바 정보
              </Text>
              <TouchableOpacity onPress={() => setShowPartTimeJob(!showPartTimeJob)}>
                <Icon 
                  name={showPartTimeJob ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={colors.TEXT.SECONDARY} 
                />
              </TouchableOpacity>
            </View>

            {showPartTimeJob && (
              <View>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                    알바 장소
                  </Text>
                  <CrossPlatformInput
                    style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                    placeholder="알바하는 곳 (예: 스타벅스 강남점)"
                    placeholderTextColor={colors.TEXT.TERTIARY}
                    value={partTimeJobPlace}
                    onChangeText={setPartTimeJobPlace}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                    포지션
                  </Text>
                  <CrossPlatformInput
                    style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                    placeholder="담당 업무 (예: 바리스타, 캐셔)"
                    placeholderTextColor={colors.TEXT.TERTIARY}
                    value={partTimeJobPosition}
                    onChangeText={setPartTimeJobPosition}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
                    근무 시간
                  </Text>
                  <CrossPlatformInput
                    style={[styles.input, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                    placeholder="근무 시간 (예: 주말 오후 2-10시)"
                    placeholderTextColor={colors.TEXT.TERTIARY}
                    value={partTimeJobHours}
                    onChangeText={setPartTimeJobHours}
                  />
                </View>
              </View>
            )}
          </View>

          {/* 그룹 정보 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                소속 그룹
              </Text>
              <TouchableOpacity onPress={() => setShowGroups(!showGroups)}>
                <Icon 
                  name={showGroups ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={colors.TEXT.SECONDARY} 
                />
              </TouchableOpacity>
            </View>

            {showGroups && (
              <View>
                <Text style={[styles.hint, { color: colors.TEXT.TERTIARY, marginBottom: 10 }]}>
                  동호회, 모임, 커뮤니티 등을 입력하세요
                </Text>
                {groups.map((group, index) => (
                  <View key={index} style={styles.socialIdContainer}>
                    <CrossPlatformInput
                      style={[styles.socialInput, { flex: 2, color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                      placeholder="그룹명 (예: 등산 동호회, 독서 모임)"
                      placeholderTextColor={colors.TEXT.TERTIARY}
                      value={group}
                      onChangeText={(value) => {
                        const updated = [...groups];
                        updated[index] = value;
                        setGroups(updated);
                      }}
                    />
                    <TouchableOpacity onPress={() => {
                      setGroups(groups.filter((_, i) => i !== index));
                    }}>
                      <Icon name="close-circle" size={24} color={colors.ERROR} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity 
                  style={[styles.addButton, { backgroundColor: colors.PRIMARY }]} 
                  onPress={() => setGroups([...groups, ''])}
                >
                  <Icon name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>그룹 추가</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 플랫폼 계정 섹션 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                기타 플랫폼 계정
              </Text>
              <TouchableOpacity onPress={() => setShowPlatformIds(!showPlatformIds)}>
                <Icon 
                  name={showPlatformIds ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={colors.TEXT.SECONDARY} 
                />
              </TouchableOpacity>
            </View>

            {showPlatformIds && (
              <View>
                {platformIds.map((platform, index) => (
                  <View key={index} style={styles.socialIdContainer}>
                    <CrossPlatformInput
                      style={[styles.socialInput, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                      placeholder="플랫폼명 (Discord, Slack 등)"
                      placeholderTextColor={colors.TEXT.TERTIARY}
                      value={platform.platform}
                      onChangeText={(value) => updatePlatformId(index, 'platform', value)}
                    />
                    <CrossPlatformInput
                      style={[styles.socialInput, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                      placeholder="아이디"
                      placeholderTextColor={colors.TEXT.TERTIARY}
                      value={platform.id}
                      onChangeText={(value) => updatePlatformId(index, 'id', value)}
                    />
                    <TouchableOpacity onPress={() => removePlatformId(index)}>
                      <Icon name="close-circle" size={24} color={colors.ERROR} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.PRIMARY }]} onPress={addPlatformId}>
                  <Icon name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>플랫폼 계정 추가</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 게임 계정 섹션 */}
          <View style={[styles.section, { marginBottom: 100 }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                게임 계정
              </Text>
              <TouchableOpacity onPress={() => setShowGameIds(!showGameIds)}>
                <Icon 
                  name={showGameIds ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={colors.TEXT.SECONDARY} 
                />
              </TouchableOpacity>
            </View>

            {showGameIds && (
              <View>
                {gameIds.map((game, index) => (
                  <View key={index} style={styles.socialIdContainer}>
                    <CrossPlatformInput
                      style={[styles.socialInput, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                      placeholder="게임명"
                      placeholderTextColor={colors.TEXT.TERTIARY}
                      value={game.game}
                      onChangeText={(value) => updateGameId(index, 'game', value)}
                    />
                    <CrossPlatformInput
                      style={[styles.socialInput, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                      placeholder="게임 아이디"
                      placeholderTextColor={colors.TEXT.TERTIARY}
                      value={game.id}
                      onChangeText={(value) => updateGameId(index, 'id', value)}
                    />
                    <TouchableOpacity onPress={() => removeGameId(index)}>
                      <Icon name="close-circle" size={24} color={colors.ERROR} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.PRIMARY }]} onPress={addGameId}>
                  <Icon name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>게임 계정 추가</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  genderText: {
    fontSize: 14,
    marginTop: 5,
    fontWeight: '500',
  },
  socialIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  socialInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default ProfileEditScreen;
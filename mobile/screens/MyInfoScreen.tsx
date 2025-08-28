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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InterestType } from '@/types/interest';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';

interface InfoItem {
  value: string;
  metadata?: {
    [key: string]: string;
  };
}

interface MyInfo {
  realName: string;
  profileNickname: string;
  phone: InfoItem[];
  email: InfoItem[];
  socialId: InfoItem[];
  birthdate: InfoItem[];
  group: InfoItem[];
  location: InfoItem[];
  nickname: InfoItem[];
  company: InfoItem[];
  school: InfoItem[];
  partTimeJob: InfoItem[];
  platform: InfoItem[];
  gameId: InfoItem[];
}

/**
 * 내 정보 등록/수정 화면 V2
 */
export const MyInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
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

  const [showModal, setShowModal] = useState(false);
  const [currentFieldType, setCurrentFieldType] = useState<keyof MyInfo | ''>('');
  const [modalInputs, setModalInputs] = useState<{[key: string]: string}>({});
  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number>(-1);
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'all'>('all');
  const [relationshipIntent, setRelationshipIntent] = useState<'friend' | 'romantic'>('romantic');

  useEffect(() => {
    loadMyInfo();
  }, []);

  const loadMyInfo = async () => {
    try {
      const storedInfo = await AsyncStorage.getItem('my-search-info-v2');
      if (storedInfo) {
        const parsed = JSON.parse(storedInfo);
        setMyInfo(parsed);
      }
    } catch (error) {
      console.error('Failed to load my info:', error);
    }
  };

  const saveMyInfo = async (updatedInfo: MyInfo) => {
    try {
      await AsyncStorage.setItem('my-search-info-v2', JSON.stringify(updatedInfo));
      setMyInfo(updatedInfo);
    } catch (error) {
      console.error('Failed to save my info:', error);
    }
  };

  const openAddModal = (fieldKey: keyof MyInfo, index?: number) => {
    if (fieldKey === 'realName' || fieldKey === 'profileNickname') {
      // 간단한 필드는 모달 없이 처리
      return;
    }

    setCurrentFieldType(fieldKey);
    setShowAdditionalOptions(false);
    setSelectedGender('all');
    setRelationshipIntent('romantic');
    
    if (index !== undefined) {
      // 수정 모드
      setEditMode(true);
      setEditIndex(index);
      const item = (myInfo[fieldKey] as InfoItem[])[index];
      setModalInputs({
        value: item.value,
        ...item.metadata,
      });
      // 저장된 메타데이터에서 성별과 관계 유형 복원
      if (item.metadata?.gender) {
        setSelectedGender(item.metadata.gender as 'male' | 'female' | 'all');
      }
      if (item.metadata?.relationshipIntent) {
        setRelationshipIntent(item.metadata.relationshipIntent as 'friend' | 'romantic');
      }
    } else {
      // 추가 모드
      setEditMode(false);
      setEditIndex(-1);
      setModalInputs({});
    }
    
    setShowModal(true);
  };

  const handleModalSave = async () => {
    if (!currentFieldType || (currentFieldType === 'realName' || currentFieldType === 'profileNickname')) {
      return;
    }

    const newItem: InfoItem = {
      value: modalInputs.value || '',
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

    if (!newItem.value) {
      Alert.alert('알림', '필수 정보를 입력해주세요');
      return;
    }

    const currentArray = myInfo[currentFieldType] as InfoItem[];
    let updatedArray: InfoItem[];

    if (editMode && editIndex >= 0) {
      // 수정
      updatedArray = [...currentArray];
      updatedArray[editIndex] = newItem;
    } else {
      // 추가
      updatedArray = [...currentArray, newItem];
    }

    const updatedInfo = {
      ...myInfo,
      [currentFieldType]: updatedArray,
    };

    await saveMyInfo(updatedInfo);
    setShowModal(false);
    setModalInputs({});
    setEditMode(false);
    setEditIndex(-1);
  };

  const removeItem = async (key: keyof MyInfo, index: number) => {
    if (key === 'realName' || key === 'profileNickname') return;
    
    // Web platform support
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('이 정보를 삭제하시겠습니까?');
      if (confirmed) {
        const currentArray = myInfo[key] as InfoItem[];
        const updatedArray = currentArray.filter((_, i) => i !== index);
        const updatedInfo = {
          ...myInfo,
          [key]: updatedArray,
        };
        await saveMyInfo(updatedInfo);
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
            onPress: async () => {
              const currentArray = myInfo[key] as InfoItem[];
              const updatedArray = currentArray.filter((_, i) => i !== index);
              const updatedInfo = {
                ...myInfo,
                [key]: updatedArray,
              };
              await saveMyInfo(updatedInfo);
            },
          },
        ],
      );
    }
  };

  const getFieldLabel = (key: string): string => {
    const labels: Record<string, string> = {
      phone: '전화번호',
      email: '이메일',
      socialId: '소셜 계정',
      birthdate: '생년월일',
      group: '특정 그룹/모임',
      location: '장소/인상착의',
      nickname: '닉네임',
      company: '회사',
      school: '학교',
      partTimeJob: '알바',
      platform: '기타 플랫폼',
      gameId: '게임 아이디',
    };
    return labels[key] || key;
  };

  const getFieldIcon = (key: string): string => {
    const icons: Record<string, string> = {
      phone: 'call-outline',
      email: 'mail-outline',
      socialId: 'logo-instagram',
      birthdate: 'calendar-outline',
      group: 'people-outline',
      location: 'location-outline',
      nickname: 'at-outline',
      company: 'business-outline',
      school: 'school-outline',
      partTimeJob: 'briefcase-outline',
      platform: 'globe-outline',
      gameId: 'game-controller-outline',
    };
    return icons[key] || 'help-outline';
  };

  const getFieldColor = (key: string): string => {
    const colors: Record<string, string> = {
      phone: '#4CAF50',
      email: '#2196F3',
      socialId: '#E91E63',
      birthdate: '#9C27B0',
      group: '#9C27B0',
      location: '#FF9800',
      nickname: '#607D8B',
      company: '#3F51B5',
      school: '#00BCD4',
      partTimeJob: '#F44336',
      platform: '#9C27B0',
      gameId: '#673AB7',
    };
    return colors[key] || '#999999';
  };

  const renderItemDetails = (item: InfoItem, type: string) => {
    const details = [];
    
    if (item.value) {
      details.push(
        <Text key="value" style={[styles.itemMainText, { color: colors.TEXT.PRIMARY }]}>
          {item.value}
        </Text>
      );
    }

    if (item.metadata) {
      // 회사 정보
      if (type === 'company') {
        if (item.metadata.employeeName) {
          details.push(
            <View key="name" style={styles.metadataRow}>
              <Icon name="person-outline" size={14} color={colors.TEXT.SECONDARY} />
              <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
                {item.metadata.employeeName}
              </Text>
            </View>
          );
        }
        if (item.metadata.department) {
          details.push(
            <View key="dept" style={styles.metadataRow}>
              <Icon name="briefcase-outline" size={14} color={colors.TEXT.SECONDARY} />
              <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
                {item.metadata.department}
              </Text>
            </View>
          );
        }
      }

      // 학교 정보
      if (type === 'school') {
        if (item.metadata.studentName) {
          details.push(
            <View key="name" style={styles.metadataRow}>
              <Icon name="person-outline" size={14} color={colors.TEXT.SECONDARY} />
              <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
                {item.metadata.studentName}
              </Text>
            </View>
          );
        }
        if (item.metadata.major) {
          details.push(
            <View key="major" style={styles.metadataRow}>
              <Icon name="book-outline" size={14} color={colors.TEXT.SECONDARY} />
              <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
                {item.metadata.major}
              </Text>
            </View>
          );
        }
      }

      // 소셜 계정
      if (type === 'socialId' && item.metadata.platform) {
        details.push(
          <View key="platform" style={styles.metadataRow}>
            <Icon name="at" size={14} color={colors.TEXT.SECONDARY} />
            <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
              {item.metadata.platform}
            </Text>
          </View>
        );
      }

      // 생년월일
      if (type === 'birthdate') {
        if (item.metadata.name) {
          details.push(
            <View key="name" style={styles.metadataRow}>
              <Icon name="person-outline" size={14} color={colors.TEXT.SECONDARY} />
              <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
                {item.metadata.name}
              </Text>
            </View>
          );
        }
      }

      // 알바
      if (type === 'partTimeJob') {
        if (item.metadata.employeeName) {
          details.push(
            <View key="name" style={styles.metadataRow}>
              <Icon name="person-outline" size={14} color={colors.TEXT.SECONDARY} />
              <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
                {item.metadata.employeeName}
              </Text>
            </View>
          );
        }
        if (item.metadata.jobPosition) {
          details.push(
            <View key="position" style={styles.metadataRow}>
              <Icon name="briefcase-outline" size={14} color={colors.TEXT.SECONDARY} />
              <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
                {item.metadata.jobPosition}
              </Text>
            </View>
          );
        }
        if (item.metadata.workTime) {
          details.push(
            <View key="time" style={styles.metadataRow}>
              <Icon name="time-outline" size={14} color={colors.TEXT.SECONDARY} />
              <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
                {item.metadata.workTime}
              </Text>
            </View>
          );
        }
      }

      // 플랫폼
      if (type === 'platform' && item.metadata.platformId) {
        details.push(
          <View key="id" style={styles.metadataRow}>
            <Icon name="at" size={14} color={colors.TEXT.SECONDARY} />
            <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
              {item.metadata.platformId}
            </Text>
          </View>
        );
      }

      // 공통: 성별과 관계 표시
      if (item.metadata.gender || item.metadata.relationshipIntent) {
        const genderText = item.metadata.gender === 'male' ? '남성' : 
                          item.metadata.gender === 'female' ? '여성' : '전체';
        const intentText = item.metadata.relationshipIntent === 'friend' ? '친구' : '호감';
        details.push(
          <View key="tags" style={styles.tagRow}>
            {item.metadata.gender && (
              <View style={[styles.tag, { backgroundColor: colors.PRIMARY + '20' }]}>
                <Text style={[styles.tagText, { color: colors.PRIMARY }]}>
                  {genderText}
                </Text>
              </View>
            )}
            {item.metadata.relationshipIntent && (
              <View style={[styles.tag, { backgroundColor: colors.ACCENT + '20' }]}>
                <Text style={[styles.tagText, { color: colors.ACCENT }]}>
                  {intentText}
                </Text>
              </View>
            )}
          </View>
        );
      }

      // 장소/인상착의
      if (type === 'location' && item.metadata.appearance) {
        details.push(
          <View key="appearance" style={styles.metadataRow}>
            <Icon name="shirt-outline" size={14} color={colors.TEXT.SECONDARY} />
            <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
              {item.metadata.appearance}
            </Text>
          </View>
        );
      }
    }

    return <View style={styles.itemDetails}>{details}</View>;
  };

  const renderModalContent = () => {
    switch (currentFieldType) {
      case 'company':
        return (
          <View>
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>회사명 *</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="회사명을 입력하세요"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.value || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, value: text })}
            />
            
            {/* 추가 옵션 토글 */}
            <TouchableOpacity
              style={[styles.optionToggle, { borderColor: colors.BORDER, marginTop: 12 }]}
              onPress={() => setShowAdditionalOptions(!showAdditionalOptions)}
            >
              <Icon name="person-add-outline" size={20} color={colors.PRIMARY} />
              <Text style={[styles.optionText, { color: colors.TEXT.PRIMARY }]}>
                상세 정보 추가 (이름, 부서, 생일)
              </Text>
              <Icon name={showAdditionalOptions ? "chevron-up" : "chevron-down"} size={20} color={colors.TEXT.SECONDARY} />
            </TouchableOpacity>
            
            {showAdditionalOptions && (
              <View style={styles.additionalFields}>
                <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>직원 이름</Text>
                <CrossPlatformInput
                  style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                  placeholder="예: 김철수"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={modalInputs.employeeName || ''}
                  onChangeText={(text) => setModalInputs({ ...modalInputs, employeeName: text })}
                />
                <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>부서</Text>
                <CrossPlatformInput
                  style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                  placeholder="예: 마케팅팀, 개발1팀"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={modalInputs.department || ''}
                  onChangeText={(text) => setModalInputs({ ...modalInputs, department: text })}
                />
                <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>생년월일</Text>
                <CrossPlatformInput
                  style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                  placeholder="YYYY-MM-DD (예: 1995-03-15)"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={modalInputs.birthdate || ''}
                  onChangeText={(text) => {
                    let cleaned = text.replace(/[^0-9]/g, '');
                    if (cleaned.length >= 5 && cleaned.length <= 6) {
                      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
                    } else if (cleaned.length >= 7) {
                      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6) + '-' + cleaned.slice(6, 8);
                    }
                    setModalInputs({ ...modalInputs, birthdate: cleaned });
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <Text style={[styles.hintText, { color: colors.TEXT.TERTIARY, marginTop: 4 }]}>
                  더 정확한 매칭을 위해 사용되며, 모든 정보는 익명으로 보호됩니다
                </Text>
              </View>
            )}
          </View>
        );
      
      case 'school':
        return (
          <View>
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>학교명 *</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="학교명을 입력하세요"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.value || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, value: text })}
            />
            
            {/* 추가 옵션 토글 */}
            <TouchableOpacity
              style={[styles.optionToggle, { borderColor: colors.BORDER, marginTop: 12 }]}
              onPress={() => setShowAdditionalOptions(!showAdditionalOptions)}
            >
              <Icon name="person-add-outline" size={20} color={colors.PRIMARY} />
              <Text style={[styles.optionText, { color: colors.TEXT.PRIMARY }]}>
                상세 정보 추가 (이름, 학과, 생일)
              </Text>
              <Icon name={showAdditionalOptions ? "chevron-up" : "chevron-down"} size={20} color={colors.TEXT.SECONDARY} />
            </TouchableOpacity>
            
            {showAdditionalOptions && (
              <View style={styles.additionalFields}>
                <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>학생 이름</Text>
                <CrossPlatformInput
                  style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                  placeholder="예: 이지은"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={modalInputs.studentName || ''}
                  onChangeText={(text) => setModalInputs({ ...modalInputs, studentName: text })}
                />
                <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>학과/전공</Text>
                <CrossPlatformInput
                  style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                  placeholder="예: 컴퓨터공학과, 경영학과"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={modalInputs.major || ''}
                  onChangeText={(text) => setModalInputs({ ...modalInputs, major: text })}
                />
                <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>생년월일</Text>
                <CrossPlatformInput
                  style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                  placeholder="YYYY-MM-DD (예: 2000-05-20)"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={modalInputs.birthdate || ''}
                  onChangeText={(text) => {
                    let cleaned = text.replace(/[^0-9]/g, '');
                    if (cleaned.length >= 5 && cleaned.length <= 6) {
                      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
                    } else if (cleaned.length >= 7) {
                      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6) + '-' + cleaned.slice(6, 8);
                    }
                    setModalInputs({ ...modalInputs, birthdate: cleaned });
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <Text style={[styles.hintText, { color: colors.TEXT.TERTIARY, marginTop: 4 }]}>
                  더 정확한 매칭을 위해 사용되며, 모든 정보는 익명으로 보호됩니다
                </Text>
              </View>
            )}
          </View>
        );

      case 'socialId':
        return (
          <View>
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>소셜 ID *</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="인스타그램 또는 카카오톡 ID"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.value || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, value: text })}
            />
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>플랫폼</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="instagram, kakaotalk 등"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.platform || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, platform: text })}
            />
          </View>
        );

      case 'birthdate':
        return (
          <View>
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>생년월일 *</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.value || ''}
              onChangeText={(text) => {
                let cleaned = text.replace(/[^0-9]/g, '');
                if (cleaned.length >= 5 && cleaned.length <= 6) {
                  cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
                } else if (cleaned.length >= 7) {
                  cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6) + '-' + cleaned.slice(6, 8);
                }
                setModalInputs({ ...modalInputs, value: cleaned });
              }}
              keyboardType="numeric"
              maxLength={10}
            />
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>이름</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="이름을 입력하세요"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.name || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, name: text })}
            />
          </View>
        );

      case 'location':
        return (
          <View>
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>장소 *</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="장소를 입력하세요 (예: 강남역 스타벅스)"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.value || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, value: text })}
            />
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY, marginTop: 12 }]}>인상착의 (선택)</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER, minHeight: 80, textAlignVertical: 'top', paddingTop: 10 }]}
              placeholder="인상착의를 자세히 설명해주세요\n예: 검은색 코트, 빨간 가방, 안경 착용"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.appearance || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, appearance: text })}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'partTimeJob':
        return (
          <View>
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>알바 장소/브랜드 *</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="알바 장소를 입력하세요 (예: 스타벅스 강남점)"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.value || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, value: text })}
            />
            
            {/* 추가 정보 토글 */}
            <TouchableOpacity
              style={[styles.optionToggle, { borderColor: colors.BORDER, marginTop: 12 }]}
              onPress={() => setShowAdditionalOptions(!showAdditionalOptions)}
            >
              <Icon name="person-add-outline" size={20} color={colors.PRIMARY} />
              <Text style={[styles.optionText, { color: colors.TEXT.PRIMARY }]}>
                상세 정보 추가 (이름, 포지션, 근무시간)
              </Text>
              <Icon name={showAdditionalOptions ? "chevron-up" : "chevron-down"} size={20} color={colors.TEXT.SECONDARY} />
            </TouchableOpacity>
            
            {showAdditionalOptions && (
              <View style={styles.additionalFields}>
                <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>이름</Text>
                <CrossPlatformInput
                  style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                  placeholder="예: 박민수"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={modalInputs.employeeName || ''}
                  onChangeText={(text) => setModalInputs({ ...modalInputs, employeeName: text })}
                />
                <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>포지션</Text>
                <CrossPlatformInput
                  style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                  placeholder="예: 바리스타, 캐셔"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={modalInputs.jobPosition || ''}
                  onChangeText={(text) => setModalInputs({ ...modalInputs, jobPosition: text })}
                />
                <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>근무시간</Text>
                <CrossPlatformInput
                  style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                  placeholder="예: 평일 18:00-22:00"
                  placeholderTextColor={colors.TEXT.TERTIARY}
                  value={modalInputs.workTime || ''}
                  onChangeText={(text) => setModalInputs({ ...modalInputs, workTime: text })}
                />
              </View>
            )}
          </View>
        );
        
      case 'platform':
        return (
          <View>
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>플랫폼 *</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="플랫폼명 (예: Discord, Slack, Telegram)"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.value || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, value: text })}
            />
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>플랫폼 ID</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="해당 플랫폼에서의 ID나 사용자명"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.platformId || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, platformId: text })}
            />
          </View>
        );
        
      case 'gameId':
        return (
          <View>
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>게임 *</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="게임명 (예: 리그오브레전드, 배틀그라운드)"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.value || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, value: text })}
            />
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>게임 ID</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="게임 내 닉네임이나 ID"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.gameNickname || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, gameNickname: text })}
            />
          </View>
        );
        
      case 'phone':
        return (
          <View>
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>전화번호 *</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="010-0000-0000"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.value || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, value: text })}
              keyboardType="phone-pad"
            />
          </View>
        );
        
      case 'email':
        return (
          <View>
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>이메일 *</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="example@email.com"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.value || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, value: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        );
        
      case 'nickname':
        return (
          <View>
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>닉네임 *</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="사용하는 닉네임"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.value || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, value: text })}
            />
          </View>
        );
        
      case 'group':
        return (
          <View>
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>그룹 ID 또는 이름 *</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="그룹 ID 또는 이름"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.value || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, value: text })}
            />
            <Text style={[styles.hintText, { color: colors.TEXT.TERTIARY, marginTop: 4 }]}>
              같은 그룹에 있는 사람끼리 매칭됩니다
            </Text>
          </View>
        );
        
      default:
        return (
          <View>
            <Text style={[styles.modalLabel, { color: colors.TEXT.PRIMARY }]}>정보 입력 *</Text>
            <CrossPlatformInput
              style={[styles.modalInput, { color: colors.TEXT.PRIMARY, backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
              placeholder="정보를 입력하세요"
              placeholderTextColor={colors.TEXT.TERTIARY}
              value={modalInputs.value || ''}
              onChangeText={(text) => setModalInputs({ ...modalInputs, value: text })}
            />
          </View>
        );
    }
  };

  const infoFields: (keyof MyInfo)[] = [
    'phone', 'email', 'socialId', 'birthdate', 'group', 
    'location', 'nickname', 'company', 'school', 'partTimeJob',
    'platform', 'gameId'
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={28} color={colors.TEXT.PRIMARY} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>
              내 정보 관리
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* 설명 */}
          <View style={[styles.descriptionBox, { backgroundColor: colors.SUCCESS + '15' }]}>
            <Icon name="information-circle" size={20} color={colors.SUCCESS} />
            <Text style={[styles.descriptionText, { color: colors.TEXT.PRIMARY }]}>
              💡 매칭률을 높이는 팁
            </Text>
            <Text style={[styles.descriptionSubtext, { color: colors.TEXT.SECONDARY }]}>
              정확한 정보를 입력해주세요. 더 많은 정보를 등록할수록 매칭 확률이 높아집니다.
            </Text>
          </View>

          {/* 정보 입력 필드 */}
          <View style={styles.fieldsContainer}>
            {infoFields.map((fieldKey) => {
              const fieldArray = myInfo[fieldKey] as InfoItem[];
              const fieldColor = getFieldColor(fieldKey);
              
              return (
                <View key={fieldKey} style={styles.fieldWrapper}>
                  <View style={styles.fieldHeader}>
                    <View style={[styles.fieldIcon, { backgroundColor: fieldColor + '20' }]}>
                      <Icon name={getFieldIcon(fieldKey)} size={20} color={fieldColor} />
                    </View>
                    <Text style={[styles.fieldLabel, { color: colors.TEXT.PRIMARY }]}>
                      {getFieldLabel(fieldKey)}
                    </Text>
                    <TouchableOpacity
                      style={[styles.addFieldButton, { backgroundColor: colors.PRIMARY }]}
                      onPress={() => openAddModal(fieldKey)}
                    >
                      <Icon name="add" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  {/* 등록된 항목들 */}
                  {fieldArray.length > 0 && (
                    <View style={styles.itemsList}>
                      {fieldArray.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.itemCard, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
                          onPress={() => openAddModal(fieldKey, index)}
                        >
                          <View style={styles.itemContent}>
                            {renderItemDetails(item, fieldKey)}
                          </View>
                          <TouchableOpacity 
                            style={styles.itemDeleteButton}
                            onPress={() => removeItem(fieldKey, index)}
                          >
                            <Icon name="close-circle" size={20} color={colors.ERROR} />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 입력 모달 */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.BACKGROUND }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.TEXT.PRIMARY }]}>
                {editMode ? '정보 수정' : `${getFieldLabel(currentFieldType as string)} 추가`}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Icon name="close" size={24} color={colors.TEXT.PRIMARY} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {renderModalContent()}
              
              {/* 성별 선택 (모든 타입 공통) */}
              <View style={styles.genderSection}>
                <Text style={[styles.sectionLabel, { color: colors.TEXT.SECONDARY }]}>성별 선택</Text>
                <View style={styles.genderButtons}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      { borderColor: colors.BORDER },
                      selectedGender === 'all' && { backgroundColor: colors.PRIMARY }
                    ]}
                    onPress={() => setSelectedGender('all')}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      { color: selectedGender === 'all' ? '#FFFFFF' : colors.TEXT.PRIMARY }
                    ]}>
                      전체
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      { borderColor: colors.BORDER },
                      selectedGender === 'male' && { backgroundColor: colors.PRIMARY }
                    ]}
                    onPress={() => setSelectedGender('male')}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      { color: selectedGender === 'male' ? '#FFFFFF' : colors.TEXT.PRIMARY }
                    ]}>
                      남성
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      { borderColor: colors.BORDER },
                      selectedGender === 'female' && { backgroundColor: colors.PRIMARY }
                    ]}
                    onPress={() => setSelectedGender('female')}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      { color: selectedGender === 'female' ? '#FFFFFF' : colors.TEXT.PRIMARY }
                    ]}>
                      여성
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* 관계 의도 선택 (모든 타입 공통) */}
              <View style={styles.relationSection}>
                <Text style={[styles.sectionLabel, { color: colors.TEXT.SECONDARY }]}>관계 유형</Text>
                <View style={styles.relationButtons}>
                  <TouchableOpacity
                    style={[
                      styles.relationButton,
                      { borderColor: colors.BORDER },
                      relationshipIntent === 'friend' && { backgroundColor: colors.PRIMARY }
                    ]}
                    onPress={() => setRelationshipIntent('friend')}
                  >
                    <Icon name="people-outline" size={20} color={relationshipIntent === 'friend' ? '#FFFFFF' : colors.TEXT.SECONDARY} />
                    <Text style={[
                      styles.relationButtonText,
                      { color: relationshipIntent === 'friend' ? '#FFFFFF' : colors.TEXT.PRIMARY }
                    ]}>
                      친구
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.relationButton,
                      { borderColor: colors.BORDER },
                      relationshipIntent === 'romantic' && { backgroundColor: colors.PRIMARY }
                    ]}
                    onPress={() => setRelationshipIntent('romantic')}
                  >
                    <Icon name="heart-outline" size={20} color={relationshipIntent === 'romantic' ? '#FFFFFF' : colors.TEXT.SECONDARY} />
                    <Text style={[
                      styles.relationButtonText,
                      { color: relationshipIntent === 'romantic' ? '#FFFFFF' : colors.TEXT.PRIMARY }
                    ]}>
                      호감
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.BORDER }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={{ color: colors.TEXT.PRIMARY }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.PRIMARY }]}
                onPress={handleModalSave}
              >
                <Text style={{ color: '#FFFFFF' }}>
                  {editMode ? '수정' : '추가'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  descriptionBox: {
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 15,
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 25,
  },
  descriptionSubtext: {
    fontSize: 13,
    lineHeight: 20,
    marginLeft: 25,
  },
  fieldsContainer: {
    paddingHorizontal: 20,
  },
  fieldWrapper: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  addFieldButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  itemsList: {
    marginTop: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemContent: {
    flex: 1,
  },
  itemDetails: {
    gap: 4,
  },
  itemMainText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 13,
  },
  itemDeleteButton: {
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  optionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
  additionalFields: {
    marginTop: 12,
    paddingTop: 12,
  },
  hintText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  genderSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  relationSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  relationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  relationButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  relationButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
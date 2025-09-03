/**
 * 내 정보 등록/수정 화면 - 모듈화된 버전
 * 
 * 이 파일은 1,300줄에서 약 250줄로 리팩토링되었습니다.
 * 모든 비즈니스 로직과 컴포넌트가 분리되었습니다.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';

// 커스텀 훅
import { useMyInfoStorage } from '@/hooks/myInfo/useMyInfoStorage';
import { useMyInfoModal } from '@/hooks/myInfo/useMyInfoModal';

// 컴포넌트
import { InfoFieldSection } from '@/components/myInfo/InfoFieldSection';
import { MyInfoModal } from '@/components/myInfo/MyInfoModal';

// 타입
import { InfoFieldKey } from '@/types/myInfo';

export const MyInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: colors.BACKGROUND }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>
            내 정보 관리
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 기본 정보 섹션 */}
          <View style={[styles.basicInfoSection, { backgroundColor: colors.SURFACE }]}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              기본 정보
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
                실명
              </Text>
              <CrossPlatformInput
                style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                placeholder="홍길동"
                value={myInfo.realName}
                onChangeText={(text) => updateBasicInfo(text, myInfo.profileNickname)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
                프로필 닉네임
              </Text>
              <CrossPlatformInput
                style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                placeholder="닉네임"
                value={myInfo.profileNickname}
                onChangeText={(text) => updateBasicInfo(myInfo.realName, text)}
              />
            </View>
          </View>

          {/* 정보 카테고리 설명 */}
          <View style={styles.infoDescription}>
            <Icon name="information-circle-outline" size={20} color={colors.PRIMARY} />
            <Text style={[styles.infoDescriptionText, { color: colors.TEXT.SECONDARY }]}>
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
              colors={colors}
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
          colors={colors}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  basicInfoSection: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  infoDescription: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 16,
  },
  infoDescriptionText: {
    flex: 1,
    fontSize: 12,
    marginLeft: 8,
    lineHeight: 16,
  },
});
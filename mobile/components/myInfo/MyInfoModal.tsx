/**
 * 내 정보 입력 모달 컴포넌트
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { InfoFieldKey, ModalInputState } from '@/types/myInfo';
import { getFieldLabel } from '@/constants/myInfo/fieldConfig';

interface MyInfoModalProps {
  visible: boolean;
  fieldType: InfoFieldKey | '';
  modalInputs: ModalInputState;
  onInputChange: (key: string, value: string) => void;
  selectedGender: 'male' | 'female' | 'all';
  onGenderChange: (gender: 'male' | 'female' | 'all') => void;
  relationshipIntent: 'friend' | 'romantic';
  onRelationshipChange: (intent: 'friend' | 'romantic') => void;
  showAdditionalOptions: boolean;
  onToggleOptions: () => void;
  onSave: () => void;
  onClose: () => void;
  editMode: boolean;
  colors: any;
}

export const MyInfoModal: React.FC<MyInfoModalProps> = ({
  visible,
  fieldType,
  modalInputs,
  onInputChange,
  selectedGender,
  onGenderChange,
  relationshipIntent,
  onRelationshipChange,
  showAdditionalOptions,
  onToggleOptions,
  onSave,
  onClose,
  editMode,
  colors,
}) => {
  if (!fieldType) return null;

  const renderModalContent = () => {
    switch (fieldType) {
      case 'phone':
        return (
          <View>
            <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
              전화번호
            </Text>
            <CrossPlatformInput
              style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
              placeholder="010-1234-5678"
              value={modalInputs.value || ''}
              onChangeText={(text) => onInputChange('value', text)}
              keyboardType="phone-pad"
            />
          </View>
        );

      case 'email':
        return (
          <View>
            <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
              이메일
            </Text>
            <CrossPlatformInput
              style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
              placeholder="example@email.com"
              value={modalInputs.value || ''}
              onChangeText={(text) => onInputChange('value', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        );

      case 'socialId':
        return (
          <View>
            <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
              플랫폼
            </Text>
            <CrossPlatformInput
              style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
              placeholder="Instagram, Twitter 등"
              value={modalInputs.platform || ''}
              onChangeText={(text) => onInputChange('platform', text)}
            />
            <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
              계정 ID
            </Text>
            <CrossPlatformInput
              style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
              placeholder="@username"
              value={modalInputs.value || ''}
              onChangeText={(text) => onInputChange('value', text)}
              autoCapitalize="none"
            />
          </View>
        );

      case 'birthdate':
        return (
          <View>
            <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
              생년월일
            </Text>
            <CrossPlatformInput
              style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
              placeholder="YYYY-MM-DD"
              value={modalInputs.value || ''}
              onChangeText={(text) => onInputChange('value', text)}
              keyboardType="numeric"
            />
          </View>
        );

      case 'company':
        return (
          <View>
            <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
              회사명
            </Text>
            <CrossPlatformInput
              style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
              placeholder="회사 이름"
              value={modalInputs.value || ''}
              onChangeText={(text) => onInputChange('value', text)}
            />
            <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
              직원 이름
            </Text>
            <CrossPlatformInput
              style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
              placeholder="홍길동"
              value={modalInputs.employeeName || ''}
              onChangeText={(text) => onInputChange('employeeName', text)}
            />
            <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
              부서
            </Text>
            <CrossPlatformInput
              style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
              placeholder="개발팀"
              value={modalInputs.department || ''}
              onChangeText={(text) => onInputChange('department', text)}
            />
          </View>
        );

      case 'school':
        return (
          <View>
            <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
              학교 구분
            </Text>
            <View style={styles.levelButtons}>
              {['middle', 'high', 'university', 'graduate'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelButton,
                    {
                      backgroundColor: modalInputs.level === level ? colors.PRIMARY : colors.SURFACE,
                    }
                  ]}
                  onPress={() => onInputChange('level', level)}
                >
                  <Text style={{ color: modalInputs.level === level ? colors.TEXT.WHITE : colors.TEXT.PRIMARY }}>
                    {{
                      middle: '중학교',
                      high: '고등학교',
                      university: '대학교',
                      graduate: '대학원',
                    }[level]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
              학교명
            </Text>
            <CrossPlatformInput
              style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
              placeholder="학교 이름"
              value={modalInputs.value || ''}
              onChangeText={(text) => onInputChange('value', text)}
            />
            {(modalInputs.level === 'university' || modalInputs.level === 'graduate') && (
              <>
                <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
                  전공
                </Text>
                <CrossPlatformInput
                  style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                  placeholder="컴퓨터공학과"
                  value={modalInputs.major || ''}
                  onChangeText={(text) => onInputChange('major', text)}
                />
              </>
            )}
          </View>
        );

      default:
        return (
          <View>
            <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
              {getFieldLabel(fieldType)}
            </Text>
            <CrossPlatformInput
              style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
              placeholder={`${getFieldLabel(fieldType)}을(를) 입력하세요`}
              value={modalInputs.value || ''}
              onChangeText={(text) => onInputChange('value', text)}
            />
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.SURFACE }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.BORDER }]}>
            <Text style={[styles.modalTitle, { color: colors.TEXT.PRIMARY }]}>
              {editMode ? '수정' : '추가'}: {getFieldLabel(fieldType)}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={colors.TEXT.SECONDARY} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {renderModalContent()}

            {/* 성별 선택 */}
            <View style={styles.optionSection}>
              <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
                대상 성별
              </Text>
              <View style={styles.genderButtons}>
                {['all', 'male', 'female'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      {
                        backgroundColor: selectedGender === gender ? colors.PRIMARY : colors.SURFACE,
                        borderColor: selectedGender === gender ? colors.PRIMARY : colors.BORDER,
                      }
                    ]}
                    onPress={() => onGenderChange(gender as 'male' | 'female' | 'all')}
                  >
                    <Text style={{ color: selectedGender === gender ? colors.TEXT.WHITE : colors.TEXT.PRIMARY }}>
                      {{
                        all: '모두',
                        male: '남성',
                        female: '여성',
                      }[gender]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 관계 의도 선택 */}
            <View style={styles.optionSection}>
              <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>
                관계 의도
              </Text>
              <View style={styles.intentButtons}>
                {['romantic', 'friend'].map((intent) => (
                  <TouchableOpacity
                    key={intent}
                    style={[
                      styles.intentButton,
                      {
                        backgroundColor: relationshipIntent === intent ? colors.PRIMARY : colors.SURFACE,
                        borderColor: relationshipIntent === intent ? colors.PRIMARY : colors.BORDER,
                      }
                    ]}
                    onPress={() => onRelationshipChange(intent as 'friend' | 'romantic')}
                  >
                    <Text style={{ color: relationshipIntent === intent ? colors.TEXT.WHITE : colors.TEXT.PRIMARY }}>
                      {intent === 'romantic' ? '연애' : '친구'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.BORDER }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.BACKGROUND }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.TEXT.SECONDARY }}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.PRIMARY }]}
              onPress={onSave}
            >
              <Text style={{ color: colors.TEXT.WHITE }}>
                {editMode ? '수정' : '추가'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  optionSection: {
    marginTop: 16,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  intentButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  intentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  levelButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  levelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
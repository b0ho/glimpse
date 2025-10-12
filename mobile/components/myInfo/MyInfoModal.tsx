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
            <Text className="inputLabel">
              전화번호
            </Text>
            <CrossPlatformInput
              className="input"
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
            <Text className="inputLabel">
              이메일
            </Text>
            <CrossPlatformInput
              className="input"
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
            <Text className="inputLabel">
              플랫폼
            </Text>
            <CrossPlatformInput
              className="input"
              placeholder="Instagram, Twitter 등"
              value={modalInputs.platform || ''}
              onChangeText={(text) => onInputChange('platform', text)}
            />
            <Text className="inputLabel">
              계정 ID
            </Text>
            <CrossPlatformInput
              className="input"
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
            <Text className="inputLabel">
              생년월일
            </Text>
            <CrossPlatformInput
              className="input"
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
            <Text className="inputLabel">
              회사명
            </Text>
            <CrossPlatformInput
              className="input"
              placeholder="회사 이름"
              value={modalInputs.value || ''}
              onChangeText={(text) => onInputChange('value', text)}
            />
            <Text className="inputLabel">
              직원 이름
            </Text>
            <CrossPlatformInput
              className="input"
              placeholder="홍길동"
              value={modalInputs.employeeName || ''}
              onChangeText={(text) => onInputChange('employeeName', text)}
            />
            <Text className="inputLabel">
              부서
            </Text>
            <CrossPlatformInput
              className="input"
              placeholder="개발팀"
              value={modalInputs.department || ''}
              onChangeText={(text) => onInputChange('department', text)}
            />
          </View>
        );

      case 'school':
        return (
          <View>
            <Text className="inputLabel">
              학교 구분
            </Text>
            <View className="levelButtons">
              {['middle', 'high', 'university', 'graduate'].map((level) => (
                <TouchableOpacity
                  key={level}
                  className="levelButton"
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
            <Text className="inputLabel">
              학교명
            </Text>
            <CrossPlatformInput
              className="input"
              placeholder="학교 이름"
              value={modalInputs.value || ''}
              onChangeText={(text) => onInputChange('value', text)}
            />
            {(modalInputs.level === 'university' || modalInputs.level === 'graduate') && (
              <>
                <Text className="inputLabel">
                  전공
                </Text>
                <CrossPlatformInput
                  className="input"
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
            <Text className="inputLabel">
              {getFieldLabel(fieldType)}
            </Text>
            <CrossPlatformInput
              className="input"
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
        className="modalContainer"
      >
        <View className="modalContent">
          <View className="modalHeader">
            <Text className="modalTitle">
              {editMode ? '수정' : '추가'}: {getFieldLabel(fieldType)}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={colors.TEXT.SECONDARY} />
            </TouchableOpacity>
          </View>

          <ScrollView className="modalBody" showsVerticalScrollIndicator={false}>
            {renderModalContent()}

            {/* 성별 선택 */}
            <View className="optionSection">
              <Text className="inputLabel">
                대상 성별
              </Text>
              <View className="genderButtons">
                {['all', 'male', 'female'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    className="genderButton"
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
            <View className="optionSection">
              <Text className="inputLabel">
                관계 의도
              </Text>
              <View className="intentButtons">
                {['romantic', 'friend'].map((intent) => (
                  <TouchableOpacity
                    key={intent}
                    className="intentButton"
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

          <View className="modalFooter">
            <TouchableOpacity
              className="cancelButton"
              onPress={onClose}
            >
              <Text style={{ color: colors.TEXT.SECONDARY }}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="saveButton"
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


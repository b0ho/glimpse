/**
 * 프로필 편집 - 기본 정보 섹션
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { Gender } from '@/types/interest';

interface BasicInfoSectionProps {
  nickname: string;
  setNickname: (value: string) => void;
  realName: string;
  setRealName: (value: string) => void;
  selectedGender: Gender | null;
  setSelectedGender: (value: Gender) => void;
  birthdate: string;
  setBirthdate: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
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
}) => {
  const { colors } = useTheme();
  
  return (
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
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
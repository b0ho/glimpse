/**
 * 프로필 편집 - 기본 정보 섹션
 */

import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
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
    <View className="section">
      <Text className="sectionTitle">
        기본 정보
      </Text>
      
      {/* 닉네임 */}
      <View className="inputContainer">
        <Text className="label">
          닉네임 <Text style={{ color: colors.ERROR }}>*</Text>
        </Text>
        <CrossPlatformInput
          className="input"
          placeholder="닉네임을 입력하세요"
          placeholderTextColor={colors.TEXT.TERTIARY}
          value={nickname}
          onChangeText={setNickname}
        />
      </View>
      
      {/* 실명 */}
      <View className="inputContainer">
        <Text className="label">
          실명 (선택)
        </Text>
        <CrossPlatformInput
          className="input"
          placeholder="실명을 입력하세요"
          placeholderTextColor={colors.TEXT.TERTIARY}
          value={realName}
          onChangeText={setRealName}
        />
        <Text className="hint">
          매칭 후 상대방에게 공개됩니다
        </Text>
      </View>
      
      {/* 성별 */}
      <View className="inputContainer">
        <Text className="label">
          성별 <Text style={{ color: colors.ERROR }}>*</Text>
        </Text>
        <View className="genderContainer">
          <TouchableOpacity
            className="genderOption"
            onPress={() => setSelectedGender(Gender.MALE)}
          >
            <Icon name="male-outline" size={24} color={selectedGender === Gender.MALE ? colors.PRIMARY : colors.TEXT.SECONDARY} />
            <Text className="genderText">
              남성
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="genderOption"
            onPress={() => setSelectedGender(Gender.FEMALE)}
          >
            <Icon name="female-outline" size={24} color={selectedGender === Gender.FEMALE ? colors.PRIMARY : colors.TEXT.SECONDARY} />
            <Text className="genderText">
              여성
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="genderOption"
            onPress={() => setSelectedGender(Gender.OTHER)}
          >
            <Icon name="transgender-outline" size={24} color={selectedGender === Gender.OTHER ? colors.PRIMARY : colors.TEXT.SECONDARY} />
            <Text className="genderText">
              기타
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 생년월일 */}
      <View className="inputContainer">
        <Text className="label">
          생년월일
        </Text>
        <CrossPlatformInput
          className="input"
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.TEXT.TERTIARY}
          value={birthdate}
          onChangeText={setBirthdate}
          maxLength={10}
        />
      </View>
      
      {/* 자기소개 */}
      <View className="inputContainer">
        <Text className="label">
          자기소개
        </Text>
        <CrossPlatformInput
          className="textArea"
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


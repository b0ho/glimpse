import React from 'react';
import {
  View,
  Text
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

/**
 * ProfileInfoCards 컴포넌트 Props
 * @interface ProfileInfoCardsProps
 */
interface ProfileInfoCardsProps {
  /** 회사명 */
  companyName?: string;
  /** 학력 */
  education?: string;
  /** 위치 */
  location?: string;
  /** 관심사 목록 */
  interests?: string[];
  /** 키 (cm) */
  height?: number;
  /** MBTI 성격 유형 */
  mbti?: string;
  /** 음주 여부 */
  drinking?: string;
  /** 흡연 여부 */
  smoking?: string;
}

/**
 * 프로필 정보 카드 컴포넌트 - 사용자 기본 정보 표시
 * @component
 * @param {ProfileInfoCardsProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 프로필 정보 카드 UI
 * @description 직장, 학교, 지역, 키 등 사용자 기본 정보를 카드 형식으로 표시
 */
export const ProfileInfoCards= ({
  companyName,
  education,
  location,
  interests,
  height,
  mbti,
  drinking,
  smoking,
}) => {
  const { t } = useAndroidSafeTranslation('profile');
  return (
    <View className="container">
      <Text className="sectionTitle">{t('profile:info.basicInfo')}</Text>
      
      <View className="cardsGrid">
        <View className="infoCard">
          <MaterialCommunityIcons name="briefcase" size={24} color="#4A90E2" />
          <Text className="infoCardTitle">{t('profile:info.company')}</Text>
          <Text className="infoCardValue">
            {companyName || t('common:info.notRegistered')}
          </Text>
        </View>
        
        <View className="infoCard">
          <MaterialCommunityIcons name="school" size={24} color="#4A90E2" />
          <Text className="infoCardTitle">{t('profile:info.school')}</Text>
          <Text className="infoCardValue">
            {education || t('common:info.notRegistered')}
          </Text>
        </View>
        
        <View className="infoCard">
          <MaterialCommunityIcons name="map-marker" size={24} color="#4A90E2" />
          <Text className="infoCardTitle">{t('profile:info.location')}</Text>
          <Text className="infoCardValue">
            {location || t('common:info.notRegistered')}
          </Text>
        </View>
        
        <View className="infoCard">
          <MaterialCommunityIcons name="human-male-height" size={24} color="#4A90E2" />
          <Text className="infoCardTitle">{t('profile:info.height')}</Text>
          <Text className="infoCardValue">
            {height ? `${height}cm` : t('common:info.notRegistered')}
          </Text>
        </View>
      </View>
      
      {interests && interests.length > 0 && (
        <View className="interestsSection">
          <Text className="interestsTitle">{t('profile:info.interests')}</Text>
          <View className="interestTags">
            {interests.map((interest, index) => (
              <View key={index} className="interestTag">
                <Text className="interestTagText">{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      <View className="additionalInfo">
        {mbti && (
          <View className="additionalItem">
            <MaterialCommunityIcons name="brain" size={20} color="#9B59B6" />
            <Text className="additionalText">{t('profile:info.mbti')}: {mbti}</Text>
          </View>
        )}
        
        {drinking && (
          <View className="additionalItem">
            <MaterialCommunityIcons name="glass-wine" size={20} color="#E74C3C" />
            <Text className="additionalText">{t('profile:info.drinking')}: {drinking}</Text>
          </View>
        )}
        
        {smoking && (
          <View className="additionalItem">
            <MaterialCommunityIcons name="smoking-off" size={20} color="#34495E" />
            <Text className="additionalText">{t('profile:info.smoking')}: {smoking}</Text>
          </View>
        )}
      </View>
    </View>
  );
};


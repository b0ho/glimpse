import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['profile']);
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('info.basicInfo')}</Text>
      
      <View style={styles.cardsGrid}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="briefcase" size={24} color="#4A90E2" />
          <Text style={styles.infoCardTitle}>{t('info.company')}</Text>
          <Text style={styles.infoCardValue}>
            {companyName || t('info.notRegistered')}
          </Text>
        </View>
        
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="school" size={24} color="#4A90E2" />
          <Text style={styles.infoCardTitle}>{t('info.school')}</Text>
          <Text style={styles.infoCardValue}>
            {education || t('info.notRegistered')}
          </Text>
        </View>
        
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="map-marker" size={24} color="#4A90E2" />
          <Text style={styles.infoCardTitle}>{t('info.location')}</Text>
          <Text style={styles.infoCardValue}>
            {location || t('info.notRegistered')}
          </Text>
        </View>
        
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="human-male-height" size={24} color="#4A90E2" />
          <Text style={styles.infoCardTitle}>{t('info.height')}</Text>
          <Text style={styles.infoCardValue}>
            {height ? `${height}cm` : t('info.notRegistered')}
          </Text>
        </View>
      </View>
      
      {interests && interests.length > 0 && (
        <View style={styles.interestsSection}>
          <Text style={styles.interestsTitle}>{t('info.interests')}</Text>
          <View style={styles.interestTags}>
            {interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestTagText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      <View style={styles.additionalInfo}>
        {mbti && (
          <View style={styles.additionalItem}>
            <MaterialCommunityIcons name="brain" size={20} color="#9B59B6" />
            <Text style={styles.additionalText}>{t('info.mbti')}: {mbti}</Text>
          </View>
        )}
        
        {drinking && (
          <View style={styles.additionalItem}>
            <MaterialCommunityIcons name="glass-wine" size={20} color="#E74C3C" />
            <Text style={styles.additionalText}>{t('info.drinking')}: {drinking}</Text>
          </View>
        )}
        
        {smoking && (
          <View style={styles.additionalItem}>
            <MaterialCommunityIcons name="smoking-off" size={20} color="#34495E" />
            <Text style={styles.additionalText}>{t('info.smoking')}: {smoking}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.MD,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
    marginBottom: SPACING.LG,
  },
  infoCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoCardTitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SPACING.XS,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  interestsSection: {
    marginBottom: SPACING.LG,
  },
  interestsTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.XS,
  },
  interestTag: {
    backgroundColor: COLORS.PRIMARY + '20',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: 16,
  },
  interestTagText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  additionalInfo: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
  },
  additionalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    paddingVertical: SPACING.XS,
  },
  additionalText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
  },
});
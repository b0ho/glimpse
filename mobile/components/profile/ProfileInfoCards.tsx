import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

interface ProfileInfoCardsProps {
  companyName?: string;
  education?: string;
  location?: string;
  interests?: string[];
  height?: number;
  mbti?: string;
  drinking?: string;
  smoking?: string;
}

export const ProfileInfoCards: React.FC<ProfileInfoCardsProps> = ({
  companyName,
  education,
  location,
  interests,
  height,
  mbti,
  drinking,
  smoking,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>기본 정보</Text>
      
      <View style={styles.cardsGrid}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="briefcase" size={24} color="#4A90E2" />
          <Text style={styles.infoCardTitle}>직장</Text>
          <Text style={styles.infoCardValue}>
            {companyName || '미등록'}
          </Text>
        </View>
        
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="school" size={24} color="#4A90E2" />
          <Text style={styles.infoCardTitle}>학교</Text>
          <Text style={styles.infoCardValue}>
            {education || '미등록'}
          </Text>
        </View>
        
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="map-marker" size={24} color="#4A90E2" />
          <Text style={styles.infoCardTitle}>지역</Text>
          <Text style={styles.infoCardValue}>
            {location || '미등록'}
          </Text>
        </View>
        
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="human-male-height" size={24} color="#4A90E2" />
          <Text style={styles.infoCardTitle}>키</Text>
          <Text style={styles.infoCardValue}>
            {height ? `${height}cm` : '미등록'}
          </Text>
        </View>
      </View>
      
      {interests && interests.length > 0 && (
        <View style={styles.interestsSection}>
          <Text style={styles.interestsTitle}>관심사</Text>
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
            <Text style={styles.additionalText}>MBTI: {mbti}</Text>
          </View>
        )}
        
        {drinking && (
          <View style={styles.additionalItem}>
            <MaterialCommunityIcons name="glass-wine" size={20} color="#E74C3C" />
            <Text style={styles.additionalText}>음주: {drinking}</Text>
          </View>
        )}
        
        {smoking && (
          <View style={styles.additionalItem}>
            <MaterialCommunityIcons name="smoking-off" size={20} color="#34495E" />
            <Text style={styles.additionalText}>흡연: {smoking}</Text>
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
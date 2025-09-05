/**
 * 프로필 편집 - 소셜 계정 섹션
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { SocialItem } from '@/types/profileEdit.types';

interface SocialAccountsSectionProps {
  socialIds: SocialItem[];
  showSocialIds: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: 'platform' | 'id', value: string) => void;
}

export const SocialAccountsSection: React.FC<SocialAccountsSectionProps> = ({
  socialIds,
  showSocialIds,
  onToggle,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
          소셜 계정
        </Text>
        <TouchableOpacity onPress={onToggle}>
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
                onChangeText={(value) => onUpdate(index, 'platform', value)}
              />
              <CrossPlatformInput
                style={[styles.socialInput, { color: colors.TEXT.PRIMARY, borderColor: colors.BORDER }]}
                placeholder="아이디"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={social.id}
                onChangeText={(value) => onUpdate(index, 'id', value)}
              />
              <TouchableOpacity onPress={() => onRemove(index)}>
                <Icon name="trash-outline" size={24} color={colors.ERROR} />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity style={[styles.addButton, { borderColor: colors.PRIMARY }]} onPress={onAdd}>
            <Icon name="add" size={24} color={colors.PRIMARY} />
            <Text style={[styles.addButtonText, { color: colors.PRIMARY }]}>
              소셜 계정 추가
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 20,
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
  },
  socialIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  socialInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
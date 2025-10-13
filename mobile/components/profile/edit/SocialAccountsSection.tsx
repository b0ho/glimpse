/**
 * 프로필 편집 - 소셜 계정 섹션
 */

import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { SocialItem } from '@/types/profileEdit.types';

interface SocialAccountsSectionProps {
  socialIds: SocialItem[];
  showSocialIds?: boolean;
  onToggle?: () => void;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  onUpdate?: (index: number, field: 'platform' | 'id', value: string) => void;
  // Additional arrays and handlers
  platformIds?: SocialItem[];
  gameIds?: any[];
  addSocialId?: () => void;
  removeSocialId?: (index: number) => void;
  updateSocialId?: (index: number, field: 'platform' | 'id', value: string) => void;
  addPlatformId?: () => void;
  removePlatformId?: (index: number) => void;
  updatePlatformId?: (index: number, field: 'platform' | 'id', value: string) => void;
  addGameId?: () => void;
  removeGameId?: (index: number) => void;
  updateGameId?: (index: number, field: 'game' | 'id', value: string) => void;
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
    <View className="section">
      <View className="sectionHeader">
        <Text className="sectionTitle">
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
            <View key={index} className="socialIdContainer">
              <CrossPlatformInput
                className="socialInput"
                placeholder="플랫폼 (인스타그램, 트위터 등)"
                placeholderTextColor={colors.TEXT.TERTIARY}
                value={social.platform}
                onChangeText={(value) => onUpdate(index, 'platform', value)}
              />
              <CrossPlatformInput
                className="socialInput"
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
          
          <TouchableOpacity className="addButton" onPress={onAdd}>
            <Icon name="add" size={24} color={colors.PRIMARY} />
            <Text className="addButtonText">
              소셜 계정 추가
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};


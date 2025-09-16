/**
 * 관심상대 유형 선택 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity ScrollView } from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { InterestType } from '@/types/interest';
import { INTEREST_TYPE_CONFIG } from '@/constants/interest/interestTypes';
import { shadowStyles } from '@/utils/shadowStyles';

interface InterestTypeSelectorProps {
  selectedType: InterestType | null;
  onTypeSelect: (type: InterestType) => void;
  colors: any;
  t: (key: string) => string;
}

export const InterestTypeSelector: React.FC<InterestTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
  colors,
  t,
}) => {
  return (
    <View className="container">
      <Text className="title">
        {t('interest:selectMethodTitle')}
      </Text>
      <ScrollView 
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {INTEREST_TYPE_CONFIG.map((config) => (
          <TouchableOpacity
            key={config.type}
            className="typeCard"
            onPress={() => onTypeSelect(config.type)}
            activeOpacity={0.7}
          >
            <View className="iconContainer">
              <Icon
                name={config.icon}
                size={24}
                color={config.color}
              />
            </View>
            <Text className="typeLabel">
              {t(`interest:types.${config.type}`)}
            </Text>
            {selectedType === config.type && (
              <View className="checkMark">
                <Icon name="checkmark" size={14} color={colors.TEXT.WHITE} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};


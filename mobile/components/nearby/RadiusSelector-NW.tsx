/**
 * 반경 선택 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';

interface RadiusSelectorProps {
  selectedRadius: number;
  radiusOptions: number[];
  onRadiusChange: (radius: number) => void;
  colors: any;
  t: (key: string) => string;
}

export const RadiusSelector: React.FC<RadiusSelectorProps> = ({
  selectedRadius,
  radiusOptions,
  onRadiusChange,
  colors,
  t,
}) => {
  return (
    <View className="container">
      <View className="header">
        <Icon name="location-outline" size={20} color={colors.PRIMARY} />
        <Text className="title">
          {t('location:searchRadius')}
        </Text>
      </View>
      <View className="options">
        {radiusOptions.map((radius) => (
          <TouchableOpacity
            key={radius}
            className="option"
            onPress={() => onRadiusChange(radius)}
          >
            <Text 
              className="optionText"
            >
              {radius}km
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};


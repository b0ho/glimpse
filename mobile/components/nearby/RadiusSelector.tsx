/**
 * 반경 선택 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="location-outline" size={20} color={colors.PRIMARY} />
        <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>
          {t('location:searchRadius')}
        </Text>
      </View>
      <View style={styles.options}>
        {radiusOptions.map((radius) => (
          <TouchableOpacity
            key={radius}
            style={[
              styles.option,
              {
                backgroundColor: selectedRadius === radius 
                  ? colors.PRIMARY 
                  : colors.SURFACE,
                borderColor: selectedRadius === radius 
                  ? colors.PRIMARY 
                  : colors.BORDER,
              }
            ]}
            onPress={() => onRadiusChange(radius)}
          >
            <Text 
              style={[
                styles.optionText,
                { 
                  color: selectedRadius === radius 
                    ? colors.TEXT.WHITE 
                    : colors.TEXT.PRIMARY 
                }
              ]}
            >
              {radius}km
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
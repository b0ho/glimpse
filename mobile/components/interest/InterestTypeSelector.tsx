/**
 * 관심상대 유형 선택 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { InterestType } from '@/types/interest';
import { INTEREST_TYPE_CONFIG } from '@/constants/interest/interestTypes';

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
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>
        {t('interest:selectType')}
      </Text>
      <ScrollView 
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {INTEREST_TYPE_CONFIG.map((config) => (
          <TouchableOpacity
            key={config.type}
            style={[
              styles.typeCard,
              {
                backgroundColor: colors.SURFACE,
                borderColor: selectedType === config.type ? colors.PRIMARY : colors.BORDER,
                borderWidth: selectedType === config.type ? 2 : 1,
              }
            ]}
            onPress={() => onTypeSelect(config.type)}
          >
            <Icon
              name={config.icon}
              size={28}
              color={selectedType === config.type ? colors.PRIMARY : config.color}
            />
            <Text style={[
              styles.typeLabel,
              { 
                color: selectedType === config.type ? colors.PRIMARY : colors.TEXT.PRIMARY,
                fontWeight: selectedType === config.type ? '600' : '400',
              }
            ]}>
              {t(`interest:types.${config.type}`)}
            </Text>
            {selectedType === config.type && (
              <View style={[styles.checkMark, { backgroundColor: colors.PRIMARY }]}>
                <Icon name="checkmark" size={12} color={colors.TEXT.WHITE} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '48%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  typeLabel: {
    marginTop: 8,
    fontSize: 14,
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
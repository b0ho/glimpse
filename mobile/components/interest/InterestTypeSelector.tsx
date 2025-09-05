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
        {t('interest:selectMethodTitle')}
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
                borderColor: selectedType === config.type ? config.color : colors.BORDER,
                borderWidth: selectedType === config.type ? 2 : 1,
              }
            ]}
            onPress={() => onTypeSelect(config.type)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              { 
                backgroundColor: `${config.color}20`,
              }
            ]}>
              <Icon
                name={config.icon}
                size={24}
                color={config.color}
              />
            </View>
            <Text style={[
              styles.typeLabel,
              { 
                color: selectedType === config.type ? config.color : colors.TEXT.PRIMARY,
                fontWeight: selectedType === config.type ? '600' : '500',
              }
            ]}>
              {t(`interest:types.${config.type}`)}
            </Text>
            {selectedType === config.type && (
              <View style={[styles.checkMark, { backgroundColor: config.color }]}>
                <Icon name="checkmark" size={14} color={colors.TEXT.WHITE} />
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
    paddingTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  typeCard: {
    width: '31%',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
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
/**
 * 정보 필드 섹션 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { InfoItem, InfoFieldKey } from '@/types/myInfo';
import { InfoItemCard } from './InfoItemCard';
import { getFieldLabel, getFieldIcon, getFieldColor } from '@/constants/myInfo/fieldConfig';

interface InfoFieldSectionProps {
  fieldKey: InfoFieldKey;
  items: InfoItem[];
  onAddItem: () => void;
  onEditItem: (index: number) => void;
  onDeleteItem: (index: number) => void;
  colors: any;
}

export const InfoFieldSection: React.FC<InfoFieldSectionProps> = ({
  fieldKey,
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  colors,
}) => {
  const label = getFieldLabel(fieldKey);
  const icon = getFieldIcon(fieldKey);
  const fieldColor = getFieldColor(fieldKey);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon name={icon} size={20} color={fieldColor} />
        <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
          {label}
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.PRIMARY }]}
          onPress={onAddItem}
        >
          <Icon name="add" size={16} color={colors.TEXT.WHITE} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.TEXT.LIGHT }]}>
          등록된 {label} 정보가 없습니다
        </Text>
      ) : (
        <View style={styles.itemsList}>
          {items.map((item, index) => (
            <InfoItemCard
              key={index}
              item={item}
              type={fieldKey}
              onEdit={() => onEditItem(index)}
              onDelete={() => onDeleteItem(index)}
              colors={colors}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  itemsList: {
    gap: 8,
  },
});
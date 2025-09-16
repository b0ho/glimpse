/**
 * 정보 필드 섹션 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
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
    <View className="section">
      <View className="sectionHeader">
        <Icon name={icon} size={20} color={fieldColor} />
        <Text className="sectionTitle">
          {label}
        </Text>
        <TouchableOpacity
          className="addButton"
          onPress={onAddItem}
        >
          <Icon name="add" size={16} color={colors.TEXT.WHITE} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <Text className="emptyText">
          등록된 {label} 정보가 없습니다
        </Text>
      ) : (
        <View className="itemsList">
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


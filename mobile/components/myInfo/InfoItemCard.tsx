/**
 * 내 정보 항목 카드 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { InfoItem } from '@/types/myInfo';

interface InfoItemCardProps {
  item: InfoItem;
  type: string;
  onEdit: () => void;
  onDelete: () => void;
  colors: any;
}

export const InfoItemCard: React.FC<InfoItemCardProps> = ({
  item,
  type,
  onEdit,
  onDelete,
  colors,
}) => {
  const renderItemDetails = () => {
    const details = [];
    
    if (item.value) {
      details.push(
        <Text key="value" style={[styles.itemMainText, { color: colors.TEXT.PRIMARY }]}>
          {item.value}
        </Text>
      );
    }

    if (item.metadata) {
      // 회사 정보
      if (type === 'company') {
        if (item.metadata.employeeName) {
          details.push(
            <Text key="name" style={[styles.itemSubText, { color: colors.TEXT.SECONDARY }]}>
              이름: {item.metadata.employeeName}
            </Text>
          );
        }
        if (item.metadata.department) {
          details.push(
            <Text key="dept" style={[styles.itemSubText, { color: colors.TEXT.SECONDARY }]}>
              부서: {item.metadata.department}
            </Text>
          );
        }
      }

      // 학교 정보
      if (type === 'school') {
        if (item.metadata.level) {
          const levelLabels: Record<string, string> = {
            middle: '중학교',
            high: '고등학교',
            university: '대학교',
            graduate: '대학원',
          };
          details.push(
            <Text key="level" style={[styles.itemSubText, { color: colors.TEXT.SECONDARY }]}>
              {levelLabels[item.metadata.level] || item.metadata.level}
            </Text>
          );
        }
        if (item.metadata.major) {
          details.push(
            <Text key="major" style={[styles.itemSubText, { color: colors.TEXT.SECONDARY }]}>
              전공: {item.metadata.major}
            </Text>
          );
        }
      }

      // 소셜 계정
      if (type === 'socialId' && item.metadata.platform) {
        details.push(
          <Text key="platform" style={[styles.itemSubText, { color: colors.TEXT.SECONDARY }]}>
            {item.metadata.platform}
          </Text>
        );
      }

      // 게임 ID
      if (type === 'gameId' && item.metadata.game) {
        details.push(
          <Text key="game" style={[styles.itemSubText, { color: colors.TEXT.SECONDARY }]}>
            {item.metadata.game}
          </Text>
        );
      }

      // 플랫폼
      if (type === 'platform' && item.metadata.platformName) {
        details.push(
          <Text key="platform" style={[styles.itemSubText, { color: colors.TEXT.SECONDARY }]}>
            {item.metadata.platformName}
          </Text>
        );
      }

      // 성별과 관계 의도 (공통)
      if (item.metadata.gender && item.metadata.gender !== 'all') {
        details.push(
          <View key="tags" style={styles.tagContainer}>
            <View style={[styles.tag, { backgroundColor: colors.PRIMARY + '20' }]}>
              <Text style={[styles.tagText, { color: colors.PRIMARY }]}>
                {item.metadata.gender === 'male' ? '남성' : '여성'}
              </Text>
            </View>
            {item.metadata.relationshipIntent && (
              <View style={[styles.tag, { backgroundColor: colors.SECONDARY + '20' }]}>
                <Text style={[styles.tagText, { color: colors.SECONDARY }]}>
                  {item.metadata.relationshipIntent === 'friend' ? '친구' : '연애'}
                </Text>
              </View>
            )}
          </View>
        );
      }
    }

    return details;
  };

  return (
    <View style={[styles.itemCard, { backgroundColor: colors.SURFACE }]}>
      <View style={styles.itemContent}>
        {renderItemDetails()}
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
          <Icon name="pencil-outline" size={18} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <Icon name="trash-outline" size={18} color={colors.ERROR} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemContent: {
    flex: 1,
  },
  itemMainText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemSubText: {
    fontSize: 12,
    marginBottom: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
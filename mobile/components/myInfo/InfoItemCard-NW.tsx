/**
 * 내 정보 항목 카드 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
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
        <Text key="value" className="itemMainText">
          {item.value}
        </Text>
      );
    }

    if (item.metadata) {
      // 회사 정보
      if (type === 'company') {
        if (item.metadata.employeeName) {
          details.push(
            <Text key="name" className="itemSubText">
              이름: {item.metadata.employeeName}
            </Text>
          );
        }
        if (item.metadata.department) {
          details.push(
            <Text key="dept" className="itemSubText">
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
            <Text key="level" className="itemSubText">
              {levelLabels[item.metadata.level] || item.metadata.level}
            </Text>
          );
        }
        if (item.metadata.major) {
          details.push(
            <Text key="major" className="itemSubText">
              전공: {item.metadata.major}
            </Text>
          );
        }
      }

      // 소셜 계정
      if (type === 'socialId' && item.metadata.platform) {
        details.push(
          <Text key="platform" className="itemSubText">
            {item.metadata.platform}
          </Text>
        );
      }

      // 게임 ID
      if (type === 'gameId' && item.metadata.game) {
        details.push(
          <Text key="game" className="itemSubText">
            {item.metadata.game}
          </Text>
        );
      }

      // 플랫폼
      if (type === 'platform' && item.metadata.platformName) {
        details.push(
          <Text key="platform" className="itemSubText">
            {item.metadata.platformName}
          </Text>
        );
      }

      // 성별과 관계 의도 (공통)
      if (item.metadata.gender && item.metadata.gender !== 'all') {
        details.push(
          <View key="tags" className="tagContainer">
            <View className="tag">
              <Text className="tagText">
                {item.metadata.gender === 'male' ? '남성' : '여성'}
              </Text>
            </View>
            {item.metadata.relationshipIntent && (
              <View className="tag">
                <Text className="tagText">
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
    <View className="itemCard">
      <View className="itemContent">
        {renderItemDetails()}
      </View>
      <View className="itemActions">
        <TouchableOpacity onPress={onEdit} className="actionButton">
          <Icon name="pencil-outline" size={18} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} className="actionButton">
          <Icon name="trash-outline" size={18} color={colors.ERROR} />
        </TouchableOpacity>
      </View>
    </View>
  );
};


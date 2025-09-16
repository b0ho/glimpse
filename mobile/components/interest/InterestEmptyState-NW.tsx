import React from 'react';
import {
  View,
  Text
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
// import LottieView from 'lottie-react-native'; // Not installed yet

const { width } = Dimensions.get('window');

interface InterestEmptyStateProps {
  type: 'searches' | 'matches';
  onAddPress: () => void;
}

/**
 * 관심상대 빈 상태 컴포넌트
 */
export const InterestEmptyState: React.FC<InterestEmptyStateProps> = ({
  type,
  onAddPress,
}) => {
  const { colors } = useTheme();

  const config = type === 'searches' ? {
    icon: 'search-outline',
    title: '등록된 검색이 없습니다',
    description: '관심있는 사람을 찾기 위해\n다양한 조건으로 검색을 등록해보세요',
    buttonText: '첫 검색 등록하기',
  } : {
    icon: 'heart-outline',
    title: '아직 매칭이 없습니다',
    description: '등록한 검색 조건과 일치하는\n상대를 찾고 있습니다',
    buttonText: '검색 추가하기',
  };

  return (
    <View className="container">
      <View className="iconContainer">
        <Icon name={config.icon} size={60} color={colors.PRIMARY} />
      </View>

      <Text className="title">
        {config.title}
      </Text>

      <Text className="description">
        {config.description}
      </Text>

      <TouchableOpacity
        className="button"
        onPress={onAddPress}
      >
        <Icon name="add-circle-outline" size={20} color="#FFFFFF" />
        <Text className="buttonText">{config.buttonText}</Text>
      </TouchableOpacity>

      {type === 'searches' && (
        <View className="tipsContainer">
          <Text className="tipsTitle">
            💡 검색 팁
          </Text>
          <View className="tipsList">
            <TipItem
              icon="call-outline"
              text="연락처의 전화번호로 아는 사람 찾기"
              color={colors.TEXT.SECONDARY}
            />
            <TipItem
              icon="location-outline"
              text="특정 장소에서 만난 사람 찾기"
              color={colors.TEXT.SECONDARY}
            />
            <TipItem
              icon="people-outline"
              text="같은 그룹에 있는 사람 찾기"
              color={colors.TEXT.SECONDARY}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const TipItem: React.FC<{ icon: string; text: string; color: string }> = ({
  icon,
  text,
  color,
}) => (
  <View className="tipItem">
    <Icon name={icon} size={16} color={color} />
    <Text className="tipText">{text}</Text>
  </View>
);


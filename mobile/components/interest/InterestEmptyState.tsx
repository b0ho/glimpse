import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import LottieView from 'lottie-react-native';

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
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.PRIMARY + '20' }]}>
        <Icon name={config.icon} size={60} color={colors.PRIMARY} />
      </View>

      <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>
        {config.title}
      </Text>

      <Text style={[styles.description, { color: colors.TEXT.SECONDARY }]}>
        {config.description}
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.PRIMARY }]}
        onPress={onAddPress}
      >
        <Icon name="add-circle-outline" size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>{config.buttonText}</Text>
      </TouchableOpacity>

      {type === 'searches' && (
        <View style={styles.tipsContainer}>
          <Text style={[styles.tipsTitle, { color: colors.TEXT.PRIMARY }]}>
            💡 검색 팁
          </Text>
          <View style={styles.tipsList}>
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
  <View style={styles.tipItem}>
    <Icon name={icon} size={16} color={color} />
    <Text style={[styles.tipText, { color }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 50,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipsContainer: {
    marginTop: 50,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tipText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
});
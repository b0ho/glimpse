import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { AppMode } from '@shared/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

const { width } = Dimensions.get('window');

export const ModeSelectionScreen = () => {
  const navigation = useNavigation() as any;
  const { setAppMode } = useAuthStore();

  const handleModeSelection = (mode: AppMode) => {
    setAppMode(mode);
    // Navigate to main app after mode selection
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Glimpse</Text>
        <Text style={styles.subtitle}>어떤 만남을 원하시나요?</Text>
      </View>

      <View style={styles.modeContainer}>
        {/* Dating Mode */}
        <TouchableOpacity
          style={[styles.modeCard, styles.datingCard]}
          onPress={() => handleModeSelection(AppMode.DATING)}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Icon name="heart" size={60} color={COLORS.PRIMARY} />
          </View>
          <Text style={styles.modeTitle}>애인 찾기</Text>
          <Text style={styles.modeDescription}>
            진지한 만남과 로맨틱한 관계를 원하는 분들을 위한 공간
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• 호감 표현 시스템</Text>
            <Text style={styles.featureItem}>• 1:1 매칭</Text>
            <Text style={styles.featureItem}>• 익명 프로필</Text>
          </View>
        </TouchableOpacity>

        {/* Friendship Mode */}
        <TouchableOpacity
          style={[styles.modeCard, styles.friendshipCard]}
          onPress={() => handleModeSelection(AppMode.FRIENDSHIP)}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Icon name="people" size={60} color="#4ECDC4" />
          </View>
          <Text style={styles.modeTitle}>친구찾기</Text>
          <Text style={styles.modeDescription}>
            취미와 관심사를 공유하는 친구들을 만나는 공간
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• 커뮤니티 게시판</Text>
            <Text style={styles.featureItem}>• 단체 채팅</Text>
            <Text style={styles.featureItem}>• 모임 & 이벤트</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        나중에 프로필 설정에서 모드를 변경할 수 있습니다
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.XXL,
    marginBottom: SPACING.XL,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.TEXT.SECONDARY,
  },
  modeContainer: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
    justifyContent: 'center',
    gap: SPACING.LG,
  },
  modeCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: SPACING.XL,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  datingCard: {
    borderColor: COLORS.PRIMARY + '20',
  },
  friendshipCard: {
    borderColor: '#4ECDC420',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  modeTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  modeDescription: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.MD,
    lineHeight: 22,
  },
  featureList: {
    marginTop: SPACING.SM,
  },
  featureItem: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SPACING.XS,
  },
  note: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.MUTED,
    textAlign: 'center',
    marginBottom: SPACING.XL,
    paddingHorizontal: SPACING.LG,
  },
});
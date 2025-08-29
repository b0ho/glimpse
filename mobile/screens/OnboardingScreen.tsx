/**
 * 온보딩 화면
 * @module screens/OnboardingScreen
 * @description 앱 최초 실행 시 보여주는 온보딩 화면 (2개 페이지)
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

/**
 * 온보딩 화면 컴포넌트
 * @component OnboardingScreen
 * @description 2개의 스와이프 가능한 온보딩 페이지
 */
export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('onboarding');
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // 애니메이션 실행
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentPage]);

  /**
   * 온보딩 완료 처리
   */
  const handleComplete = async () => {
    try {
      // 온보딩 완료 상태 저장
      await AsyncStorage.setItem('@glimpse_onboarding_completed', 'true');
      onComplete();
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      onComplete();
    }
  };

  /**
   * 다음 페이지로 이동
   */
  const goToNextPage = () => {
    if (currentPage === 0) {
      scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: true });
      setCurrentPage(1);
    } else {
      handleComplete();
    }
  };

  /**
   * 스크롤 이벤트 처리
   */
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentPage) {
      setCurrentPage(page);
      // 페이지 변경 시 애니메이션 초기화
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {/* 첫 번째 페이지 - 로고와 간단한 소개 */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <LinearGradient
            colors={[colors.PRIMARY + '20', colors.BACKGROUND]}
            style={styles.gradientBackground}
          />
          
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: currentPage === 0 ? fadeAnim : 1,
                transform: [{ translateY: currentPage === 0 ? slideAnim : 0 }],
              },
            ]}
          >
            {/* 로고 */}
            <View style={[styles.logoContainer, { backgroundColor: colors.PRIMARY + '15' }]}>
              <Icon name="heart" size={80} color={colors.PRIMARY} />
            </View>
            
            {/* 앱 이름 */}
            <Text style={[styles.appName, { color: colors.TEXT.PRIMARY }]}>
              Glimpse
            </Text>
            
            {/* 태그라인 */}
            <Text style={[styles.tagline, { color: colors.TEXT.SECONDARY }]}>
              나를 좋아하는 사람 찾기
            </Text>
            
            {/* 서브 텍스트 */}
            <Text style={[styles.subtitle, { color: colors.TEXT.SECONDARY }]}>
              운명같은 만남, 등만 살짝 떠밀어 드립니다
            </Text>
          </Animated.View>
          
          {/* 하단 인디케이터와 버튼 */}
          <View style={styles.bottomSection}>
            <View style={styles.pageIndicator}>
              <View style={[styles.dot, styles.activeDot, { backgroundColor: colors.PRIMARY }]} />
              <View style={[styles.dot, { backgroundColor: colors.TEXT.DISABLED }]} />
            </View>
            
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: colors.PRIMARY }]}
              onPress={goToNextPage}
            >
              <Text style={styles.nextButtonText}>다음</Text>
              <Icon name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 두 번째 페이지 - 상세 설명 */}
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <LinearGradient
            colors={[colors.SECONDARY + '20', colors.BACKGROUND]}
            style={styles.gradientBackground}
          />
          
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: currentPage === 1 ? fadeAnim : 1,
                  transform: [{ translateY: currentPage === 1 ? slideAnim : 0 }],
                },
              ]}
            >
              {/* 주요 기능 소개 */}
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                완전 익명 보장
              </Text>
              <Text style={[styles.description, { color: colors.TEXT.SECONDARY }]}>
                서로 좋아해야만 닉네임이 공개됩니다.{'\n'}
                먼저 호감을 표현하기는 부담스럽고,{'\n'}
                그렇다고 놓치기에는 아까울 때가 있었죠?
              </Text>

              <View style={styles.featureCard}>
                <Icon name="people-outline" size={30} color={colors.PRIMARY} />
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: colors.TEXT.PRIMARY }]}>
                    그룹 기반 매칭
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.TEXT.SECONDARY }]}>
                    회사, 대학교, 동호회 등 같은 공동체 내에서 만남
                  </Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <Icon name="lock-closed-outline" size={30} color={colors.PRIMARY} />
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: colors.TEXT.PRIMARY }]}>
                    안전한 만남
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.TEXT.SECONDARY }]}>
                    적어도 상처라도 안받을 수 있다면?{'\n'}
                    더이상 실망하지 마세요, 더이상 상처도 받지 마세요
                  </Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <Icon name="time-outline" size={30} color={colors.PRIMARY} />
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: colors.TEXT.PRIMARY }]}>
                    타이밍 확장
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.TEXT.SECONDARY }]}>
                    사랑은 타이밍. 그런데 타이밍을 길게 할 수 있다면?
                  </Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <Icon name="chatbubbles-outline" size={30} color={colors.PRIMARY} />
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: colors.TEXT.PRIMARY }]}>
                    실시간 채팅
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.TEXT.SECONDARY }]}>
                    매칭된 상대와 암호화된 메시지로 안전한 대화
                  </Text>
                </View>
              </View>

              {/* 감성 문구 */}
              <View style={[styles.emotionalCard, { backgroundColor: colors.PRIMARY + '10' }]}>
                <Text style={[styles.emotionalText, { color: colors.PRIMARY }]}>
                  "우리가 이 넓은 세계에서 같은 공동체에 있을 확률...{'\n'}
                  그런 생각 해본 적 없나요?{'\n'}
                  혹시 이름 모를 저 사람이 날 좋아하진 않을까?"
                </Text>
              </View>

              <Text style={[styles.finalMessage, { color: colors.TEXT.SECONDARY }]}>
                어쩌면 인연이었을지도 몰랐던 만남,{'\n'}
                소개팅 백날 해봐야 실망하고 상처받고...{'\n'}
                Glimpse가 연결해드립니다
              </Text>
            </Animated.View>
          </ScrollView>

          {/* 하단 인디케이터와 버튼 */}
          <View style={styles.bottomSection}>
            <View style={styles.pageIndicator}>
              <View style={[styles.dot, { backgroundColor: colors.TEXT.DISABLED }]} />
              <View style={[styles.dot, styles.activeDot, { backgroundColor: colors.PRIMARY }]} />
            </View>
            
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: colors.PRIMARY }]}
              onPress={handleComplete}
            >
              <Text style={styles.startButtonText}>시작하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Skip 버튼 (첫 페이지에서만 표시) */}
      {currentPage === 0 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleComplete}
        >
          <Text style={[styles.skipButtonText, { color: colors.TEXT.SECONDARY }]}>
            건너뛰기
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SCREEN_HEIGHT * 0.6,
  },
  page: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 120,
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 30,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  emotionalCard: {
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
    marginBottom: 20,
  },
  emotionalText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  finalMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomSection: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    height: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    padding: 10,
  },
  skipButtonText: {
    fontSize: 16,
  },
});
/**
 * 온보딩 화면 (NativeWind)
 * @module screens/OnboardingScreen
 * @description 앱 최초 실행 시 보여주는 온보딩 화면 (2개 페이지)
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { useNavigation } from '@react-navigation/native';
import { cn } from '@/lib/utils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 온보딩 화면 컴포넌트
 * @component OnboardingScreen
 * @description 2개의 스와이프 가능한 온보딩 페이지
 */
type OnboardingScreenProps = {
  onComplete: () => void;
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('onboarding');
  const navigation = useNavigation() as any;
  const [currentPage, setCurrentPage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [dimensions, setDimensions] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });

  // onComplete는 상위(AppNavigator)에서 전달됨 (온보딩 상태 갱신)

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


  // Dimensions 업데이트 처리
  useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get('window');
      setDimensions({ width, height });
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

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
      setCurrentPage(1);
      // 페이지 변경 시 애니메이션 초기화
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    } else {
      handleComplete();
    }
  };


  return (
    <View className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
      <View className="flex-1 relative">
        {/* 첫 번째 페이지 - 로고와 간단한 소개 */}
        {currentPage === 0 && (
        <View className="flex-1 justify-between overflow-hidden" style={{ width: dimensions.width }}>
          <LinearGradient
            colors={[colors.PRIMARY + '20', 'transparent']}
            className="absolute left-0 right-0 top-0"
            style={{ height: SCREEN_HEIGHT * 0.6 }}
          />

          <Animated.View
            className="flex-1 items-center justify-center px-10"
            style={{
              opacity: currentPage === 0 ? fadeAnim : 1,
              transform: [{ translateY: currentPage === 0 ? slideAnim : 0 }],
            }}
          >
            {/* 로고 */}
            <View className="w-36 h-36 rounded-full items-center justify-center mb-7 bg-blue-50 dark:bg-blue-900/20">
              <Icon name="heart" size={80} color={colors.PRIMARY} />
            </View>

            {/* 앱 이름 */}
            <Text className="text-5xl font-bold mb-2 text-gray-900 dark:text-white">
              Glimpse
            </Text>

            {/* 태그라인 */}
            <Text className="text-xl font-semibold mb-5 text-gray-600 dark:text-gray-400">
              나를 좋아하는 사람 찾기
            </Text>

            {/* 서브 텍스트 */}
            <Text className="text-base text-center leading-6 px-5 text-gray-600 dark:text-gray-400">
              운명같은 만남, 등만 살짝 떠밀어 드립니다
            </Text>
          </Animated.View>

          {/* 하단 인디케이터와 버튼 */}
          <View
            className={cn(
              "absolute left-0 right-0 px-10",
              Platform.OS === 'ios' ? "bottom-10" : "bottom-7"
            )}
          >
            <View className="flex-row justify-center mb-5">
              <View className="w-6 h-2 rounded mx-1 bg-blue-500" />
              <View className="w-2 h-2 rounded mx-1 bg-gray-300 dark:bg-gray-700" />
            </View>

            <TouchableOpacity
              className="flex-row items-center justify-center py-4 rounded-xl bg-blue-500 active:opacity-80"
              onPress={goToNextPage}
            >
              <Text className="text-white text-lg font-semibold mr-2">다음</Text>
              <Icon name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        )}

        {/* 두 번째 페이지 - 상세 설명 */}
        {currentPage === 1 && (
        <View className="flex-1 justify-between overflow-hidden" style={{ width: dimensions.width }}>
          <LinearGradient
            colors={[colors.SECONDARY + '20', 'transparent']}
            className="absolute left-0 right-0 top-0"
            style={{ height: SCREEN_HEIGHT * 0.6 }}
          />

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: Platform.OS === 'ios' ? 60 : 40,
              paddingBottom: 120,
            }}
          >
            <Animated.View
              className="flex-1 items-center justify-center px-10"
              style={{
                opacity: currentPage === 1 ? fadeAnim : 1,
                transform: [{ translateY: currentPage === 1 ? slideAnim : 0 }],
              }}
            >
              {/* 주요 기능 소개 */}
              <Text className="text-3xl font-bold mb-4 text-center text-gray-900 dark:text-white">
                완전 익명 보장
              </Text>
              <Text className="text-base leading-6 text-center mb-7 text-gray-600 dark:text-gray-400">
                서로 좋아해야만 닉네임이 공개됩니다.{'\n'}
                먼저 호감을 표현하기는 부담스럽고,{'\n'}
                그렇다고 놓치기에는 아까울 때가 있었죠?
              </Text>

              <View className="flex-row items-center mb-6 px-5">
                <Icon name="people-outline" size={30} color={colors.PRIMARY} />
                <View className="flex-1 ml-4">
                  <Text className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
                    그룹 기반 매칭
                  </Text>
                  <Text className="text-sm leading-5 text-gray-600 dark:text-gray-400">
                    회사, 대학교, 동호회 등 같은 공동체 내에서 만남
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-6 px-5">
                <Icon name="lock-closed-outline" size={30} color={colors.PRIMARY} />
                <View className="flex-1 ml-4">
                  <Text className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
                    안전한 만남
                  </Text>
                  <Text className="text-sm leading-5 text-gray-600 dark:text-gray-400">
                    적어도 상처라도 안받을 수 있다면?{'\n'}
                    더이상 실망하지 마세요, 더이상 상처도 받지 마세요
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-6 px-5">
                <Icon name="time-outline" size={30} color={colors.PRIMARY} />
                <View className="flex-1 ml-4">
                  <Text className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
                    타이밍 확장
                  </Text>
                  <Text className="text-sm leading-5 text-gray-600 dark:text-gray-400">
                    사랑은 타이밍. 그런데 타이밍을 길게 할 수 있다면?
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-6 px-5">
                <Icon name="chatbubbles-outline" size={30} color={colors.PRIMARY} />
                <View className="flex-1 ml-4">
                  <Text className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
                    실시간 채팅
                  </Text>
                  <Text className="text-sm leading-5 text-gray-600 dark:text-gray-400">
                    매칭된 상대와 암호화된 메시지로 안전한 대화
                  </Text>
                </View>
              </View>

              {/* 감성 문구 */}
              <View className="p-5 rounded-2xl mt-5 mb-5 bg-blue-50 dark:bg-blue-900/10">
                <Text className="text-sm leading-6 italic text-center text-blue-500">
                  "우리가 이 넓은 세계에서 같은 공동체에 있을 확률...{'\n'}
                  그런 생각 해본 적 없나요?{'\n'}
                  혹시 이름 모를 저 사람이 날 좋아하진 않을까?"
                </Text>
              </View>

              <Text className="text-base leading-6 text-center font-medium text-gray-600 dark:text-gray-400">
                어쩌면 인연이었을지도 몰랐던 만남,{'\n'}
                소개팅 백날 해봐야 실망하고 상처받고...{'\n'}
                Glimpse가 연결해드립니다
              </Text>
            </Animated.View>
          </ScrollView>

          {/* 하단 인디케이터와 버튼 */}
          <View
            className={cn(
              "absolute left-0 right-0 px-10",
              Platform.OS === 'ios' ? "bottom-10" : "bottom-7"
            )}
          >
            <View className="flex-row justify-center mb-5">
              <View className="w-2 h-2 rounded mx-1 bg-gray-300 dark:bg-gray-700" />
              <View className="w-6 h-2 rounded mx-1 bg-blue-500" />
            </View>

            <TouchableOpacity
              className="py-4 rounded-xl items-center bg-blue-500 active:opacity-80"
              onPress={handleComplete}
            >
              <Text className="text-white text-lg font-semibold">시작하기</Text>
            </TouchableOpacity>
          </View>
        </View>
        )}
      </View>

      {/* Skip 버튼 (첫 페이지에서만 표시) */}
      {currentPage === 0 && (
        <TouchableOpacity
          className={cn(
            "absolute right-5 p-2",
            Platform.OS === 'ios' ? "top-12" : "top-7"
          )}
          onPress={handleComplete}
        >
          <Text className="text-base text-gray-600 dark:text-gray-400">
            건너뛰기
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

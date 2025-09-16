import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';

/**
 * TypingIndicator 컴포넌트 Props
 * @interface TypingIndicatorProps
 */
interface TypingIndicatorProps {
  /** 타이핑 상태 */
  isTyping: boolean;
  /** 타이핑 중인 사용자 이름 */
  userName?: string;
}

/**
 * 타이핑 표시기 컴포넌트 - 상대방이 입력 중임을 표시
 * @component
 * @param {TypingIndicatorProps} props - 컴포넌트 속성
 * @returns {JSX.Element | null} 타이핑 표시기 UI
 * @description 세 개의 점이 위아래로 움직이는 애니메이션으로 타이핑 상태 표시
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isTyping,
  userName,
}) => {
  const { t } = useAndroidSafeTranslation('chat');
  const { colors } = useTheme();
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTyping) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Animate dots
      const animateDot = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animation1 = animateDot(dot1, 0);
      const animation2 = animateDot(dot2, 150);
      const animation3 = animateDot(dot3, 300);

      animation1.start();
      animation2.start();
      animation3.start();

      return () => {
        animation1.stop();
        animation2.stop();
        animation3.stop();
      };
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isTyping, dot1, dot2, dot3, fadeAnim]);

  if (!isTyping) {
    return null;
  }

  return (
    <Animated.View
      className="px-4 py-2"
      style={{
        opacity: fadeAnim,
      }}
    >
      <View className="flex-row items-center self-start">
        <View className="flex-row items-center px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800">
          <Text className="text-sm mr-2 text-gray-600 dark:text-gray-400">
            {userName ? t('notifications:notifications.typing', { name: userName }) : t('notification:notifications.typingDefault')}
          </Text>
          <View className="flex-row items-center">
            <Animated.View
              className="w-1 h-1 rounded-full mx-0.5 bg-gray-600 dark:bg-gray-400"
              style={{
                transform: [
                  {
                    translateY: dot1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              }}
            />
            <Animated.View
              className="w-1 h-1 rounded-full mx-0.5 bg-gray-600 dark:bg-gray-400"
              style={{
                transform: [
                  {
                    translateY: dot2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              }}
            />
            <Animated.View
              className="w-1 h-1 rounded-full mx-0.5 bg-gray-600 dark:bg-gray-400"
              style={{
                transform: [
                  {
                    translateY: dot3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              }}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};
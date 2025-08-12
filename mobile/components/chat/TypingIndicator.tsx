import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { FONTS, SIZES } from '../../constants/theme';

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
export const TypingIndicator= ({
  isTyping,
  userName,
}) => {
  const { t } = useTranslation(['chat']);
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
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.bubbleContainer}>
        <View style={[styles.textContainer, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.typingText, { color: colors.TEXT.SECONDARY }]}>
            {userName ? t('notifications.typing', { name: userName }) : t('notifications.typingDefault')}
          </Text>
          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: colors.TEXT.SECONDARY },
                {
                  transform: [
                    {
                      translateY: dot1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: colors.TEXT.SECONDARY },
                {
                  transform: [
                    {
                      translateY: dot2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: colors.TEXT.SECONDARY },
                {
                  transform: [
                    {
                      translateY: dot3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
  },
  bubbleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
  },
  typingText: {
    ...FONTS.body4,
    marginRight: SIZES.base,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
});
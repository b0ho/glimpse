/**
 * 타이핑 인디케이터 컴포넌트
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

interface TypingIndicatorProps {
  typingUsers: string[];
  visible?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = React.memo(({
  typingUsers,
  visible = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  const isTyping = visible && typingUsers.length > 0;

  useEffect(() => {
    if (isTyping) {
      // 페이드 인
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // 점 애니메이션
      const createDotAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              delay,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
      };

      const dotAnimations = [
        createDotAnimation(dot1Anim, 0),
        createDotAnimation(dot2Anim, 200),
        createDotAnimation(dot3Anim, 400),
      ];

      Animated.parallel(dotAnimations).start();
    } else {
      // 페이드 아웃
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // 애니메이션 정지
      [dot1Anim, dot2Anim, dot3Anim].forEach(anim => {
        anim.stopAnimation();
        anim.setValue(0);
      });
    }
  }, [isTyping, fadeAnim, dot1Anim, dot2Anim, dot3Anim]);

  // 컴포넌트 언마운트 시 애니메이션 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      // 모든 애니메이션 정지 및 정리
      [fadeAnim, dot1Anim, dot2Anim, dot3Anim].forEach(anim => {
        anim.stopAnimation();
        anim.setValue(0);
      });
    };
  }, [fadeAnim, dot1Anim, dot2Anim, dot3Anim]);

  if (!isTyping) {
    return null;
  }

  const getTypingText = () => {
    const count = typingUsers.length;
    if (count === 1) {
      return `${typingUsers[0]}님이 입력 중`;
    } else if (count === 2) {
      return `${typingUsers[0]}님과 ${typingUsers[1]}님이 입력 중`;
    } else {
      return `${typingUsers[0]}님 외 ${count - 1}명이 입력 중`;
    }
  };

  const renderDot = (animValue: Animated.Value, key: string) => {
    const opacity = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    const scale = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1.2],
    });

    return (
      <Animated.View
        key={key}
        style={[
          styles.dot,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      />
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
      accessibilityLabel={getTypingText()}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        
        <View style={styles.bubble}>
          <Text style={styles.typingText}>{getTypingText()}</Text>
          <View style={styles.dotsContainer}>
            {renderDot(dot1Anim, 'dot1')}
            {renderDot(dot2Anim, 'dot2')}
            {renderDot(dot3Anim, 'dot3')}
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  avatarText: {
    fontSize: FONT_SIZES.SM,
  },
  bubble: {
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    elevation: 1,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '75%',
  },
  typingText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    fontStyle: 'italic',
    marginRight: SPACING.SM,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.TEXT.SECONDARY,
    marginHorizontal: 1,
  },
});
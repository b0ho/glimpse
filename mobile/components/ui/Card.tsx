import React from 'react';
import { View, TouchableOpacity, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  gradient?: boolean;
  gradientColors?: string[];
  onPress?: () => void;
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  style,
  gradient = false,
  gradientColors = ['#FF6B6B', '#FF8A8A'],
  onPress,
  animate = false,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animate) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animate]);

  const handlePressIn = () => {
    if (onPress) {
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const content = gradient ? (
    <LinearGradient
      colors={gradientColors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={`rounded-2xl ${className}`}
      style={style}
    >
      {children}
    </LinearGradient>
  ) : (
    <View 
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm ${className}`}
      style={style}
    >
      {children}
    </View>
  );

  if (animate) {
    const animatedContent = (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {content}
      </Animated.View>
    );

    if (onPress) {
      return (
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          {animatedContent}
        </TouchableOpacity>
      );
    }

    return animatedContent;
  }

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Specialized dating app card variants
export const MatchCard: React.FC<CardProps> = (props) => (
  <Card
    gradient
    gradientColors={['#FF6B6B', '#FF8A8A']}
    animate
    className="p-4"
    {...props}
  />
);

export const PremiumCard: React.FC<CardProps> = (props) => (
  <Card
    gradient
    gradientColors={['#FFD700', '#FFA500']}
    animate
    className="p-4"
    {...props}
  />
);

export const GroupCard: React.FC<CardProps> = (props) => (
  <Card
    gradient
    gradientColors={['#8B5CF6', '#7C3AED']}
    animate
    className="p-4"
    {...props}
  />
);
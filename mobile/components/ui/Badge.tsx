import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconWrapper as Icon } from '@/components/IconWrapper';

interface BadgeProps {
  children?: React.ReactNode;
  text?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'premium';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  onPress?: () => void;
  gradient?: boolean;
  animate?: boolean;
  className?: string;
}

const variantStyles = {
  default: {
    bg: 'bg-gray-200 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    gradient: ['#E5E7EB', '#D1D5DB'],
  },
  primary: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-600 dark:text-pink-400',
    gradient: ['#FF6B6B', '#FF8A8A'],
  },
  success: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    gradient: ['#10B981', '#34D399'],
  },
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    gradient: ['#F59E0B', '#FCD34D'],
  },
  error: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    gradient: ['#EF4444', '#F87171'],
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    gradient: ['#3B82F6', '#60A5FA'],
  },
  premium: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    gradient: ['#FFD700', '#FFA500'],
  },
};

const sizeStyles = {
  xs: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    iconSize: 12,
  },
  sm: {
    padding: 'px-2.5 py-1',
    text: 'text-sm',
    iconSize: 14,
  },
  md: {
    padding: 'px-3 py-1.5',
    text: 'text-base',
    iconSize: 16,
  },
  lg: {
    padding: 'px-4 py-2',
    text: 'text-lg',
    iconSize: 20,
  },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  text,
  variant = 'default',
  size = 'sm',
  icon,
  iconPosition = 'left',
  onPress,
  gradient = false,
  animate = false,
  className = '',
}) => {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animate) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
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

  const iconColor = gradient ? '#FFFFFF' : variantStyle.text.split(' ')[0].replace('text-', '#');

  const content = (
    <View className="flex-row items-center space-x-1">
      {icon && iconPosition === 'left' && (
        <Icon name={icon} size={sizeStyle.iconSize} color={iconColor} />
      )}
      {text && (
        <Text className={`${sizeStyle.text} font-semibold ${gradient ? 'text-white' : variantStyle.text}`}>
          {text}
        </Text>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <Icon name={icon} size={sizeStyle.iconSize} color={iconColor} />
      )}
    </View>
  );

  const badgeContent = gradient ? (
    <LinearGradient
      colors={variantStyle.gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className={`rounded-full ${sizeStyle.padding} ${className}`}
    >
      {content}
    </LinearGradient>
  ) : (
    <View className={`${variantStyle.bg} rounded-full ${sizeStyle.padding} ${className}`}>
      {content}
    </View>
  );

  const animatedBadge = animate ? (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      {badgeContent}
    </Animated.View>
  ) : badgeContent;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {animatedBadge}
      </TouchableOpacity>
    );
  }

  return animatedBadge;
};

// Specialized badge variants for dating app
export const MatchBadge: React.FC<Omit<BadgeProps, 'variant' | 'gradient'>> = (props) => (
  <Badge
    variant="primary"
    gradient
    icon="heart"
    animate
    {...props}
  />
);

export const PremiumBadge: React.FC<Omit<BadgeProps, 'variant' | 'gradient'>> = (props) => (
  <Badge
    variant="premium"
    gradient
    icon="star"
    animate
    {...props}
  />
);

export const OnlineBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge
    variant="success"
    icon="ellipse"
    size="xs"
    text="온라인"
    animate
    {...props}
  />
);

export const NewBadge: React.FC<Omit<BadgeProps, 'variant' | 'gradient'>> = (props) => (
  <Badge
    variant="error"
    gradient
    text="NEW"
    size="xs"
    animate
    {...props}
  />
);

export const VerifiedBadge: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge
    variant="info"
    icon="checkmark-circle"
    iconPosition="left"
    text="인증됨"
    size="sm"
    {...props}
  />
);
/**
 * Button 컴포넌트
 *
 * @module Button
 * @description NativeWind v4를 사용한 범용 버튼 컴포넌트. 다양한 스타일 변형과 크기를 지원합니다.
 */

import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native'
import { cn } from '@/lib/utils'
import { LinearGradient } from 'expo-linear-gradient'

/**
 * Button Props 인터페이스
 *
 * @interface ButtonProps
 */
export interface ButtonProps {
  /** 버튼 내부에 표시될 콘텐츠 */
  children: React.ReactNode
  /** 버튼 클릭 시 실행될 핸들러 */
  onPress?: () => void
  /** 버튼 비활성화 여부 */
  disabled?: boolean
  /** 로딩 상태 표시 여부 (ActivityIndicator 표시) */
  loading?: boolean
  /** 버튼 스타일 변형 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient'
  /** 버튼 크기 */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** 추가 Tailwind 클래스 */
  className?: string
  /** 텍스트에 적용될 추가 Tailwind 클래스 */
  textClassName?: string
  /** 좌측에 표시될 아이콘 */
  leftIcon?: React.ReactNode
  /** 우측에 표시될 아이콘 */
  rightIcon?: React.ReactNode
  /** gradient 변형 사용 시 적용될 색상 배열 */
  gradientColors?: string[]
}

const variantClasses = {
  primary: 'bg-primary-500 active:bg-primary-600',
  secondary: 'bg-secondary-500 active:bg-secondary-600',
  outline: 'border-2 border-primary-500 bg-transparent',
  ghost: 'bg-transparent',
  gradient: '',
}

const sizeClasses = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-6 py-4',
  xl: 'px-8 py-5',
}

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
}

const textVariantClasses = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-primary-500',
  ghost: 'text-gray-700 dark:text-gray-300',
  gradient: 'text-white',
}

/**
 * Button 컴포넌트
 *
 * @component
 * @param {ButtonProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 버튼 UI
 *
 * @description
 * NativeWind v4를 사용하여 구현된 범용 버튼 컴포넌트입니다.
 * - 5가지 스타일 변형 (primary, secondary, outline, ghost, gradient)
 * - 4가지 크기 옵션 (sm, md, lg, xl)
 * - 로딩 상태 및 비활성화 상태 지원
 * - 좌/우 아이콘 지원
 * - gradient 변형은 LinearGradient를 사용하여 그라디언트 배경 제공
 *
 * @example
 * ```tsx
 * // 기본 버튼
 * <Button onPress={handleClick}>확인</Button>
 *
 * // 로딩 상태
 * <Button loading>처리 중...</Button>
 *
 * // 아이콘이 있는 버튼
 * <Button leftIcon={<Icon name="heart" />} variant="outline">
 *   좋아요
 * </Button>
 *
 * // 그라디언트 버튼
 * <Button variant="gradient" gradientColors={['#FF6B6B', '#FF5252']}>
 *   프리미엄 가입
 * </Button>
 * ```
 *
 * @category Component
 * @subcategory UI
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  className,
  textClassName,
  leftIcon,
  rightIcon,
  gradientColors = ['#FF6B6B', '#FF5252'],
}) => {
  const isDisabled = disabled || loading

  const buttonContent = (
    <View className="flex-row items-center justify-center">
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? '#FF6B6B' : 'white'} 
        />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text
            className={cn(
              'font-semibold',
              textSizeClasses[size],
              textVariantClasses[variant],
              isDisabled && 'opacity-50',
              textClassName
            )}
          >
            {children}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </View>
  )

  if (variant === 'gradient' && !isDisabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        className={cn('overflow-hidden', className)}
      >
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className={cn(
            'rounded-2xl',
            sizeClasses[size],
            'items-center justify-center'
          )}
        >
          {buttonContent}
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      className={cn(
        'rounded-2xl items-center justify-center',
        variantClasses[variant],
        sizeClasses[size],
        isDisabled && 'opacity-50',
        variant === 'gradient' && isDisabled && 'bg-gray-400',
        className
      )}
    >
      {buttonContent}
    </TouchableOpacity>
  )
}
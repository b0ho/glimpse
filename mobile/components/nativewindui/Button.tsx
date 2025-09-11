import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native'
import { cn } from '@/lib/utils'
import { LinearGradient } from 'expo-linear-gradient'

export interface ButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  textClassName?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
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
          colors={gradientColors}
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
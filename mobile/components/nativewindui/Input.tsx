import React, { forwardRef } from 'react'
import { TextInput, View, Text, TextInputProps } from 'react-native'
import { cn } from '@/lib/utils'

export interface InputProps extends TextInputProps {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
  inputClassName?: string
  labelClassName?: string
  errorClassName?: string
  variant?: 'default' | 'filled' | 'outline'
}

const variantClasses = {
  default: 'border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950',
  filled: 'bg-gray-100 dark:bg-gray-900',
  outline: 'border-2 border-gray-300 dark:border-gray-700 bg-transparent',
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      containerClassName,
      inputClassName,
      labelClassName,
      errorClassName,
      variant = 'default',
      ...props
    },
    ref
  ) => {
    return (
      <View className={cn('w-full', containerClassName)}>
        {label && (
          <Text
            className={cn(
              'text-sm font-medium text-gray-700 dark:text-gray-300 mb-2',
              labelClassName
            )}
          >
            {label}
          </Text>
        )}
        <View
          className={cn(
            'flex-row items-center rounded-xl px-4',
            variantClasses[variant],
            error && 'border-error',
            leftIcon && 'pl-3',
            rightIcon && 'pr-3'
          )}
        >
          {leftIcon && <View className="mr-3">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className={cn(
              'flex-1 py-4 text-base text-gray-900 dark:text-white',
              inputClassName
            )}
            placeholderTextColor="#9CA3AF"
            {...props}
          />
          {rightIcon && <View className="ml-3">{rightIcon}</View>}
        </View>
        {error && (
          <Text
            className={cn(
              'text-sm text-error mt-1',
              errorClassName
            )}
          >
            {error}
          </Text>
        )}
      </View>
    )
  }
)

Input.displayName = 'Input'
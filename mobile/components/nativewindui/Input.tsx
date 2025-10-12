/**
 * Input 컴포넌트
 *
 * @module Input
 * @description NativeWind v4를 사용한 범용 텍스트 입력 컴포넌트. 레이블, 에러 메시지, 아이콘을 지원합니다.
 */

import React, { forwardRef } from 'react'
import { TextInput, View, Text, TextInputProps } from 'react-native'
import { cn } from '@/lib/utils'

/**
 * Input Props 인터페이스
 *
 * @interface InputProps
 * @extends {TextInputProps}
 */
export interface InputProps extends TextInputProps {
  /** 입력 필드 상단에 표시될 레이블 */
  label?: string
  /** 입력 필드 하단에 표시될 에러 메시지 */
  error?: string
  /** 좌측에 표시될 아이콘 */
  leftIcon?: React.ReactNode
  /** 우측에 표시될 아이콘 */
  rightIcon?: React.ReactNode
  /** 컨테이너에 적용될 추가 Tailwind 클래스 */
  containerClassName?: string
  /** 입력 필드에 적용될 추가 Tailwind 클래스 */
  inputClassName?: string
  /** 레이블에 적용될 추가 Tailwind 클래스 */
  labelClassName?: string
  /** 에러 메시지에 적용될 추가 Tailwind 클래스 */
  errorClassName?: string
  /** 입력 필드 스타일 변형 */
  variant?: 'default' | 'filled' | 'outline'
}

const variantClasses = {
  default: 'border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950',
  filled: 'bg-gray-100 dark:bg-gray-900',
  outline: 'border-2 border-gray-300 dark:border-gray-700 bg-transparent',
}

/**
 * Input 컴포넌트
 *
 * @component
 * @param {InputProps} props - 컴포넌트 속성
 * @param {React.Ref<TextInput>} ref - TextInput ref
 * @returns {JSX.Element} 입력 필드 UI
 *
 * @description
 * NativeWind v4를 사용하여 구현된 범용 텍스트 입력 컴포넌트입니다.
 * - 3가지 스타일 변형 (default, filled, outline)
 * - 레이블 및 에러 메시지 표시 지원
 * - 좌/우 아이콘 지원
 * - forwardRef를 통한 ref 전달 가능
 * - 다크모드 자동 지원
 *
 * @example
 * ```tsx
 * // 기본 입력 필드
 * <Input label="이메일" placeholder="이메일을 입력하세요" />
 *
 * // 에러 상태
 * <Input
 *   label="비밀번호"
 *   error="비밀번호는 8자 이상이어야 합니다"
 *   secureTextEntry
 * />
 *
 * // 아이콘이 있는 입력 필드
 * <Input
 *   leftIcon={<Icon name="search" />}
 *   placeholder="검색"
 *   variant="filled"
 * />
 * ```
 *
 * @category Component
 * @subcategory UI
 */
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
import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation'
import { useAuthService } from '@/services/auth/auth-service'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/nativewindui/Button'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { cn } from '@/lib/utils'

interface SMSVerificationScreenProps {
  phoneNumber: string
  onVerificationSuccess: () => void
  onBack?: () => void
}

export const SMSVerificationScreen = ({
  phoneNumber,
  onVerificationSuccess,
  onBack,
}: SMSVerificationScreenProps) => {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const authService = useAuthService()
  const { t } = useAndroidSafeTranslation('auth')
  const { isDarkMode } = useTheme()
  
  // Refs for input boxes
  const inputRefs = useRef<(TextInput | null)[]>([])
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const shakeAnim = useRef(new Animated.Value(0)).current
  const codeBoxAnimations = useRef(
    Array(6).fill(0).map(() => new Animated.Value(0))
  ).current
  
  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start()
    
    // Staggered animation for code boxes
    const staggerDelay = 80
    codeBoxAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * staggerDelay,
        useNativeDriver: true,
      }).start()
    })
    
    // Auto-focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 800)
  }, [])
  
  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])
  
  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start()
  }
  
  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code]
    
    // Handle paste
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split('')
      for (let i = 0; i < pastedCode.length && index + i < 6; i++) {
        newCode[index + i] = pastedCode[i]
      }
      setCode(newCode)
      
      // Focus last filled input or next empty
      const lastFilledIndex = Math.min(index + pastedCode.length - 1, 5)
      inputRefs.current[lastFilledIndex]?.focus()
      
      // Auto-submit if all filled
      if (newCode.every(digit => digit !== '')) {
        handleVerifyCode(newCode.join(''))
      }
      return
    }
    
    // Single character input
    newCode[index] = value
    setCode(newCode)
    
    // Move to next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    
    // Auto-submit when all digits entered
    if (index === 5 && value !== '' && newCode.every(digit => digit !== '')) {
      handleVerifyCode(newCode.join(''))
    }
  }
  
  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }
  
  const handleVerifyCode = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('')
    
    if (codeToVerify.length !== 6) {
      shakeAnimation()
      Alert.alert(t('common:errors.error'), t('auth:smsVerification.errors.invalidCode'))
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await authService.verifyPhoneCode(codeToVerify)
      
      if (result.success) {
        // Success animation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onVerificationSuccess()
        })
      } else {
        shakeAnimation()
        Alert.alert(t('common:errors.error'), result.error || t('auth:smsVerification.errors.verificationFailed'))
        
        // Clear code on error
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      shakeAnimation()
      Alert.alert(t('common:errors.error'), t('auth:smsVerification.errors.networkError'))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleResendCode = async () => {
    if (resendTimer > 0) return
    
    setIsResending(true)
    
    try {
      const result = await authService.signInWithPhone(phoneNumber)
      
      if (result.success) {
        Alert.alert(
          t('auth:smsVerification.resend.success.title'),
          t('auth:smsVerification.resend.success.message')
        )
        setResendTimer(60)
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        Alert.alert(t('common:errors.error'), result.error || t('auth:smsVerification.resend.error'))
      }
    } catch (error) {
      Alert.alert(t('common:errors.error'), t('auth:smsVerification.errors.networkError'))
    } finally {
      setIsResending(false)
    }
  }
  
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`
  }
  
  return (
    <SafeAreaView className={cn('flex-1', isDarkMode ? 'bg-gray-950' : 'bg-gray-50')}>
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          {onBack && (
            <View className="px-6 pt-4 pb-2">
              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                className="flex-row items-center self-start px-3 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20"
              >
                <Ionicons 
                  name="arrow-back" 
                  size={20} 
                  color={isDarkMode ? '#FF8A8A' : '#FF6B6B'} 
                />
                <Text className="ml-2 text-primary-500 dark:text-primary-400 font-medium">
                  뒤로가기
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Content */}
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
            className="flex-1 px-6 justify-center"
          >
            {/* Icon & Title Section */}
            <View className="items-center mb-8">
              <View className="mb-6">
                <LinearGradient
                  colors={isDarkMode ? ['#FF8A8A', '#FF6B6B'] : ['#FF6B6B', '#FF5252']}
                  className="w-20 h-20 rounded-full items-center justify-center shadow-lg"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="chatbubbles" size={36} color="white" />
                </LinearGradient>
              </View>
              
              <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
                {t('auth:smsVerification.title')}
              </Text>
              
              <Text className="text-gray-600 dark:text-gray-400 text-center px-8">
                {t('auth:smsVerification.subtitle', { phone: formatPhoneNumber(phoneNumber) })}
              </Text>
            </View>
            
            {/* Code Input Boxes */}
            <Animated.View
              style={{
                transform: [{ translateX: shakeAnim }],
              }}
              className="mb-8"
            >
              <View className="flex-row justify-center space-x-3">
                {code.map((digit, index) => (
                  <Animated.View
                    key={index}
                    style={{
                      opacity: codeBoxAnimations[index],
                      transform: [
                        {
                          scale: codeBoxAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                    }}
                  >
                    <View
                      className={cn(
                        'w-12 h-14 rounded-xl border-2',
                        digit !== '' 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                          : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900'
                      )}
                    >
                      <TextInput
                        ref={ref => (inputRefs.current[index] = ref)}
                        value={digit}
                        onChangeText={(value) => handleCodeChange(value, index)}
                        onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                        keyboardType="number-pad"
                        maxLength={index === 0 ? 6 : 1}
                        selectTextOnFocus
                        className="flex-1 text-center text-2xl font-bold text-gray-900 dark:text-white"
                        style={{ paddingTop: Platform.OS === 'ios' ? 10 : 8 }}
                      />
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
            
            {/* Actions */}
            <View className="space-y-4">
              {/* Verify Button */}
              <Button
                onPress={() => handleVerifyCode()}
                disabled={code.some(digit => digit === '')}
                loading={isLoading}
                variant="gradient"
                size="lg"
                gradientColors={isDarkMode ? ['#FF8A8A', '#FF6B6B'] : ['#FF6B6B', '#FF5252']}
                rightIcon={
                  !isLoading && (
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                  )
                }
              >
                {isLoading ? t('auth:smsVerification.verifyingButton') : t('auth:smsVerification.verifyButton')}
              </Button>
              
              {/* Resend Code */}
              <View className="items-center">
                {resendTimer > 0 ? (
                  <View className="flex-row items-center">
                    <Ionicons 
                      name="time-outline" 
                      size={16} 
                      color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                    />
                    <Text className="ml-2 text-gray-500 dark:text-gray-400">
                      {t('auth:smsVerification.resendTimer', { seconds: resendTimer })}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={isResending}
                    activeOpacity={0.7}
                    className="flex-row items-center px-4 py-2"
                  >
                    {isResending ? (
                      <ActivityIndicator size="small" color={isDarkMode ? '#FF8A8A' : '#FF6B6B'} />
                    ) : (
                      <>
                        <Ionicons 
                          name="refresh" 
                          size={18} 
                          color={isDarkMode ? '#FF8A8A' : '#FF6B6B'} 
                        />
                        <Text className="ml-2 text-primary-500 dark:text-primary-400 font-medium">
                          {t('auth:smsVerification.resendButton')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Help Text */}
              <View className="items-center mt-4">
                <Text className="text-xs text-gray-500 dark:text-gray-400 text-center px-8">
                  {t('auth:smsVerification.helpText')}
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
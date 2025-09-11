import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native'
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation'
import { useAuthService } from '@/services/auth/auth-service'
import { useTheme } from '@/hooks/useTheme'
import { validatePhoneNumber as validatePhone } from '@/services/auth/clerk-config'
import { Button } from '@/components/nativewindui/Button'
import { Input } from '@/components/nativewindui/Input'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { cn } from '@/lib/utils'
// Global CSS is imported in App.tsx

const { width } = Dimensions.get('window')

interface PhoneVerificationScreenProps {
  onVerificationSent: (phoneNumber: string) => void
  authMode?: 'signin' | 'signup'
  onBack?: () => void
}

export const PhoneVerificationScreen = ({
  onVerificationSent,
  authMode = 'signin',
  onBack,
}: PhoneVerificationScreenProps) => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const authService = useAuthService()
  const { t } = useAndroidSafeTranslation('auth')
  const { isDarkMode } = useTheme()
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  
  useEffect(() => {
    // Fade in animation
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
  }, [])
  
  const formatPhoneInput = (input: string): string => {
    const numbers = input.replace(/\D/g, '')
    
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const handleSendVerification = async (): Promise<void> => {
    console.log('🔍 handleSendVerification called')
    console.log('📱 Phone number:', phoneNumber)
    console.log('🎯 Auth mode:', authMode)
    
    if (!phoneNumber.trim()) {
      console.log('❌ Phone number is empty')
      Alert.alert(t('common:errors.error'), t('auth:phoneVerification.errors.phoneRequired'))
      return
    }

    const rawNumbers = phoneNumber.replace(/\D/g, '')
    console.log('📞 Raw numbers:', rawNumbers)
    
    if (!validatePhone(rawNumbers)) {
      console.log('❌ Phone validation failed')
      Alert.alert(t('common:errors.error'), t('auth:phoneVerification.errors.invalidPhone'))
      return
    }

    console.log('⏳ Starting verification process')
    setIsLoading(true)

    try {
      console.log('🚀 Calling auth service, mode:', authMode)
      const result = authMode === 'signup' 
        ? await authService.signUpWithPhone(rawNumbers)
        : await authService.signInWithPhone(rawNumbers)
      
      console.log('📨 Auth service result:', result)
      
      if (result.success) {
        const titleKey = authMode === 'signup' ? 'phoneVerification.signup.success.title' : 'phoneVerification.success.title'
        const messageKey = authMode === 'signup' ? 'phoneVerification.signup.success.message' : 'phoneVerification.success.message'
        
        console.log('✅ Success, moving to SMS verification')
        
        if (Platform.OS === 'web') {
          onVerificationSent(rawNumbers)
          window.alert(`${t(titleKey)}\n${t(messageKey)}`)
        } else {
          Alert.alert(
            t(titleKey),
            t(messageKey),
            [
              {
                text: t('common:actions.confirm'),
                onPress: () => onVerificationSent(rawNumbers),
              },
            ]
          )
        }
      } else {
        console.log('❌ Auth service failed:', result.error)
        Alert.alert(t('common:errors.error'), typeof result.error === 'string' ? result.error : result.error?.message || t('auth:phoneVerification.errors.sendFailed'))
      }
    } catch (error) {
      console.error('🔥 Phone verification error:', error)
      Alert.alert(t('common:errors.error'), t('auth:phoneVerification.errors.networkError'))
    } finally {
      console.log('🏁 Verification process finished')
      setIsLoading(false)
    }
  }

  const handlePhoneChange = (text: string): void => {
    const formatted = formatPhoneInput(text)
    if (formatted.length <= 13) {
      setPhoneNumber(formatted)
    }
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
            <View className="items-center mb-10">
              <View className="mb-6">
                <LinearGradient
                  colors={isDarkMode ? ['#FF8A8A', '#FF6B6B'] : ['#FF6B6B', '#FF5252']}
                  className="w-20 h-20 rounded-full items-center justify-center shadow-lg"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="phone-portrait" size={36} color="white" />
                </LinearGradient>
              </View>
              
              <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
                {authMode === 'signup' ? t('auth:phoneVerification.signup.title') : t('auth:phoneVerification.title')}
              </Text>
              
              <Text className="text-gray-600 dark:text-gray-400 text-center px-8">
                {authMode === 'signup' ? t('auth:phoneVerification.signup.subtitle') : t('auth:phoneVerification.subtitle')}
              </Text>
            </View>

            {/* Form Section */}
            <View className="space-y-6">
              <View>
                {/* Label with Badge */}
                <View className="flex-row items-center mb-3">
                  <Text className="text-gray-700 dark:text-gray-300 font-semibold">
                    {t('auth:phoneVerification.phoneLabel')}
                  </Text>
                  <View className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                    <Text className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                      필수
                    </Text>
                  </View>
                </View>
                
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('auth:phoneVerification.description')}
                </Text>
                
                {/* Phone Input */}
                <Input
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  placeholder="010-1234-5678"
                  keyboardType="phone-pad"
                  maxLength={13}
                  autoFocus
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  leftIcon={
                    <View className="flex-row items-center">
                      <Ionicons 
                        name="call-outline" 
                        size={20} 
                        color={isFocused 
                          ? (isDarkMode ? '#FF8A8A' : '#FF6B6B')
                          : (isDarkMode ? '#9CA3AF' : '#6B7280')
                        } 
                      />
                      <Text className="ml-2 text-gray-700 dark:text-gray-300 font-medium">
                        +82
                      </Text>
                    </View>
                  }
                  containerClassName="mb-6"
                  inputClassName={cn(
                    isFocused && 'border-primary-500 border-2'
                  )}
                />
                
                {/* Submit Button */}
                <Button
                  onPress={handleSendVerification}
                  disabled={!phoneNumber.trim()}
                  loading={isLoading}
                  variant="gradient"
                  size="lg"
                  gradientColors={isDarkMode ? ['#FF8A8A', '#FF6B6B'] : ['#FF6B6B', '#FF5252']}
                  rightIcon={
                    !isLoading && (
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    )
                  }
                >
                  {authMode === 'signup' 
                    ? (isLoading ? t('auth:phoneVerification.signup.sendingButton') : t('auth:phoneVerification.signup.sendButton'))
                    : (isLoading ? t('auth:phoneVerification.sendingButton') : t('auth:phoneVerification.sendButton'))
                  }
                </Button>
              </View>
              
              {/* Privacy Notice */}
              <View className="flex-row items-center justify-center mt-6">
                <Ionicons 
                  name="shield-checkmark-outline" 
                  size={16} 
                  color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                />
                <Text className="ml-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                  {t('auth:phoneVerification.privacyNotice')}
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
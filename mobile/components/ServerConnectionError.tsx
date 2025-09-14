import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface ServerConnectionErrorProps {
  onRetry?: () => void;
  message?: string;
}

/**
 * 서버 연결 실패 에러 화면
 * @component
 * @description 서버 연결에 실패했을 때 표시되는 전체 화면 에러 컴포넌트
 * NativeWind v4로 스타일링
 */
export const ServerConnectionError: React.FC<ServerConnectionErrorProps> = ({
  onRetry,
  message = '서버에 연결할 수 없습니다'
}) => {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 justify-center items-center px-6">
        {/* 아이콘 */}
        <View className="w-30 h-30 rounded-full bg-red-50 dark:bg-red-900/20 justify-center items-center mb-6">
          <Ionicons 
            name="cloud-offline-outline" 
            size={60} 
            color="#EF4444" 
          />
        </View>

        {/* 에러 메시지 */}
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 text-center">
          서버 연결 실패
        </Text>
        
        <Text className="text-lg text-gray-700 dark:text-gray-300 mb-2 text-center">
          {message}
        </Text>

        <Text className="text-base text-gray-500 dark:text-gray-400 mb-6 text-center">
          인터넷 연결을 확인하고 다시 시도해주세요.
        </Text>

        {/* 재시도 버튼 */}
        {onRetry && (
          <TouchableOpacity 
            className="flex-row items-center bg-primary px-6 py-3 rounded-xl"
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">
              다시 시도
            </Text>
          </TouchableOpacity>
        )}

        {/* 개발 환경 정보 */}
        {__DEV__ && (
          <View className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-400 dark:border-yellow-600 rounded-xl w-full max-w-[350px]">
            <Text className="text-base font-bold text-yellow-600 dark:text-yellow-400 mb-2">
              개발 환경 정보
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              API 서버가 실행 중인지 확인하세요:
            </Text>
            <Text className={`text-sm text-gray-900 dark:text-gray-100 mb-2 ${Platform.OS === 'ios' ? 'font-mono' : ''}`}>
              cd server && npm run dev
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              서버 주소: http://localhost:3001
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};
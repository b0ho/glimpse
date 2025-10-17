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
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1 justify-center items-center px-8">
        {/* 아이콘 배경 - 더 크고 눈에 띄게 */}
        <View className="w-32 h-32 rounded-full bg-red-100 dark:bg-red-900/30 justify-center items-center mb-8 shadow-2xl">
          <Ionicons
            name="cloud-offline-outline"
            size={80}
            color="#EF4444"
          />
        </View>

        {/* 에러 메시지 - 더 큰 타이포그래피 */}
        <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          서버 연결 실패
        </Text>

        <Text className="text-xl text-gray-700 dark:text-gray-300 mb-3 text-center leading-7">
          {message}
        </Text>

        <Text className="text-base text-gray-600 dark:text-gray-400 mb-10 text-center leading-6 px-4">
          인터넷 연결을 확인하고 다시 시도해주세요.
        </Text>

        {/* 재시도 버튼 - 더 크고 눈에 띄게 */}
        {onRetry && (
          <TouchableOpacity
            className="flex-row items-center justify-center bg-red-500 px-10 py-4 rounded-2xl w-72 shadow-2xl"
            onPress={onRetry}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
            <Text className="text-white text-lg font-bold ml-3">
              다시 시도
            </Text>
          </TouchableOpacity>
        )}

        {/* 개발 환경 정보 - 더 아름다운 디자인 */}
        {__DEV__ && (
          <View className="mt-12 p-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-2xl w-full max-w-sm shadow-md">
            <View className="flex-row items-center mb-3">
              <Ionicons name="code-slash" size={20} color="#EAB308" />
              <Text className="text-lg font-bold text-yellow-700 dark:text-yellow-400 ml-2">
                개발 환경 정보
              </Text>
            </View>
            <Text className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-5">
              API 서버가 실행 중인지 확인하세요:
            </Text>
            <View className="bg-gray-900 dark:bg-gray-950 px-4 py-3 rounded-lg mb-3">
              <Text className={`text-sm text-green-400 ${Platform.OS === 'ios' ? 'font-mono' : ''}`}>
                cd server && npm run dev
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="globe-outline" size={16} color="#6B7280" />
              <Text className="text-sm text-gray-700 dark:text-gray-300 ml-2">
                서버 주소: http://localhost:3001
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};
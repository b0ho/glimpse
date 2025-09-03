import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { SPACING, FONT_SIZES } from '@/utils/constants';

interface ServerConnectionErrorProps {
  onRetry?: () => void;
  message?: string;
}

/**
 * 서버 연결 실패 에러 화면
 * @component
 * @description 서버 연결에 실패했을 때 표시되는 전체 화면 에러 컴포넌트
 */
export const ServerConnectionError: React.FC<ServerConnectionErrorProps> = ({
  onRetry,
  message = '서버에 연결할 수 없습니다'
}) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={styles.content}>
        {/* 아이콘 */}
        <View style={[styles.iconContainer, { backgroundColor: colors.ERROR + '20' }]}>
          <Ionicons 
            name="cloud-offline-outline" 
            size={60} 
            color={colors.ERROR} 
          />
        </View>

        {/* 에러 메시지 */}
        <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>
          서버 연결 실패
        </Text>
        
        <Text style={[styles.message, { color: colors.TEXT.SECONDARY }]}>
          {message}
        </Text>

        <Text style={[styles.subMessage, { color: colors.TEXT.LIGHT }]}>
          인터넷 연결을 확인하고 다시 시도해주세요.
        </Text>

        {/* 재시도 버튼 */}
        {onRetry && (
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.PRIMARY }]}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color={colors.TEXT.WHITE} />
            <Text style={[styles.retryButtonText, { color: colors.TEXT.WHITE }]}>
              다시 시도
            </Text>
          </TouchableOpacity>
        )}

        {/* 개발 환경 정보 */}
        {__DEV__ && (
          <View style={[styles.devInfo, { backgroundColor: colors.WARNING + '10', borderColor: colors.WARNING }]}>
            <Text style={[styles.devInfoTitle, { color: colors.WARNING }]}>
              개발 환경 정보
            </Text>
            <Text style={[styles.devInfoText, { color: colors.TEXT.SECONDARY }]}>
              API 서버가 실행 중인지 확인하세요:
            </Text>
            <Text style={[styles.devInfoCode, { color: colors.TEXT.PRIMARY }]}>
              cd server && npm run dev
            </Text>
            <Text style={[styles.devInfoText, { color: colors.TEXT.SECONDARY }]}>
              서버 주소: http://localhost:3001
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.LG,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: FONT_SIZES.MD,
    marginBottom: SPACING.XL,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.XL,
    borderRadius: 12,
    gap: SPACING.SM,
  },
  retryButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  devInfo: {
    marginTop: SPACING.XXL,
    padding: SPACING.MD,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    maxWidth: 350,
  },
  devInfoTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    marginBottom: SPACING.SM,
  },
  devInfoText: {
    fontSize: FONT_SIZES.SM,
    marginBottom: SPACING.XS,
  },
  devInfoCode: {
    fontSize: FONT_SIZES.SM,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: SPACING.SM,
  },
});
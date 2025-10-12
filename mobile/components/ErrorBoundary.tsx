import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { WithTranslation, withTranslation } from 'react-i18next';
import { captureError } from '../services/sentry/sentry-config';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/utils';

/**
 * ErrorBoundary 컴포넌트 Props
 *
 * @interface Props
 * @extends WithTranslation
 */
interface Props extends WithTranslation {
  /** 자식 컴포넌트 */
  children: ReactNode;
  /** 에러 발생 시 표시할 커스텀 컴포넌트 */
  fallback?: ReactNode;
}

/**
 * ErrorBoundary 컴포넌트 State
 *
 * @interface State
 */
interface State {
  /** 에러 발생 여부 */
  hasError: boolean;
  /** 발생한 에러 객체 */
  error?: Error;
  /** 에러 정보 */
  errorInfo?: ErrorInfo;
}

/**
 * 에러 바운더리 컴포넌트
 *
 * @description React 컴포넌트 트리에서 발생한 JavaScript 에러를 포착하여
 *              전체 앱 충돌을 방지하고 사용자 친화적인 에러 화면을 표시.
 *              Sentry로 에러 리포팅 자동 전송.
 *
 * @component Layout
 * @usage App.tsx에서 최상위 래퍼로 사용
 *
 * @example
 * <ErrorBoundary fallback={<CustomErrorScreen />}>
 *   <App />
 * </ErrorBoundary>
 *
 * @class ErrorBoundaryComponent
 * @extends {Component<Props, State>}
 */
class ErrorBoundaryComponent extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  /**
   * 에러 발생 시 상태 업데이트
   * @static
   * @param {Error} error - 발생한 에러
   * @returns {State} 업데이트된 상태
   */
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * 에러 포착 및 로깅
   * @param {Error} error - 발생한 에러
   * @param {ErrorInfo} errorInfo - 에러 정보 (컴포넌트 스택 포함)
   * @returns {void}
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Report to Sentry
    captureError(error, {
      errorBoundary: true,
      componentStack: errorInfo.componentStack,
    });
    
    this.setState({
      error,
      errorInfo,
    });
  }

  /**
   * 에러 상태 초기화 및 다시 시도
   * @private
   * @returns {void}
   */
  private handleRestart = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback 
        error={this.state.error} 
        errorInfo={this.state.errorInfo}
        onRestart={this.handleRestart}
        t={this.props.t}
      />;
    }

    return this.props.children;
  }
}

/**
 * ErrorFallback 컴포넌트 - 에러 발생 시 표시되는 UI
 */
const ErrorFallback: React.FC<{
  error?: Error;
  errorInfo?: ErrorInfo;
  onRestart: () => void;
  t: (key: string) => string;
}> = ({ error, errorInfo, onRestart, t }) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 justify-center items-center px-6">
        <View className="mb-6">
          <Icon name="warning" size={64} color={colors.ERROR} />
        </View>
        
        <Text className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
          {t('common:errors.errorBoundary.title')}
        </Text>
        
        <Text className="text-base text-center leading-5 mb-6 text-gray-600 dark:text-gray-400">
          {t('common:errors.errorBoundary.description')}{'\n'}
          {t('common:errors.errorBoundary.support')}
        </Text>
        
        {__DEV__ && error && (
          <View className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 mb-6 w-full">
            <Text className="text-sm font-bold mb-2 text-red-600 dark:text-red-400">
              {t('common:errors.errorBoundary.developerInfo')}
            </Text>
            <Text className="text-xs font-mono mb-1 text-red-600 dark:text-red-400">
              {error.toString()}
            </Text>
            {errorInfo?.componentStack && (
              <Text className="text-xs font-mono text-red-600 dark:text-red-400">
                {errorInfo.componentStack}
              </Text>
            )}
          </View>
        )}
        
        <TouchableOpacity 
          className="flex-row items-center bg-primary-500 px-5 py-3 rounded-lg"
          onPress={onRestart}
        >
          <Icon name="refresh" size={20} color={colors.TEXT.WHITE} />
          <Text className="text-base font-semibold ml-2 text-white">
            {t('common:buttons.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export const ErrorBoundary = withTranslation('common')(ErrorBoundaryComponent);
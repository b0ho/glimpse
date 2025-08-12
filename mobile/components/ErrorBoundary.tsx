import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { WithTranslation, withTranslation } from 'react-i18next';
import { SPACING, FONT_SIZES } from '../utils/constants';
import { captureError } from '../services/sentry/sentry-config';
import { useTheme } from '../hooks/useTheme';

/**
 * ErrorBoundary 컴포넌트 Props
 * @interface Props
 */
interface Props extends WithTranslation {
  /** 자식 컴포넌트 */
  children: ReactNode;
  /** 에러 발생 시 표시할 커스텀 컴포넌트 */
  fallback?: ReactNode;
}

/**
 * ErrorBoundary 컴포넌트 State
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
 * 에러 바운더리 컴포넌트 - React 컴포넌트 트리에서 발생한 에러 처리
 * @class ErrorBoundaryComponent
 * @extends {Component<Props, State>}
 * @description 자식 컴포넌트에서 발생한 JavaScript 에러를 포착하여 전체 앱 충돌 방지
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="warning" size={64} color={colors.ERROR} />
        </View>
        
        <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>{t('errors.errorBoundary.title')}</Text>
        
        <Text style={[styles.subtitle, { color: colors.TEXT.SECONDARY }]}>
          {t('errors.errorBoundary.description')}{'\n'}
          {t('errors.errorBoundary.support')}
        </Text>
        
        {__DEV__ && error && (
          <View style={[styles.errorDetails, { backgroundColor: colors.ERROR + '10' }]}>
            <Text style={[styles.errorDetailsTitle, { color: colors.ERROR }]}>{t('errors.errorBoundary.developerInfo')}</Text>
            <Text style={[styles.errorDetailsText, { color: colors.ERROR }]}>
              {error.toString()}
            </Text>
            {errorInfo?.componentStack && (
              <Text style={[styles.errorDetailsText, { color: colors.ERROR }]}>
                {errorInfo.componentStack}
              </Text>
            )}
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.PRIMARY }]}
          onPress={onRestart}
        >
          <Icon name="refresh" size={20} color={colors.TEXT.WHITE} />
          <Text style={[styles.retryButtonText, { color: colors.TEXT.WHITE }]}>{t('buttons.retry')}</Text>
        </TouchableOpacity>
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
    marginBottom: SPACING.XL,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XL,
  },
  errorDetails: {
    borderRadius: 8,
    padding: SPACING.MD,
    marginBottom: SPACING.XL,
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: 'bold',
    marginBottom: SPACING.SM,
  },
  errorDetailsText: {
    fontSize: FONT_SIZES.XS,
    fontFamily: 'monospace',
    marginBottom: SPACING.XS,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginLeft: SPACING.SM,
  },
});

export const ErrorBoundary = withTranslation('common')(ErrorBoundaryComponent);
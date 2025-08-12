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
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';
import { captureError } from '../services/sentry/sentry-config';

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

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Icon name="warning" size={64} color={COLORS.ERROR} />
            </View>
            
            <Text style={styles.title}>{this.props.t('errors.errorBoundary.title')}</Text>
            
            <Text style={styles.subtitle}>
              {this.props.t('errors.errorBoundary.description')}{'\n'}
              {this.props.t('errors.errorBoundary.support')}
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>{this.props.t('errors.errorBoundary.developerInfo')}</Text>
                <Text style={styles.errorDetailsText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.errorDetailsText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={this.handleRestart}
            >
              <Icon name="refresh" size={20} color={COLORS.TEXT.WHITE} />
              <Text style={styles.retryButtonText}>{this.props.t('buttons.retry')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
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
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XL,
  },
  errorDetails: {
    backgroundColor: COLORS.ERROR + '10',
    borderRadius: 8,
    padding: SPACING.MD,
    marginBottom: SPACING.XL,
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: 'bold',
    color: COLORS.ERROR,
    marginBottom: SPACING.SM,
  },
  errorDetailsText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.ERROR,
    fontFamily: 'monospace',
    marginBottom: SPACING.XS,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginLeft: SPACING.SM,
  },
});

export const ErrorBoundary = withTranslation('common')(ErrorBoundaryComponent);
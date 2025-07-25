import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { captureError } from '@/services/sentry/sentry-config';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

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
            
            <Text style={styles.title}>앗! 문제가 발생했어요</Text>
            
            <Text style={styles.subtitle}>
              예상치 못한 오류가 발생했습니다.{'\n'}
              문제가 지속되면 고객지원에 문의해주세요.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>개발자 정보:</Text>
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
              <Text style={styles.retryButtonText}>다시 시도</Text>
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
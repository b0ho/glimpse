/**
 * 공통 로딩 스크린 컴포넌트
 */
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoadingScreenProps {
  message?: string;
  colors: any;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  colors,
}) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
        {message && (
          <Text style={[styles.message, { color: colors.TEXT.SECONDARY }]}>
            {message}
          </Text>
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
  },
  message: {
    marginTop: 16,
    fontSize: 14,
  },
});
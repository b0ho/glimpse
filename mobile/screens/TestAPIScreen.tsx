import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { userApiService } from '@/services/api/user-service';
import { apiClient } from '@/services/api/config';

export const TestAPIScreen = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/actuator/health`);
      const data = await response.json();
      setResult(`Health Check: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Health Check Error: ${error.message}`);
    }
    setLoading(false);
  };

  const testUserAPI = async () => {
    setLoading(true);
    try {
      const data = await userApiService.getCurrentUser();
      setResult(`User Data: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`User API Error: ${error.message}`);
    }
    setLoading(false);
  };

  const testPublicAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/health`);
      const data = await response.text();
      setResult(`Public API: ${data}`);
    } catch (error) {
      setResult(`Public API Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API 연동 테스트</Text>
      
      <View style={styles.info}>
        <Text>Backend URL: {process.env.EXPO_PUBLIC_API_BASE_URL}</Text>
        <Text>WebSocket URL: {process.env.EXPO_PUBLIC_SOCKET_URL}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Health Check 테스트"
          onPress={testHealthCheck}
          disabled={loading}
        />
        
        <Button
          title="Public API 테스트"
          onPress={testPublicAPI}
          disabled={loading}
        />
        
        <Button
          title="User API 테스트 (인증 필요)"
          onPress={testUserAPI}
          disabled={loading}
        />
      </View>

      {loading && <Text style={styles.loading}>로딩 중...</Text>}
      
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>결과:</Text>
          <Text style={styles.result}>{result}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  info: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 10,
  },
  loading: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  resultContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  result: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
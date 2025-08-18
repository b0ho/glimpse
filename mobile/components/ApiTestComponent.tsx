import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { apiClient } from '../services/api/config';

interface ApiTestResponse {
  status: string;
  timestamp: string;
  environment: string;
  message: string;
  version: string;
  endpoints: {
    health: string;
    docs: string;
    api: string;
  };
}

export const ApiTestComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<ApiTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testApiConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Testing API connection...');
      
      // Test health endpoint
      const response = await apiClient.get<ApiTestResponse>('/health');
      
      console.log('✅ API connection successful:', response);
      setLastResponse(response);
      
      Alert.alert(
        'API 연결 성공!',
        `서버 버전: ${response.version}\n환경: ${response.environment}\n상태: ${response.status}`,
        [{ text: '확인' }]
      );
      
    } catch (err: any) {
      console.error('❌ API connection failed:', err);
      const errorMessage = err.message || 'API 연결 실패';
      setError(errorMessage);
      
      Alert.alert(
        'API 연결 실패',
        errorMessage,
        [{ text: '확인' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API 연결 테스트</Text>
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={testApiConnection}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'API 연결 중...' : 'API 연결 테스트'}
        </Text>
      </TouchableOpacity>
      
      {lastResponse && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseTitle}>✅ 마지막 성공 응답:</Text>
          <Text style={styles.responseText}>상태: {lastResponse.status}</Text>
          <Text style={styles.responseText}>환경: {lastResponse.environment}</Text>
          <Text style={styles.responseText}>버전: {lastResponse.version}</Text>
          <Text style={styles.responseText}>메시지: {lastResponse.message}</Text>
          <Text style={styles.responseText}>
            시간: {new Date(lastResponse.timestamp).toLocaleString('ko-KR')}
          </Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ 오류:</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  responseContainer: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 12,
    color: '#155724',
    marginBottom: 4,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#721c24',
  },
});

export default ApiTestComponent;
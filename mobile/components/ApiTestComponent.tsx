import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { apiClient } from '../services/api/config';

interface ApiTestResponse {
  status: string;
  timestamp: string;
  environment: string;
  message: string;
  version: string;
  endpoints?: {
    health: string;
    docs: string;
    api: string;
  };
}

interface DbStatusResponse {
  status: string;
  timestamp: string;
  environment: any;
  database: {
    connection: string;
    prisma: string;
  };
  prismaStudio: {
    info: string;
    alternative: string;
    localAccess: string;
  };
}

interface GroupsResponse {
  success: boolean;
  data: any[];
  database: {
    status: string;
    connected: boolean;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export const ApiTestComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<ApiTestResponse | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [groupsData, setGroupsData] = useState<GroupsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({});

  const testAllEndpoints = async () => {
    setIsLoading(true);
    setError(null);
    const results: {[key: string]: boolean} = {};
    
    try {
      console.log('🔍 Testing all API endpoints...');
      
      // Test 1: Health endpoint
      try {
        const healthResponse = await apiClient.get<ApiTestResponse>('/health');
        console.log('✅ Health endpoint:', healthResponse);
        setLastResponse(healthResponse);
        results.health = true;
      } catch (err) {
        console.error('❌ Health endpoint failed:', err);
        results.health = false;
      }
      
      // Test 2: Database status endpoint
      try {
        const dbResponse = await apiClient.get<DbStatusResponse>('/db-status');
        console.log('✅ Database status:', dbResponse);
        setDbStatus(dbResponse);
        results.database = true;
      } catch (err) {
        console.error('❌ Database status failed:', err);
        results.database = false;
      }
      
      // Test 3: Groups endpoint
      try {
        const groupsResponse = await apiClient.get<GroupsResponse>('/groups');
        console.log('✅ Groups endpoint:', groupsResponse);
        setGroupsData(groupsResponse);
        results.groups = true;
      } catch (err) {
        console.error('❌ Groups endpoint failed:', err);
        results.groups = false;
      }
      
      setTestResults(results);
      
      // Show summary
      const successCount = Object.values(results).filter(Boolean).length;
      const totalCount = Object.keys(results).length;
      
      Alert.alert(
        `API 테스트 완료 (${successCount}/${totalCount})`,
        `Health: ${results.health ? '✅' : '❌'}\n` +
        `Database: ${results.database ? '✅' : '❌'}\n` +
        `Groups: ${results.groups ? '✅' : '❌'}\n\n` +
        `${dbStatus?.database?.connected ? '🟢 DB 연결됨' : '🔴 DB 연결 안됨'}`,
        [{ text: '확인' }]
      );
      
    } catch (err: any) {
      console.error('❌ API tests failed:', err);
      const errorMessage = err.message || 'API 테스트 실패';
      setError(errorMessage);
      
      Alert.alert(
        'API 테스트 실패',
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
        onPress={testAllEndpoints}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'API 테스트 중...' : '전체 API 테스트'}
        </Text>
      </TouchableOpacity>
      
      {Object.keys(testResults).length > 0 && (
        <View style={styles.testResultsContainer}>
          <Text style={styles.testResultsTitle}>📊 테스트 결과:</Text>
          <Text style={styles.testResult}>
            Health API: {testResults.health ? '✅ 성공' : '❌ 실패'}
          </Text>
          <Text style={styles.testResult}>
            Database API: {testResults.database ? '✅ 성공' : '❌ 실패'}
          </Text>
          <Text style={styles.testResult}>
            Groups API: {testResults.groups ? '✅ 성공' : '❌ 실패'}
          </Text>
        </View>
      )}
      
      {lastResponse && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseTitle}>✅ Health API 응답:</Text>
          <Text style={styles.responseText}>상태: {lastResponse.status}</Text>
          <Text style={styles.responseText}>환경: {lastResponse.environment}</Text>
          <Text style={styles.responseText}>버전: {lastResponse.version}</Text>
          <Text style={styles.responseText}>메시지: {lastResponse.message}</Text>
        </View>
      )}
      
      {dbStatus && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseTitle}>🗄️ 데이터베이스 상태:</Text>
          <Text style={styles.responseText}>연결: {dbStatus.database.connection}</Text>
          <Text style={styles.responseText}>Prisma: {dbStatus.database.prisma}</Text>
          <Text style={styles.responseText}>
            DATABASE_URL: {dbStatus.environment.DATABASE_URL ? '✅ 설정됨' : '❌ 없음'}
          </Text>
        </View>
      )}
      
      {groupsData && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseTitle}>👥 Groups API:</Text>
          <Text style={styles.responseText}>성공: {groupsData.success ? '✅' : '❌'}</Text>
          <Text style={styles.responseText}>데이터 수: {groupsData.data.length}개</Text>
          <Text style={styles.responseText}>
            DB 연결: {groupsData.database.connected ? '✅ 연결됨' : '❌ 연결 안됨'}
          </Text>
          <Text style={styles.responseText}>DB 상태: {groupsData.database.status}</Text>
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
  testResultsContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  testResultsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0d47a1',
    marginBottom: 8,
  },
  testResult: {
    fontSize: 12,
    color: '#1565c0',
    marginBottom: 4,
  },
});

export default ApiTestComponent;
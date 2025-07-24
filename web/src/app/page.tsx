'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setHealthStatus(data);
      } catch (error) {
        console.error('Health check failed:', error);
        setHealthStatus({ status: 'error', error: 'Failed to connect' });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📱 Glimpse</h1>
          <p className="text-gray-600">익명 데이팅 앱</p>
        </div>

        <div className="mb-8">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">🚀 NextJS 버전</h3>
            <p className="text-sm text-gray-600">
              Express에서 NextJS로 성공적으로 마이그레이션되었습니다!
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">⚡ 시스템 상태</h3>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <div className="text-sm">
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                  healthStatus?.status === 'healthy' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {healthStatus?.status === 'healthy' ? '✅ 정상' : '❌ 오류'}
                </div>
                <div className="text-gray-600">
                  <div>데이터베이스: {healthStatus?.database}</div>
                  <div>시간: {new Date(healthStatus?.timestamp).toLocaleString('ko-KR')}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105">
            웹에서 시작하기
          </button>
          
          <a 
            href="/chat"
            className="block w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-center"
          >
            💬 실시간 채팅 테스트
          </a>
          
          <div className="text-sm text-gray-500">
            또는 <span className="font-medium text-purple-600">모바일 앱</span>을 다운로드하세요
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-center space-x-6 text-sm text-gray-600">
            <span>🎭 완전 익명</span>
            <span>💬 안전한 채팅</span>
            <span>🏢 그룹 매칭</span>
          </div>
        </div>
      </div>
    </div>
  );
}

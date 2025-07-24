'use client';

import { useEffect, useState } from 'react';

interface WebVitals {
  FCP?: number;
  LCP?: number;
  FID?: number;
  CLS?: number;
  TTFB?: number;
}

interface PerformanceData {
  webVitals: WebVitals;
  connectionType?: string;
  deviceMemory?: number;
  isLowEndDevice: boolean;
  loadTime: number;
}

export function usePerformance() {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    webVitals: {},
    isLowEndDevice: false,
    loadTime: 0,
  });

  useEffect(() => {
    // 페이지 로드 시간 측정
    const loadTime = performance.now();
    
    // 디바이스 정보 수집
    const getDeviceInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const deviceMemory = (navigator as any).deviceMemory;
      
      // 저사양 디바이스 감지
      const isLowEndDevice = deviceMemory ? deviceMemory <= 4 : false;
      
      return {
        connectionType: connection?.effectiveType || 'unknown',
        deviceMemory: deviceMemory || 'unknown',
        isLowEndDevice,
      };
    };

    // Web Vitals 수집
    const collectWebVitals = () => {
      // Performance Observer를 사용하여 메트릭 수집
      if ('PerformanceObserver' in window) {
        try {
          // First Contentful Paint (FCP)
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach((entry) => {
              if (entry.name === 'first-contentful-paint') {
                setPerformanceData(prev => ({
                  ...prev,
                  webVitals: { ...prev.webVitals, FCP: Math.round(entry.startTime) }
                }));
              }
            });
          }).observe({ entryTypes: ['paint'] });

          // Largest Contentful Paint (LCP)
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              setPerformanceData(prev => ({
                ...prev,
                webVitals: { ...prev.webVitals, LCP: Math.round(lastEntry.startTime) }
              }));
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay (FID)
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach((entry: any) => {
              setPerformanceData(prev => ({
                ...prev,
                webVitals: { ...prev.webVitals, FID: Math.round(entry.processingStart - entry.startTime) }
              }));
            });
          }).observe({ entryTypes: ['first-input'] });

          // Cumulative Layout Shift (CLS)
          let clsValue = 0;
          new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
                setPerformanceData(prev => ({
                  ...prev,
                  webVitals: { ...prev.webVitals, CLS: Number(clsValue.toFixed(3)) }
                }));
              }
            });
          }).observe({ entryTypes: ['layout-shift'] });

        } catch (error) {
          console.warn('Performance Observer not supported:', error);
        }
      }

      // Navigation Timing API로 TTFB 측정
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navigationEntries.length > 0) {
          const entry = navigationEntries[0];
          const ttfb = entry.responseStart - entry.requestStart;
          setPerformanceData(prev => ({
            ...prev,
            webVitals: { ...prev.webVitals, TTFB: Math.round(ttfb) }
          }));
        }
      }
    };

    // 초기 데이터 설정
    const deviceInfo = getDeviceInfo();
    setPerformanceData(prev => ({
      ...prev,
      ...deviceInfo,
      loadTime: Math.round(loadTime),
    }));

    // Web Vitals 수집 시작
    collectWebVitals();

    // 성능 데이터를 서버로 전송 (옵션)
    const sendPerformanceData = () => {
      // 실际 구현에서는 분석 서비스로 데이터 전송
      console.log('Performance data collected:', performanceData);
    };

    // 페이지 언로드 시 데이터 전송
    window.addEventListener('beforeunload', sendPerformanceData);

    return () => {
      window.removeEventListener('beforeunload', sendPerformanceData);
    };
  }, []);

  // 성능 점수 계산
  const getPerformanceScore = () => {
    const { webVitals } = performanceData;
    let score = 100;

    // FCP 점수 (1.8초 이하 = 좋음)
    if (webVitals.FCP) {
      if (webVitals.FCP > 3000) score -= 20;
      else if (webVitals.FCP > 1800) score -= 10;
    }

    // LCP 점수 (2.5초 이하 = 좋음) 
    if (webVitals.LCP) {
      if (webVitals.LCP > 4000) score -= 25;
      else if (webVitals.LCP > 2500) score -= 15;
    }

    // FID 점수 (100ms 이하 = 좋음)
    if (webVitals.FID) {
      if (webVitals.FID > 300) score -= 20;
      else if (webVitals.FID > 100) score -= 10;
    }

    // CLS 점수 (0.1 이하 = 좋음)
    if (webVitals.CLS) {
      if (webVitals.CLS > 0.25) score -= 25;
      else if (webVitals.CLS > 0.1) score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  };

  // 성능 등급 계산
  const getPerformanceGrade = () => {
    const score = getPerformanceScore();
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // 최적화 권장사항
  const getOptimizationSuggestions = () => {
    const suggestions = [];
    const { webVitals, isLowEndDevice } = performanceData;

    if (webVitals.FCP && webVitals.FCP > 1800) {
      suggestions.push('First Contentful Paint가 느립니다. 중요한 CSS를 인라인으로 포함하세요.');
    }

    if (webVitals.LCP && webVitals.LCP > 2500) {
      suggestions.push('Largest Contentful Paint가 느립니다. 이미지 최적화와 lazy loading을 고려하세요.');
    }

    if (webVitals.FID && webVitals.FID > 100) {
      suggestions.push('First Input Delay가 높습니다. JavaScript 실행 시간을 줄이세요.');
    }

    if (webVitals.CLS && webVitals.CLS > 0.1) {
      suggestions.push('Cumulative Layout Shift가 높습니다. 이미지와 광고에 크기를 미리 지정하세요.');
    }

    if (isLowEndDevice) {
      suggestions.push('저사양 디바이스에서 접속 중입니다. 경량화된 버전을 제공하는 것을 고려하세요.');
    }

    return suggestions;
  };

  return {
    performanceData,
    performanceScore: getPerformanceScore(),
    performanceGrade: getPerformanceGrade(),
    optimizationSuggestions: getOptimizationSuggestions(),
  };
}
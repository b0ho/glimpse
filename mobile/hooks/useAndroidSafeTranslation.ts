import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { TFunction } from 'i18next';

/**
 * Cross-platform translation hook
 * 점(.) 구분자 문제를 해결하는 커스텀 훅
 * 
 * 모든 플랫폼에서 일관된 키 구조 처리를 위해
 * 'tabs.home' 같은 키를 'navigation:tabs.home'으로 자동 변환
 */
export function useCrossPlatformTranslation(namespace?: string | string[]) {
  const { t: originalT, i18n, ready } = useTranslation(namespace);

  // 모든 플랫폼에서 동일한 래퍼 함수 (항상 string 반환)
  const t = (key: string | string[], options?: any): string => {

    // 모든 플랫폼에서 동일한 키 변환 처리
    const processKey = (k: string): string => {
      // 이미 네임스페이스가 포함된 경우 그대로 반환
      if (k.includes(':')) {
        return k;
      }

      // 점(.)이 포함된 키 처리
      if (k.includes('.')) {
        // 특정 패턴에 대한 네임스페이스 매핑
        const namespaceMap: Record<string, string> = {
          'tabs.': 'navigation',
          'stats.': 'matches',
          'members.': 'group',
          'buttons.': 'common',
          'status.': 'common',
          'time.': 'common',
          'errors.': 'common',
          'emptyState.': 'common',
          'header.': 'navigation',
          'menu.': 'navigation',
          'settings.': 'settings',
          'profile.': 'profile',
          'chat.': 'chat',
          'group.': 'group',
          'match.': 'matches',
          'premium.': 'premium',
          'auth.': 'auth',
          'notification.': 'notification',
          'support.': 'support',
        };

        // 매칭되는 네임스페이스 찾기
        for (const [prefix, ns] of Object.entries(namespaceMap)) {
          if (k.startsWith(prefix)) {
            return `${ns}:${k}`;
          }
        }

        // 기본 네임스페이스 적용
        if (namespace && typeof namespace === 'string') {
          return `${namespace}:${k}`;
        }

        // 네임스페이스를 찾을 수 없으면 common으로 시도
        return `common:${k}`;
      }

      return k;
    };

    // 키 배열 처리
    if (Array.isArray(key)) {
      const processedKeys = key.map(processKey);
      const result = originalT(processedKeys, options);
      
      // 번역이 실패한 경우 (키가 그대로 반환된 경우)
      if (result === processedKeys[0]) {
        // 네임스페이스 없이 다시 시도
        const fallbackResult = originalT(key, options);
        if (fallbackResult !== key[0]) {
          return String(fallbackResult);
        }
      }
      
      return String(result);
    }

    // 단일 키 처리
    const processedKey = processKey(key);
    const result = originalT(processedKey, options);
    
    // 번역이 실패한 경우 (키가 그대로 반환된 경우)
    if (result === processedKey) {
      // 원본 키로 다시 시도
      const fallbackResult = originalT(key, options);
      if (fallbackResult !== key) {
        return String(fallbackResult);
      }
      
      // 그래도 실패하면 네임스페이스 없이 시도
      const lastFallback = originalT(key.split('.').pop() || key, options);
      if (lastFallback !== key.split('.').pop()) {
        return String(lastFallback);
      }
    }
    
    return String(result);
  };

  return { t, i18n, ready };
}

// 기존 이름으로도 접근 가능 (호환성)
export const useAndroidSafeTranslation = useCrossPlatformTranslation;

// 기본 export로도 제공
export default useCrossPlatformTranslation;
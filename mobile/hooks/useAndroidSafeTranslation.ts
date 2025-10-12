/**
 * Cross-Platform Translation Hook
 *
 * @module hooks/useAndroidSafeTranslation
 * @description 모든 플랫폼에서 일관된 번역 키 처리를 제공하는 커스텀 훅입니다.
 * 점(.) 구분자 문제를 해결하고 'tabs.home' 같은 키를 'navigation:tabs.home'으로 자동 변환합니다.
 */

import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { TFunction } from 'i18next';

/**
 * 크로스 플랫폼 번역 훅
 *
 * @hook
 * @param {string | string[]} [namespace] - i18n 네임스페이스 (선택적)
 * @returns {Object} 번역 함수 및 i18n 인스턴스
 * @returns {Function} returns.t - 번역 함수 (항상 string 반환)
 * @returns {Object} returns.i18n - i18n 인스턴스
 * @returns {boolean} returns.ready - i18n 준비 상태
 *
 * @description
 * 모든 플랫폼에서 일관된 키 구조 처리를 위한 번역 훅입니다.
 * - 자동 네임스페이스 매핑
 * - 점(.) 구분자 키 자동 변환
 * - Fallback 메커니즘 제공
 * - 항상 string 타입 반환 보장
 *
 * @example
 * ```tsx
 * const { t } = useCrossPlatformTranslation('common');
 *
 * // 단순 키
 * const text = t('hello'); // 'common:hello'
 *
 * // 점 구분자 키 (자동 변환)
 * const tabText = t('tabs.home'); // 'navigation:tabs.home'
 *
 * // 옵션 포함
 * const greeting = t('welcome', { name: 'John' });
 * ```
 */
export function useCrossPlatformTranslation(namespace?: string | string[]) {
  const { t: originalT, i18n, ready } = useTranslation(namespace);

  /**
   * 번역 함수 래퍼 (모든 플랫폼에서 동일하게 동작)
   *
   * @param {string | string[]} key - 번역 키 또는 키 배열
   * @param {any} [options] - 번역 옵션 (변수, context 등)
   * @returns {string} 번역된 문자열
   */
  const t = (key: string | string[], options?: any): string => {
    // key가 undefined나 null인 경우 빈 문자열 반환
    if (!key) {
      return '';
    }

    /**
     * 번역 키 처리 함수
     *
     * @param {string} k - 처리할 번역 키
     * @returns {string} 처리된 번역 키 (네임스페이스 포함)
     */
    const processKey = (k: string): string => {
      // k가 문자열이 아닌 경우 빈 문자열 반환
      if (typeof k !== 'string') {
        return '';
      }
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
      // key가 문자열이고 점이 포함된 경우에만 split 시도
      if (typeof key === 'string' && key.includes('.')) {
        const parts = key.split('.');
        const lastPart = parts[parts.length - 1];
        const lastFallback = originalT(lastPart, options);
        if (lastFallback !== lastPart) {
          return String(lastFallback);
        }
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
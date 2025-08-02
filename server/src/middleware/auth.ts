/**
 * 인증 미들웨어 모듈
 * 
 * @module middleware/auth
 * @description
 * 이 모듈은 Clerk 인증 미들웨어를 재내보내(re-export)하여 
 * 이전 버전과의 호환성을 유지합니다.
 * 
 * @deprecated 
 * 이 파일은 하위 호환성을 위해 유지되고 있습니다.
 * 새로운 코드에서는 './clerkAuth'에서 직접 import하는 것을 권장합니다.
 * 
 * @example
 * ```typescript
 * // 기존 방식 (하위 호환성)
 * import { authMiddleware } from './middleware/auth';
 * 
 * // 권장 방식
 * import { clerkAuthMiddleware } from './middleware/clerkAuth';
 * ```
 */

/**
 * Clerk 인증 미들웨어
 * @see {@link module:middleware/clerkAuth~clerkAuthMiddleware}
 */
export { clerkAuthMiddleware as authMiddleware } from './clerkAuth';

/**
 * Clerk 인증 미들웨어 (별칭)
 * @see {@link module:middleware/clerkAuth~clerkAuthMiddleware}
 */
export { clerkAuthMiddleware as authenticate } from './clerkAuth';

/**
 * Clerk 인증이 추가된 Express Request 타입
 * @see {@link module:middleware/clerkAuth~ClerkAuthRequest}
 */
export { ClerkAuthRequest as AuthRequest } from './clerkAuth';
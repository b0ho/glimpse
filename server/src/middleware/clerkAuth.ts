import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { createError } from './errorHandler';

/**
 * Clerk 인증 요청 인터페이스
 * @interface ClerkAuthRequest
 * @extends {Request}
 */
export interface ClerkAuthRequest extends Request {
  /** 인증 정보 */
  auth?: {
    /** 사용자 ID */
    userId: string;
    /** 세션 ID */
    sessionId: string;
    /** JWT 클레임 */
    claims?: any;
  };
}

/**
 * Clerk JWKS 엔드포인트 URL
 * @constant
 */
const jwksUri = `https://api.clerk.com/v1/jwks`;

/**
 * JWKS 클라이언트 - JWT 공개 키 검색
 * @constant
 */
const client = jwksClient({
  jwksUri,
  requestHeaders: {}, // Pass any additional headers
  timeout: 30000, // Defaults to 30s
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

/**
 * JWT 서명 키 조회
 * @param {any} header - JWT 헤더
 * @param {any} callback - 콜백 함수
 * @returns {void}
 */
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      callback(err, null);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Clerk 인증 미들웨어 - JWT 토큰 검증
 * @param {ClerkAuthRequest} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {NextFunction} next - 다음 미들웨어 함수
 * @returns {Promise<void>}
 * @throws {Error} 토큰 없음, 만료됨, 유효하지 않음
 */
export const clerkAuthMiddleware = async (
  req: ClerkAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw createError(401, '인증 토큰이 필요합니다.');
    }

    // Verify the JWT token with Clerk's public key
    jwt.verify(token, getKey, {
      algorithms: ['RS256'],
      issuer: `https://clerk.${process.env.CLERK_DOMAIN || 'accounts.dev'}`,
      clockTolerance: 5,
    }, (err, decoded: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return next(createError(401, '토큰이 만료되었습니다.'));
        } else if (err.name === 'JsonWebTokenError') {
          return next(createError(401, '유효하지 않은 토큰입니다.'));
        }
        return next(createError(401, '토큰 검증에 실패했습니다.'));
      }

      // Extract user information from Clerk JWT
      req.auth = {
        userId: decoded.sub,
        sessionId: decoded.sid || '',
        claims: decoded,
      };

      next();
    });
  } catch (_error) {
    next(createError(401, '인증에 실패했습니다.'));
  }
};

/**
 * 선택적 Clerk 인증 미들웨어 - 인증이 선택적인 라우트용
 * @param {ClerkAuthRequest} req - Express 요청 객체
 * @param {Response} res - Express 응답 객체
 * @param {NextFunction} next - 다음 미들웨어 함수
 * @returns {Promise<void>}
 */
export const optionalClerkAuthMiddleware = async (
  req: ClerkAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // No token provided, continue without auth
    next();
    return;
  }

  // If token is provided, validate it
  clerkAuthMiddleware(req, res, next);
};

/**
 * 하위 호환성을 위한 별칭
 * @constant
 * @deprecated clerkAuthMiddleware 사용 권장
 */
export const requireClerkAuth = clerkAuthMiddleware;
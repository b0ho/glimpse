import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { createError } from './errorHandler';

export interface ClerkAuthRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
    claims?: any;
  };
}

// Clerk JWKS endpoint
const jwksUri = `https://api.clerk.com/v1/jwks`;

const client = jwksClient({
  jwksUri,
  requestHeaders: {}, // Pass any additional headers
  timeout: 30000, // Defaults to 30s
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

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

// Optional: Middleware for routes that optionally require auth
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

// Alias for backward compatibility
export const requireClerkAuth = clerkAuthMiddleware;
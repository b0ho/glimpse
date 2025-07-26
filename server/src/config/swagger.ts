import swaggerJsdoc from 'swagger-jsdoc';
import env from './env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Glimpse Dating App API',
    version: '1.0.0',
    description: `
      Glimpse는 프라이버시 중심의 한국 데이팅 앱입니다.
      
      ## 주요 기능
      - 익명 매칭 시스템
      - 그룹 기반 만남
      - 실시간 암호화 채팅
      - 한국형 결제 시스템
      
      ## 인증
      모든 API 요청은 Bearer 토큰이 필요합니다.
      \`Authorization: Bearer <token>\`
    `,
    contact: {
      name: 'Glimpse Support',
      email: 'support@glimpse.app',
      url: 'https://glimpse.app'
    },
    license: {
      name: 'Proprietary',
      url: 'https://glimpse.app/terms'
    }
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}/api/v1`,
      description: 'Development server'
    },
    {
      url: 'https://api.glimpse.app/api/v1',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Clerk JWT token'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: '에러 메시지'
          },
          code: {
            type: 'string',
            description: '에러 코드'
          },
          details: {
            type: 'object',
            description: '추가 에러 정보'
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          anonymousId: { type: 'string' },
          phoneNumber: { type: 'string' },
          nickname: { type: 'string' },
          age: { type: 'integer', minimum: 18, maximum: 100 },
          gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
          profileImage: { type: 'string', format: 'url' },
          bio: { type: 'string', maxLength: 500 },
          isVerified: { type: 'boolean' },
          credits: { type: 'integer', minimum: 0 },
          isPremium: { type: 'boolean' },
          premiumUntil: { type: 'string', format: 'date-time' },
          lastActive: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Group: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          type: { 
            type: 'string', 
            enum: ['OFFICIAL', 'CREATED', 'INSTANCE', 'LOCATION'] 
          },
          isActive: { type: 'boolean' },
          memberCount: { type: 'integer' },
          maxMembers: { type: 'integer' },
          settings: {
            type: 'object',
            properties: {
              requiresApproval: { type: 'boolean' },
              allowInvites: { type: 'boolean' },
              isPrivate: { type: 'boolean' },
              ageMin: { type: 'integer' },
              ageMax: { type: 'integer' },
              genderRestriction: {
                type: 'string',
                enum: ['MALE_ONLY', 'FEMALE_ONLY', 'MIXED']
              }
            }
          },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Match: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user1Id: { type: 'string', format: 'uuid' },
          user2Id: { type: 'string', format: 'uuid' },
          groupId: { type: 'string', format: 'uuid' },
          isActive: { type: 'boolean' },
          lastMessageAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      ChatMessage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          matchId: { type: 'string', format: 'uuid' },
          senderId: { type: 'string', format: 'uuid' },
          content: { type: 'string' },
          type: { type: 'string', enum: ['TEXT', 'IMAGE', 'SYSTEM'] },
          isEncrypted: { type: 'boolean' },
          readAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          amount: { type: 'integer' },
          currency: { type: 'string', default: 'KRW' },
          type: { 
            type: 'string', 
            enum: ['PREMIUM_SUBSCRIPTION', 'LIKE_CREDITS'] 
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']
          },
          method: {
            type: 'string',
            enum: ['CARD', 'KAKAO_PAY', 'TOSS_PAY', 'NAVER_PAY']
          },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: '인증 토큰이 없거나 유효하지 않습니다',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      NotFoundError: {
        description: '요청한 리소스를 찾을 수 없습니다',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      ValidationError: {
        description: '입력값 검증 실패',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      ServerError: {
        description: '서버 내부 오류',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Auth',
      description: '인증 관련 API'
    },
    {
      name: 'Users',
      description: '사용자 관리 API'
    },
    {
      name: 'Groups',
      description: '그룹 관리 API'
    },
    {
      name: 'Matches',
      description: '매칭 관련 API'
    },
    {
      name: 'Chat',
      description: '채팅 관련 API'
    },
    {
      name: 'Payments',
      description: '결제 관련 API'
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts'
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
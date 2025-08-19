# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Glimpse is a privacy-focused Korean dating app with a complete monorepo architecture. The app focuses on **anonymity and privacy** with group/company-based matching. Key features include anonymous "like" systems, SMS-based verification, real-time encrypted chat, secure payment system, and premium subscriptions.

**Core Concept:** Users join groups (company, university, hobby groups) and can anonymously express interest in other group members. Only when interest is mutual do users learn each other's nicknames for chatting.

## Technology Stack

### Full-Stack Monorepo Architecture
- **Structure:** npm workspaces with mobile/, server/, shared/
- **Language:** TypeScript with strict mode across all packages
- **Type Safety:** Shared interfaces between frontend-backend
- **Development:** Unified development workflow and build process

### Frontend (Mobile App)
- **Framework:** React Native with Expo (managed workflow)
- **State Management:** Zustand for application state
- **Authentication:** Clerk for user auth, session management, and subscription billing
- **Payment Processing:** Stripe React Native SDK + Korean payment gateways
- **Real-time Communication:** Socket.IO client for live messaging
- **Styling:** Custom design system with utility constants
- **Testing:** Playwright for E2E testing, Jest for unit tests
- **Security:** Expo SecureStore for sensitive data

### Backend (Server)
- **Framework:** Node.js with Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with Clerk integration
- **Payments:** TossPay, KakaoPay, Stripe webhooks
- **Real-time:** Socket.IO server with WebSocket handling
- **Storage:** AWS S3 for file uploads with Sharp image processing
- **Notifications:** Firebase Cloud Messaging (FCM)
- **External APIs:** Kakao Maps, Naver/Google OCR for document verification
- **Security:** AES-GCM encryption, rate limiting, input validation

### Shared (Common)
- **Types:** TypeScript interfaces shared between frontend-backend
- **Constants:** Common configuration and business rules
- **Utils:** Shared utility functions and validation schemas

## Current Implementation Status (2025-01-24)

### ✅ Phase 1: Complete Monorepo Migration (Completed)
- Full backend migration from Java Spring Boot to Node.js/TypeScript
- Monorepo structure with npm workspaces
- Shared type system ensuring frontend-backend type safety
- Unified development and build processes

### ✅ Phase 2: Core Business Logic (Completed)
- **User Management:** Registration, authentication, profile management
- **Group System:** 4 group types (Official, Created, Instance, Location)
- **Anonymous Matching:** Like system with cooldown and credit management
- **Real-time Chat:** Encrypted messaging with Socket.IO
- **Payment System:** Korean payment gateways (Toss, Kakao) integration
- **Notification System:** Firebase push notifications

### ✅ Phase 3: Advanced Features (Completed)
- **Company Verification:** Email domain + OCR document verification
- **File Management:** AWS S3 with image processing and optimization
- **Location Services:** Kakao Maps integration for location-based groups
- **Security Services:** Comprehensive encryption and authentication
- **Admin Tools:** User management and reporting systems

### 🚀 Next Phase Options:
- **Phase 4A:** Production Deployment & DevOps Setup
- **Phase 4B:** Advanced Analytics & Business Intelligence
- **Phase 4C:** AI-Powered Matching Algorithm Enhancement
- **Phase 4D:** Video/Voice Features & Rich Media

## Critical Commands

### Monorepo Development
```bash
# Start all services
npm run dev                    # Start both mobile and server concurrently
npm run dev:mobile             # Start mobile app only
npm run dev:server             # Start server only

# Building
npm run build                  # Build all workspaces
npm run build:mobile           # Build mobile app
npm run build:server           # Build server

# Testing & Quality
npm run test                   # Run all tests across workspaces
npm run test:mobile            # Run mobile tests
npm run test:server            # Run server tests
npm run typecheck             # Check TypeScript across all packages
npm run lint                  # Lint all packages
npm run format                # Format all code

# Database Operations
npm run db:generate           # Generate Prisma client
npm run db:push              # Push schema changes
npm run db:migrate           # Run migrations
npm run db:studio            # Open Prisma Studio
```

### Mobile Development
```bash
# Expo Development
cd mobile && expo start              # Start development server
cd mobile && expo start --ios        # Start iOS simulator
cd mobile && expo start --android    # Start Android emulator

# Building
cd mobile && eas build --platform all  # Build with Expo Application Services
```

### Server Development
```bash
# Development
cd server && npm run dev              # Start with nodemon
cd server && npm run build           # Build TypeScript
cd server && npm start              # Start production server

# Database
cd server && npx prisma studio       # Open database GUI
cd server && npx prisma migrate dev  # Run development migrations
```

## Architecture Guidelines

### Monorepo Project Structure
```
📁 glimpse-monorepo/
├── 📁 mobile/                    # React Native mobile app
│   ├── components/              # Reusable UI components
│   │   ├── auth/               # Authentication components
│   │   ├── chat/               # Real-time messaging components
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── premium/            # Payment & subscription components
│   │   │   ├── PricingCard.tsx
│   │   │   └── PaymentModal.tsx
│   │   ├── ErrorBoundary.tsx   # Global error handling
│   │   └── ContentItem.tsx     # Content display component
│   ├── screens/                # Main app screens
│   │   ├── auth/              # Authentication screens
│   │   ├── HomeScreen.tsx     # Main feed
│   │   ├── GroupsScreen.tsx   # Group browsing
│   │   ├── MatchesScreen.tsx  # Match management
│   │   ├── ProfileScreen.tsx  # User profile
│   │   ├── ChatScreen.tsx     # Real-time messaging
│   │   ├── PremiumScreen.tsx  # Subscription management
│   │   └── LocationGroupScreen.tsx # GPS-based groups
│   ├── navigation/            # Navigation configuration
│   ├── services/              # External service integrations
│   │   ├── auth/             # Clerk authentication
│   │   ├── chat/             # WebSocket service
│   │   ├── payment/          # Premium payment service
│   │   ├── location/         # Location-based services
│   │   └── notifications/    # Push notification handling
│   ├── store/                # Zustand state management
│   │   └── slices/           # Feature-based stores
│   │       ├── authSlice.ts
│   │       ├── likeSlice.ts
│   │       ├── groupSlice.ts
│   │       ├── chatSlice.ts  # Real-time messaging state
│   │       ├── premiumSlice.ts # Subscription state
│   │       ├── locationSlice.ts # Location state
│   │       └── notificationSlice.ts # Notification state
│   ├── utils/                # Utility functions
│   └── types/                # Mobile-specific types
├── 📁 server/                    # Node.js backend server
│   ├── src/
│   │   ├── controllers/          # API endpoint controllers
│   │   │   ├── AuthController.ts
│   │   │   ├── UserController.ts
│   │   │   ├── GroupController.ts
│   │   │   ├── MatchController.ts
│   │   │   ├── ChatController.ts
│   │   │   └── PaymentController.ts
│   │   ├── services/             # Business logic services
│   │   │   ├── AuthService.ts
│   │   │   ├── UserService.ts
│   │   │   ├── GroupService.ts
│   │   │   ├── LikeService.ts
│   │   │   ├── MatchingService.ts
│   │   │   ├── ChatService.ts
│   │   │   ├── PaymentService.ts
│   │   │   ├── NotificationService.ts
│   │   │   ├── EncryptionService.ts
│   │   │   ├── EmailService.ts
│   │   │   ├── FileUploadService.ts
│   │   │   ├── LocationService.ts
│   │   │   ├── FirebaseService.ts
│   │   │   ├── OCRService.ts
│   │   │   └── CompanyVerificationService.ts
│   │   ├── middleware/           # Express middleware
│   │   │   ├── auth.ts          # JWT authentication
│   │   │   ├── errorHandler.ts  # Global error handling
│   │   │   ├── rateLimiter.ts   # API rate limiting
│   │   │   └── notFound.ts      # 404 handler
│   │   ├── routes/              # API route definitions
│   │   └── index.ts             # Server entry point with Socket.IO
│   ├── prisma/                  # Database schema and migrations
│   │   └── schema.prisma        # Complete database schema
│   └── package.json            # Server dependencies
├── 📁 shared/                    # Shared types and utilities
│   ├── types/                   # TypeScript interfaces
│   │   └── index.ts            # All shared type definitions
│   ├── constants/              # Shared constants
│   │   └── index.ts           # Business rules and configuration
│   ├── utils/                  # Common utility functions
│   │   └── index.ts           # Validation, formatting, etc.
│   └── package.json           # Shared package configuration
├── 📄 package.json               # Root workspace configuration
├── 📄 requirements.md           # Integrated project requirements
└── 📄 README.md                # Project documentation
```

### Key Implementation Patterns

1. **Monorepo Architecture**
   - npm workspaces for dependency management
   - Shared TypeScript types across frontend-backend
   - Unified development and build processes
   - Type-safe API contracts

2. **Backend Service Layer Pattern**
   - Controllers handle HTTP requests/responses
   - Services contain business logic
   - Repository pattern with Prisma ORM
   - Middleware for cross-cutting concerns (auth, validation, etc.)

3. **Frontend State Management**
   - Zustand for application state
   - Feature-based slices (auth, chat, premium, etc.)
   - Persistence with SecureStore/AsyncStorage
   - Real-time state synchronization with WebSocket

4. **Real-time Systems**
   - Socket.IO for live messaging
   - WebSocket reconnection handling
   - Optimistic UI updates
   - End-to-end encryption for messages

5. **Security Implementation**
   - JWT authentication with Clerk integration
   - AES-GCM encryption for sensitive data
   - Rate limiting and input validation
   - Anonymous user system until matching

## Business Model & Korean Market Features

### Pricing Strategy (Korean Market)
- **Free Tier:** 1 daily like + basic matching
- **Credit Packages:** ₩2,500 (5개) ~ ₩19,000 (50개) microtransactions
- **Premium Monthly:** ₩9,900 (unlimited likes + premium features)
- **Premium Yearly:** ₩99,000 (2개월 무료, 17% 할인)

### Premium Features
- 무제한 좋아요 (Unlimited likes)
- 좋아요 받은 사람 확인 (See who likes you)
- 우선 매칭 (Priority matching)
- 좋아요 되돌리기 (Rewind likes)
- 슈퍼 좋아요 (Super likes)
- 읽음 표시 (Read receipts)
- 온라인 상태 표시 (Online status)
- 프리미엄 배지 (Premium badge)

### Korean Market Integrations
- **SMS Authentication:** Korean carrier support
- **Payment Gateways:** TossPay, KakaoPay integration
- **Maps:** Kakao Map API for location features
- **OCR:** Naver/Google Vision for document verification
- **Company Culture:** Email domain verification for company groups

### Target Metrics
- **Expected ARPU:** ₩15,000-25,000
- **Conversion Target:** 5-8% free-to-premium
- **Retention Focus:** Anonymous matching + premium value

## Important Business Rules

### Anonymity System
- Users only see nicknames, never real names
- Real identity revealed only after mutual matching
- All interactions are anonymous until both users "like" each other
- Premium users get enhanced anonymity controls

### Group Types & Verification
1. **Official Groups** - Company/university verified (email domain + OCR)
2. **Created Groups** - User-created hobby/interest groups  
3. **Instance Groups** - One-time event-based groups
4. **Location Groups** - GPS/QR code verified location groups

### Matching & Like System
- **Free Users:** 1 daily like + purchased likes
- **Premium Users:** Unlimited likes + premium features
- 2-week cooldown between likes to same person
- Mutual likes create matches and reveal nicknames
- Groups need minimum gender balance to activate matching

### Security & Privacy Requirements

**Critical:** This is a dating app handling sensitive personal data and anonymity requirements.

- **Data Privacy:** GDPR-compliant, minimal data collection
- **Anonymous Until Match:** Strict enforcement of anonymity rules
- **Payment Security:** PCI DSS compliance, no card data storage
- **Real-time Security:** WebSocket authentication, message encryption
- **Secure Storage:** Encrypted storage for all sensitive data

## Development Workflow

### Quality Assurance Process
1. **Development:** TypeScript strict mode + ESLint across all packages
2. **Testing:** Unit tests + E2E with Playwright + Integration tests
3. **Type Safety:** Shared types ensure no frontend-backend mismatches
4. **Review:** Code review process with comprehensive testing
5. **Commit:** Structured commit messages with implementation details

### Testing Strategy
- **Unit Testing:** Components, services, utilities across all packages
- **Integration Testing:** API endpoints, database operations
- **E2E Testing:** Complete user journeys with Playwright
- **Type Testing:** Compilation checks across frontend-backend
- **Performance Testing:** Real-time messaging, payment flows

### Code Quality Standards
- **Response Language:** Always respond in Korean (응답은 한글로한다)
- **TypeScript:** Strict mode, explicit types, no any across all packages. MUST ensure all implementations strictly follow TypeScript types to prevent type errors, lint errors, and runtime errors
- **Type Safety:** When implementing features, MUST strictly adhere to defined interfaces and types. Never use 'any' type. Always fix TypeScript errors before completing implementation
- **Accessibility:** All interactive elements labeled
- **Error Handling:** Comprehensive try-catch with user feedback
- **Testing:** 80%+ coverage for business logic
- **Security:** Input validation, rate limiting, encryption
### 🚨 중요: Git Commit 정책

**절대 금지 사항:**
- Claude Code가 임의로 커밋하는 것은 **절대 금지**입니다
- 사용자의 명시적 요청 없이는 어떤 경우에도 커밋하지 마세요

**커밋 허용 조건:**
사용자가 다음과 같은 **명시적 요청**을 할 때만 커밋 가능:
- "커밋해줘" 
- "git commit 해줘"
- "변경사항 커밋해줘"
- "지금 커밋하고 싶어"
- "commit please"

**작업 완료 후 권장사항:**
- 작업 완료 시 커밋하지 말고 단순히 완료 보고만 할것
- 사용자가 원한다면 직접 커밋 요청을 할 것
- 이는 사용자의 프로젝트 관리 주도권을 보장하기 위함

**예외 상황:**
- 보안상 치명적인 문제 발견 시에만 사용자에게 즉시 커밋 필요성을 알리되, 직접 커밋하지는 않음

## External Service Integrations

### Current Integrations
- **Clerk:** Authentication, user management, subscription billing
- **Stripe:** Payment processing, subscription management
- **TossPay/KakaoPay:** Korean payment gateway integration
- **Socket.IO:** Real-time messaging infrastructure
- **AWS S3:** File storage with Sharp image processing
- **Firebase:** Push notification system (FCM)
- **Kakao Maps:** Location-based services for Korean market
- **Naver/Google OCR:** Document verification for company authentication
- **PostgreSQL:** Primary database with Prisma ORM

### Integration Architecture
- Service layer pattern for external APIs
- Error handling and retry logic
- Offline capability where appropriate
- Rate limiting and API optimization
- Webhook handling for payment confirmations

## Environment Setup Requirements

### Development Environment
- Node.js 18+ with npm 9+
- PostgreSQL 14+ (local or Docker)
- Redis (for session management and caching)
- Expo CLI 50+ with React Native 0.79+

### External Service Configuration
- **Clerk:** Dashboard configuration for authentication
- **Stripe:** Dashboard setup for payments + webhooks
- **TossPay/KakaoPay:** Korean payment gateway credentials
- **AWS S3:** Bucket setup for file storage
- **Firebase:** Project setup for FCM push notifications
- **Kakao:** API keys for Maps and OCR services
- **Naver:** API keys for OCR and other services

### Production Requirements
- Docker containers for deployment
- Environment variable management
- SSL certificates
- CDN setup for static assets
- Database backup and recovery
- Monitoring and alerting systems

## Performance Guidelines

### Full-Stack Optimizations
- Shared type compilation optimization
- Bundle size optimization with code splitting
- Database query optimization with Prisma
- API response caching strategies
- WebSocket connection pooling

### Real-time Performance
- Message batching for high traffic
- Optimistic updates for immediate UX
- Background sync for offline messages
- Connection state management

### Database Performance
- Proper indexing for common queries
- Connection pooling optimization
- Query optimization for matching algorithms
- Data archival strategies for old messages

## Common Development Issues & Solutions

### Monorepo Specific
- **Type Sync:** Ensure shared types are properly imported
- **Build Order:** Shared package must build before others
- **Dependency Management:** Use workspace: protocol for internal deps

### Cross-Platform Compatibility
- **Expo Compatibility:** Verify all packages support Expo managed workflow
- **Platform Differences:** Test payment flows on both iOS/Android
- **Network Handling:** Implement proper offline/online state management

### Korean Market Specific
- **SMS Providers:** Handle different Korean carrier requirements
- **Payment Integration:** Test all Korean payment methods thoroughly
- **Character Encoding:** Proper handling of Korean text in all systems

### Development Environment API Connection
**Problem**: 401 Unauthorized errors when mobile app connects to server in development
**Root Cause**: Server requires `x-dev-auth: true` header in development mode for security

**Solution Checklist**:
1. **Mobile API Client** (`mobile/services/api/config.ts`):
   - Must send `x-dev-auth: true` header when detecting development environment
   - Detection logic: Check for `__DEV__`, `NODE_ENV=development`, or localhost URLs
   
2. **Server CORS** (`server/src/main.ts`):
   - Must include `x-dev-auth` in `allowedHeaders`
   - In development, use `origin: true` to allow all origins
   
3. **Network Access** (`mobile/.env`):
   - Use machine's actual IP address instead of localhost
   - Example: `API_URL=http://172.20.10.13:3001/api/v1`
   
4. **Verification**:
   ```bash
   # Test server API directly
   curl -H "x-dev-auth: true" http://localhost:3001/api/v1/groups
   ```

**Prevention**: When modifying authentication or security middleware, always update both server AND client configurations simultaneously

### CRITICAL: Real API Integration Requirement (2025-01-19)
**NEVER USE MOCK DATA IN PRODUCTION CODE**

After extensive debugging, we learned that ALL features must use real API integration:
1. **No Mock Data**: Never return hardcoded data in API services
2. **Real Database**: Always ensure database is properly seeded with test data
3. **Authentication**: Use real auth tokens with proper user sessions
4. **Error Handling**: Implement proper error handling for API failures

**Database Requirements**:
- Ensure test users exist in the database (e.g., `cmeh8afwr000i1mb7ikv3lq1a`)
- Verify foreign key constraints are satisfied
- Use proper group IDs that exist in the database

**Testing Approach**:
1. Always test with real API calls: `curl -H "x-dev-auth: true" http://localhost:3001/api/v1/...`
2. Check database state: `psql -U postgres -d glimpse_dev -c "SELECT * FROM table_name"`
3. Monitor server logs for errors
4. Verify response data structure matches TypeScript interfaces

### Common React Native Development Issues

**1. Missing Package Imports**
**Problem**: TypeScript errors like "Cannot find module 'expo-blur'"
**Solution**: Always check and install required packages before using them
```bash
npm install expo-blur --legacy-peer-deps
```

**2. Icon Name Errors**
**Problem**: MaterialCommunityIcons icon names not found (e.g., "email-heart-outline")
**Solution**: Use valid icon names from the icon library. Check the icon directory or use simpler alternatives:
- ❌ `email-heart-outline` → ✅ `email-outline`
- Always verify icon names at: https://icons.expo.fyi/

**3. i18n Translation Key Format**
**Problem**: Translation keys not working correctly
**Solution**: Use namespace separator correctly:
- ❌ `t('common.language')` → ✅ `t('common:language')`
- Format: `t('namespace:key')` not `t('namespace.key')`

**4. Blank Screen Issues**
**Common Causes**:
- TypeScript compilation errors
- Missing package dependencies  
- Incorrect import paths
- Runtime errors in components

**Debug Steps**:
1. Check TypeScript errors: `npm run typecheck:real`
2. Clear Metro cache: `npx expo start --clear`
3. Check console logs in terminal
4. Verify all dependencies are installed
5. Kill existing processes on conflicting ports

**5. Port Conflicts**
**Problem**: "Error: listen EADDRINUSE: address already in use"
**Solution**:
```bash
# Find process using port
lsof -i :3001
# Kill the process
kill -9 [PID]
```

## Next Development Priorities

### Phase 4 Options (Choose Based on Business Needs):
1. **Production Deployment:** DevOps setup, monitoring, CI/CD
2. **Analytics & BI:** User behavior tracking, business intelligence
3. **AI-Powered Matching:** Machine learning for better compatibility
4. **Rich Media Features:** Video calls, voice messages, story features

### Technical Debt & Improvements
- Comprehensive error monitoring and alerting
- Performance monitoring integration
- Advanced security auditing
- Automated testing improvements
- Documentation completion

---

Remember: This is a privacy-focused Korean dating app with a complete full-stack implementation. Always prioritize user anonymity, payment security, Korean user experience, and type safety across the entire stack in all development decisions.

# Using Gemini CLI for Monorepo Analysis

When analyzing this large monorepo codebase, use the Gemini CLI with its massive context window for comprehensive analysis.

## Monorepo Analysis Examples

**Analyze entire monorepo:**
```bash
gemini -p "@mobile/ @server/ @shared/ Analyze the complete monorepo architecture and identify any inconsistencies"
```

**Check type consistency across packages:**
```bash
gemini -p "@shared/types/ @mobile/types/ @server/src/ Are the TypeScript types consistent across frontend and backend?"
```

**Verify business logic implementation:**
```bash
gemini -p "@server/src/services/ @mobile/store/ Is the business logic properly implemented on both frontend and backend?"
```

**Security audit across stack:**
```bash
gemini -p "@server/src/ @mobile/services/ Perform a security audit of the authentication and payment systems"
```

**API contract verification:**
```bash
gemini -p "@server/src/controllers/ @mobile/services/api/ Do the API contracts match between server controllers and mobile API services?"
```

Use Gemini CLI when:
- Analyzing cross-package dependencies and consistency
- Verifying complete feature implementation across frontend-backend
- Performing comprehensive security audits
- Checking for architectural patterns and best practices
- Understanding the complete data flow from mobile to server

This ensures comprehensive analysis of the monorepo structure and maintains consistency across all packages.
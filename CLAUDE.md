# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Glimpse is a Korean dating app frontend built with React Native and Expo. The app focuses on **anonymity and privacy** with group/company-based matching. Key features include anonymous "like" systems, SMS-based verification, real-time chat, secure payment system, and premium subscriptions.

**Core Concept:** Users join groups (company, university, hobby groups) and can anonymously express interest in other group members. Only when interest is mutual do users learn each other's nicknames for chatting.

## Technology Stack

- **Frontend Framework:** React Native with Expo (managed workflow)
- **Language:** TypeScript with strict mode enabled
- **State Management:** Zustand for application state
- **Authentication:** Clerk for user auth, session management, and subscription billing
- **Payment Processing:** Stripe React Native SDK for secure payments
- **Real-time Communication:** Socket.IO for live messaging
- **Styling:** Custom design system with utility constants
- **Testing:** Playwright for E2E testing, Jest for unit tests
- **Code Quality:** ESLint + Prettier
- **Security:** Expo SecureStore for sensitive data

## Current Implementation Status (2025-01-22)

### ✅ Phase 1: MVP Foundation (Completed)
- Clerk authentication with SMS verification
- Core navigation (Home, Groups, Matches, Profile)
- Basic state management with Zustand
- TypeScript setup with strict mode

### ✅ Phase 2: Content & Group Management (Completed)
- Content creation and management system
- Group creation, joining, and management
- Enhanced UI components with accessibility
- Dummy data systems for development

### ✅ Phase 3: Real-time Chat System (Completed)
- Socket.IO WebSocket service integration
- Complete chat UI (MessageBubble, MessageInput, TypingIndicator)
- Real-time messaging with optimistic updates
- Chat state management with Zustand
- **Gemini Review Score: 42/50 (84%)**

### ✅ Phase 4: Premium Payment System (Completed)
- Clerk + Stripe payment integration
- Subscription management (월 9,900원, 연 99,000원)
- Like packages for microtransactions (₩2,500-19,000)
- Premium features differentiation
- **Gemini Review Score: 41/50 (82%)**

### 🚀 Next Phase Options:
- **Phase 5A:** Push Notifications & Real-time Updates
- **Phase 5B:** Location-based Groups & GPS Integration
- **Phase 5C:** Backend API Integration & Production Setup

## Development Commands

```bash
# Development
expo start              # Start development server
expo start --web        # Start web version
expo start --ios        # Start iOS simulator
expo start --android    # Start Android emulator

# Building
expo build:android      # Build for Android
expo build:ios         # Build for iOS
eas build --platform all  # Build with Expo Application Services

# Testing & Quality
npm test               # Run unit tests
npx playwright test    # Run E2E tests
npm run lint          # Run ESLint
npm run typecheck     # Run TypeScript checks
npm run format        # Format code with Prettier
npm run lint:fix      # Auto-fix ESLint issues
```

## Architecture Guidelines

### Current Directory Structure
```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── chat/            # Real-time messaging components
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   └── TypingIndicator.tsx
│   ├── premium/         # Payment & subscription components
│   │   ├── PricingCard.tsx
│   │   └── PaymentModal.tsx
│   ├── ErrorBoundary.tsx # Global error handling
│   └── ContentItem.tsx  # Content display component
├── screens/             # Main app screens
│   ├── auth/           # Authentication screens
│   ├── HomeScreen.tsx  # Main feed
│   ├── GroupsScreen.tsx # Group browsing
│   ├── MatchesScreen.tsx # Match management
│   ├── ProfileScreen.tsx # User profile
│   ├── ChatScreen.tsx  # Real-time messaging
│   ├── PremiumScreen.tsx # Subscription management
│   ├── CreateContentScreen.tsx
│   ├── CreateGroupScreen.tsx
│   └── MyGroupsScreen.tsx
├── navigation/          # Navigation configuration
│   └── AppNavigator.tsx # Complete navigation setup
├── services/           # External service integrations
│   ├── auth/           # Clerk authentication
│   ├── chat/           # WebSocket service
│   │   └── websocket-service.ts
│   └── payment/        # Premium payment service
│       └── premium-service.ts
├── store/              # Zustand state management
│   └── slices/         # Feature-based stores
│       ├── authSlice.ts
│       ├── likeSlice.ts
│       ├── groupSlice.ts
│       ├── chatSlice.ts # Real-time messaging state
│       └── premiumSlice.ts # Subscription state
├── utils/              # Utility functions
│   ├── constants.ts    # App-wide constants
│   ├── dateUtils.ts    # Time formatting utilities
│   ├── mockData.ts     # Development dummy data
│   └── icons.ts        # Icon name constants
└── types/              # TypeScript definitions
    └── index.ts        # All type definitions
```

### Key Implementation Patterns

1. **Component Architecture**
   - Functional components with hooks
   - React.memo for performance optimization
   - Comprehensive accessibility support
   - Error boundaries for stability

2. **State Management with Zustand**
   - Feature-based slices (auth, chat, premium, etc.)
   - Selectors for performance optimization
   - Persistence with SecureStore/AsyncStorage
   - Real-time state synchronization

3. **Real-time Systems**
   - Socket.IO for live messaging
   - WebSocket reconnection handling
   - Optimistic UI updates
   - Typing indicators and read receipts

4. **Payment Integration**
   - Clerk authentication + Stripe processing
   - Subscription and one-time payment support
   - Premium feature gating
   - Korean market pricing optimization

5. **Security Implementation**
   - Clerk authentication with SMS verification
   - Expo SecureStore for sensitive data
   - Anonymous user system until matching
   - Input sanitization and validation

## Business Model & Premium Features

### Pricing Strategy (Korean Market)
- **Free Tier:** 1 daily like + basic matching
- **Premium Monthly:** ₩9,900 (unlimited likes + premium features)
- **Premium Yearly:** ₩99,000 (2개월 무료, 17% 할인)
- **Like Packages:** ₩2,500 (5개) ~ ₩19,000 (50개)

### Premium Features
- 무제한 좋아요 (Unlimited likes)
- 좋아요 받은 사람 확인 (See who likes you)
- 우선 매칭 (Priority matching)
- 좋아요 되돌리기 (Rewind likes)
- 슈퍼 좋아요 (Super likes)
- 읽음 표시 (Read receipts)
- 온라인 상태 표시 (Online status)
- 프리미엄 배지 (Premium badge)

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
1. **Official Groups** - Company/university verified (email domain)
2. **Created Groups** - User-created hobby/interest groups  
3. **Instance Groups** - One-time event-based groups
4. **Location Groups** - GPS/QR code verified location groups

### Matching & Like System
- **Free Users:** 1 daily like + purchased likes
- **Premium Users:** Unlimited likes + premium features
- 2-week cooldown between likes to same person
- Mutual likes create matches and reveal nicknames
- Groups need minimum gender balance to activate matching

## Development Workflow

### Quality Assurance Process
1. **Development:** TypeScript strict mode + ESLint
2. **Testing:** Unit tests + E2E with Playwright
3. **Review:** Gemini CLI analysis for code quality
4. **Commit:** Structured commit messages with implementation details

### Code Review Process
**🔥 필수 프로세스 - 반드시 준수할 것:**
1. **구현 완료** → 2. **Gemini CLI 검사** → 3. **Claude가 피드백 검증 및 적용** → 4. **커밋**

**절대 건너뛰지 말 것:**
- 모든 새 기능/Phase 완료 후 **반드시** `gemini -p "@src/ 이번 구현한 기능을 검토해주세요"` 실행
- Gemini 피드백 점수 **목표: 40+ / 50점** (필수 달성)
- Claude는 Gemini 피드백을 **모두 검토하고 적용**한 후에만 커밋
- 모든 새 기능은 접근성 및 TypeScript 완전 지원 필수
- **커밋 전 필수 체크리스트:**
  - [ ] `npm run typecheck` 통과
  - [ ] `npm run lint` 통과 (에러 없음)
  - [ ] Gemini 검토 완료 및 피드백 적용
  - [ ] 기능 동작 테스트 완료

### Testing Strategy
- **Unit Testing:** Components, stores, utilities
- **Integration Testing:** Clerk auth flows, payment processing
- **E2E Testing:** Complete user journeys
- **Performance Testing:** Real-time messaging, payment flows

## Security & Privacy Requirements

**Critical:** This is a dating app handling sensitive personal data and anonymity requirements.

- **Data Privacy:** GDPR-compliant, minimal data collection
- **Anonymous Until Match:** Strict enforcement of anonymity rules
- **Payment Security:** Stripe PCI compliance, no card data storage
- **Real-time Security:** WebSocket authentication, message encryption
- **Secure Storage:** Expo SecureStore for tokens and sensitive data

## Performance Guidelines

### React Native Optimizations
- FlatList for all data lists (messages, groups, users)
- React.memo for expensive chat components
- Image lazy loading and caching
- Bundle size optimization with code splitting

### Real-time Performance
- WebSocket connection pooling
- Message batching for high traffic
- Optimistic updates for immediate UX
- Background sync for offline messages

### State Management Performance
- Zustand selectors to prevent unnecessary re-renders
- Persistent storage optimization
- Memory leak prevention in real-time features

## External Service Integrations

### Current Integrations
- **Clerk:** Authentication, user management, subscription billing
- **Stripe:** Payment processing, subscription management
- **Socket.IO:** Real-time messaging infrastructure
- **Expo:** Mobile app framework and services

### Integration Architecture
- Service layer pattern for external APIs
- Error handling and retry logic
- Offline capability where appropriate
- Rate limiting and API optimization

## Development Notes

### Environment Setup Requirements
- Expo CLI 50+ with React Native 0.79+
- Node.js 18+ with npm 9+
- Clerk dashboard configuration
- Stripe dashboard setup for payments
- Socket.IO server (development/production)

### Code Quality Standards
- **Response Language:** Always respond in Korean (응답은 한글로한다)
- **TypeScript:** Strict mode, explicit types, no any
- **Accessibility:** All interactive elements labeled
- **Error Handling:** Comprehensive try-catch with user feedback
- **Testing:** 80%+ coverage for business logic

### Debugging Tools
- **React Native Debugger** for component debugging
- **Expo DevTools** for performance monitoring
- **Clerk Dashboard** for authentication debugging
- **Stripe Dashboard** for payment testing
- **Zustand DevTools** for state inspection

### Common Development Issues
- **Expo Compatibility:** Verify all packages support Expo managed workflow
- **Platform Differences:** Test payment flows on both iOS/Android
- **Network Handling:** Implement proper offline/online state management
- **Memory Management:** Monitor WebSocket connections and state cleanup

## Next Development Priorities

### Phase 5 Options (Pick One):
1. **Push Notifications:** Real-time match/message alerts
2. **Location Features:** GPS-based groups, nearby users
3. **Backend Integration:** Production API, database setup
4. **Advanced Features:** Video calls, voice messages, stories

### Technical Debt & Improvements
- WebSocket reconnection logic enhancement
- Payment retry mechanism implementation
- Comprehensive test coverage
- Performance monitoring integration
- Error tracking and analytics

---

Remember: This is a privacy-focused Korean dating app. Always prioritize user anonymity, payment security, and Korean user experience in all development decisions.

# Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the gemini command:

### Examples:

**Single file analysis:**
```bash
gemini -p "@src/main.py Explain this file's purpose and structure"
```

**Multiple files:**
```bash
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"
```

**Entire directory:**
```bash
gemini -p "@src/ Summarize the architecture of this codebase"
```

**Multiple directories:**
```bash
gemini -p "@src/ @tests/ Analyze test coverage for the source code"
```

**Current directory and subdirectories:**
```bash
gemini -p "@./ Give me an overview of this entire project"
# Or use --all_files flag:
gemini --all_files -p "Analyze the project structure and dependencies"
```

### Implementation Verification Examples

**Check if a feature is implemented:**
```bash
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"
```

**Verify authentication implementation:**
```bash
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"
```

**Check for specific patterns:**
```bash
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"
```

**Verify error handling:**
```bash
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"
```

**Check for rate limiting:**
```bash
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"
```

**Verify caching strategy:**
```bash
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"
```

**Check for specific security measures:**
```bash
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"
```

**Verify test coverage for features:**
```bash
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"
```

### When to Use Gemini CLI

Use `gemini -p` when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

### Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results
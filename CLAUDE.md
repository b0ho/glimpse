# CLAUDE.md

> 🎯 **Glimpse**: Privacy-focused Korean dating app with complete monorepo architecture  
> 💡 This file provides guidance to Claude Code when working with this repository

## 🚀 Quick Start

```bash
# Start development environment
npm run dev                 # Mobile + server
npm run dev:web             # Web landing page (Vite + React)
npm run dev:admin           # Admin dashboard (Next.js)
npm run dev:mobile          # Mobile app (Expo)
npm run dev:server          # API server (Node.js)

# Start all services
npm run start:all           # All services concurrently

# Quality checks
npm run typecheck           # TypeScript across all packages
npm run lint               # ESLint across all packages
npm run test               # Full test suite
```

## 📋 Project Overview

**Glimpse** is a privacy-focused Korean dating app with anonymous matching system. Users join groups (company, university, hobby) and can anonymously express interest. Only mutual matches reveal nicknames for chat.

### 🎯 Core Features
- **Anonymous Matching**: Identity revealed only after mutual likes
- **Group-Based System**: 4 types (Official, Created, Instance, Location) 
- **Real-time Chat**: Encrypted messaging with Socket.IO
- **Korean Payment**: TossPay, KakaoPay integration
- **Premium Subscriptions**: Unlimited likes + enhanced features
- **Web Landing Page**: Marketing site with pricing and features
- **Admin Dashboard**: User management, content moderation, analytics

### 📊 Current Status (2025-08-24)
✅ **Completed**: Full-stack monorepo, core business logic, advanced features  
🚀 **Next Phase**: Production deployment, analytics, AI matching, video features

## 🏗️ Architecture

### Monorepo Structure
```
glimpse/
├── web/              # Vite + React (Landing Page)
│   ├── src/components/   # React components
│   ├── src/types/        # Web-specific types
│   ├── src/utils/        # Web utilities
│   ├── src/assets/       # Static assets
│   └── public/           # Public files
├── admin/            # Next.js (Admin Dashboard)
│   ├── src/app/          # App router pages
│   ├── src/components/   # Admin components
│   ├── src/types/        # Admin-specific types
│   ├── src/lib/          # Admin utilities
│   └── src/hooks/        # Custom hooks
├── mobile/           # React Native + Expo
│   ├── components/       # UI components
│   ├── screens/          # App screens
│   ├── services/         # API integrations
│   ├── store/           # Zustand state
│   ├── types/           # Mobile-specific types
│   ├── utils/           # Mobile utilities
│   └── navigation/      # App navigation
├── server/           # Node.js + NestJS
│   ├── src/
│   │   ├── controllers/  # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Express middleware
│   │   ├── types/        # Server-specific types
│   │   └── routes/       # Route definitions
│   └── prisma/          # Database schema
└── package.json      # Root configuration
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Web (Landing)** | Vite, React 19, TypeScript, Tailwind CSS, Framer Motion |
| **Admin Dashboard** | Next.js 15, React 18, Clerk Auth, Shadcn/UI, Tailwind CSS |
| **Mobile App** | React Native, Expo, Zustand, TypeScript, Socket.IO |
| **API Server** | Node.js, NestJS, Prisma, PostgreSQL, Socket.IO |
| **Real-time** | Socket.IO, WebSocket |
| **Authentication** | Clerk, JWT |
| **Payments** | Stripe, TossPay, KakaoPay |
| **Storage & Cloud** | AWS S3, Firebase FCM |
| **Korean Services** | Kakao Maps, Naver OCR |
| **Independent Packages** | Each package has own types & utilities |

## 🌍 Cross-Platform Compatibility (CRITICAL)

### Platform Requirements
**MANDATORY**: All features MUST work on Web, iOS, and Android platforms without exceptions.

### Core Principles
1. **Universal Functionality**: Every feature must be implemented for all three platforms
2. **Platform Detection**: Use `Platform.OS` or `Platform.select()` ONLY for technical differences (styling, APIs), NEVER for functional differences
3. **Graceful Degradation**: If a native feature isn't available on web, provide alternative implementation
4. **No Platform Exclusivity**: Never implement features that only work on one platform
5. **Consistent User Experience**: All platforms should provide identical functionality and behavior
6. **🚨 Universal Solutions Required**: When fixing bugs or implementing features, the solution MUST work identically across ALL platforms - no "Web에서만", "Android에서만", "iOS에서만" solutions allowed

### ⚠️ CRITICAL RULE: Platform Consistency Enforcement

**절대 금지 사항 (ABSOLUTELY FORBIDDEN)**:
```javascript
// ❌ NEVER - Platform-specific functionality
if (Platform.OS === 'web') {
  // Web만 특별한 기능이나 수정사항 적용
  applySpecialWebFix();
}
// 이렇게 하면 Android/iOS는 버그가 계속 남아있음!

// ❌ NEVER - Different behavior per platform
if (Platform.OS === 'android') {
  return <AndroidOnlyComponent />;
}
```

**올바른 접근 방법 (CORRECT APPROACH)**:
```javascript
// ✅ CORRECT - Universal solution with technical adaptation
useEffect(() => {
  // 모든 플랫폼에서 동일한 기능 실행
  if (typeof document !== 'undefined') {
    // Web 환경의 기술적 구현
    document.documentElement.classList.add('dark');
  }
  // Native는 NativeWind가 자동 처리
  // 결과: 모든 플랫폼에서 다크모드 적용됨
}, [isDark]);

// ✅ CORRECT - Feature works everywhere
const handleFeature = () => {
  // 모든 플랫폼에서 동일한 로직
  performAction();
  
  // 기술적 차이만 처리
  if (Platform.OS === 'web') {
    // Web API 사용
  } else {
    // Native API 사용
  }
  // 결과는 동일!
};
```

**핵심 원칙**:
- 버그 수정 시: 모든 플랫폼에서 동시에 해결되는 방법만 사용
- 기능 구현 시: 모든 플랫폼에서 동일하게 작동하는 코드만 작성
- "Web에서만 수정", "Android에서만 적용" 등의 접근 절대 금지
- 기술적 구현은 다를 수 있지만, 사용자 경험은 100% 동일해야 함

### Platform-Specific Implementations

#### Storage
```javascript
// ❌ WRONG - Breaks on web
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('key', 'value');

// ✅ CORRECT - Works everywhere
import { secureStorage } from '@/utils/storage';
await secureStorage.setItem('key', 'value');
```

#### Styling
```javascript
// ❌ WRONG - Platform-specific shadows
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 }

// ✅ CORRECT - Cross-platform shadows
...Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }
  },
  android: {
    elevation: 4
  },
  web: {
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)'
  }
})
```

#### i18n Translation
```javascript
// ❌ WRONG - Platform-specific fallbacks create inconsistent UX
if (Platform.OS === 'android' && !i18n.isInitialized) {
  return '한글 텍스트';  // Only Android gets fallback
}

// ✅ CORRECT - Universal fallbacks for all platforms
if (!i18n.isInitialized) {
  return '한글 텍스트';  // All platforms get same fallback
}
```

#### Native APIs
- **Camera**: Web uses file input, native uses expo-camera
- **Location**: Web uses Geolocation API, native uses expo-location
- **Notifications**: Web uses Web Push API, native uses expo-notifications
- **Storage**: Web uses localStorage/sessionStorage, native uses AsyncStorage/SecureStore

### Cross-Platform Navigation Guidelines

#### Consistent Navigation Experience
All platforms must provide identical navigation behavior:

1. **Tab Navigation**: Same tabs, same order, same functionality
2. **Screen Flow**: Identical navigation patterns across platforms
3. **Loading States**: Same loading behavior and UI
4. **Error Handling**: Consistent error messages and recovery flows

#### Platform-Specific Technical Differences (Allowed)
These technical differences are necessary but should not affect user experience:

```javascript
// ✅ ALLOWED - Technical keyboard behavior differences
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
/>

// ✅ ALLOWED - Platform-specific WebView settings
<WebView
  scalesPageToFit={Platform.OS === 'android'}
/>
```

### Recent Cross-Platform Standardization (2025-08-27)

#### Fixed Issues
1. **Navigation Loading**: Removed Android-specific i18n initialization delays
2. **Date Formatting**: Unified fallback behavior across all platforms
3. **Translation System**: Made `useAndroidSafeTranslation` work identically on all platforms
4. **Input Handling**: Standardized Enter key behavior for message input

#### Files Modified
- `navigation/AppNavigator.tsx`: Removed Android-specific loading conditions
- `utils/dateUtils.ts`: Unified translation fallback logic
- `hooks/useAndroidSafeTranslation.ts`: Made cross-platform compatible
- `App.tsx`: Standardized i18n initialization across platforms
- `components/chat/MessageInput.tsx`: Unified Enter key handling

### Testing Requirements
Before ANY commit:
1. Test on Web (Chrome/Safari/Firefox)
2. Test on iOS Simulator
3. Test on Android Emulator
4. Verify no platform-specific errors in console
5. Ensure identical user flows across platforms

### Common Pitfalls to Avoid
- Using SecureStore directly without web fallback
- Platform-specific styling without fallbacks
- Native-only navigation patterns
- File system operations without web alternatives
- Assuming native capabilities on web
- **Android-specific i18n fallbacks that create UX inconsistencies**
- **Platform-specific navigation loading behavior**
- **Different Enter key handling across platforms**

## 💰 Business Model

### Pricing (Korean Market)
- **Free**: 1 daily like + basic matching
- **Credits**: ₩2,500-19,000 (5-50 likes)
- **Premium Monthly**: ₩9,900 (unlimited + premium features)
- **Premium Yearly**: ₩99,000 (17% discount)

### Premium Features
- 무제한 좋아요, 좋아요 받은 사람 확인, 우선 매칭
- 좋아요 되돌리기, 슈퍼 좋아요, 읽음 표시
- 온라인 상태, 프리미엄 배지

## 🔒 Security & Privacy

**Critical**: Dating app with sensitive personal data and anonymity requirements.

- **Anonymous Until Match**: Strict nickname-only system
- **Data Privacy**: GDPR-compliant, minimal collection
- **Payment Security**: PCI DSS compliance, no card storage
- **Encrypted Storage**: AES-GCM for sensitive data
- **Real-time Security**: WebSocket auth, message encryption

## 🛠️ Development Guidelines

### Code Quality Standards
- **Language**: Always respond in Korean (응답은 한글로한다)
- **TypeScript**: Strict mode, no `any`, explicit types
- **Type Safety**: Each package maintains own type definitions
- **Testing**: 80%+ coverage for business logic
- **Error Handling**: Comprehensive try-catch with user feedback
- **Accessibility**: All interactive elements labeled
- **Independent Architecture**: No cross-package dependencies for types/utils

### Development Workflow
1. **TypeScript strict mode** + ESLint across packages
2. **Testing**: Unit + Integration + E2E (Playwright)
3. **Type Safety**: Each package maintains independent types
4. **Code Review**: Comprehensive testing required
5. **Structured Commits**: Implementation details included
6. **Package Independence**: No shared dependencies, self-contained packages

### Independent Architecture Benefits
- **Autonomous Development**: Each team can work independently
- **Flexible Technology Choices**: Different packages can use different libraries
- **Simplified Builds**: No complex dependency ordering required
- **Easy Deployment**: Each package can be deployed separately
- **Version Control**: Independent versioning per package
- **Reduced Coupling**: Less risk of breaking changes across packages

## 📐 Modularization Guidelines (모듈화 가이드라인)

### Core Principles
**목표**: 모든 파일을 300줄 이하로 유지하여 가독성과 유지보수성 극대화

### 1. File Size Standards
- **Component Files**: Maximum 300 lines
- **Hook Files**: Maximum 200 lines  
- **Utility Files**: Maximum 150 lines
- **Type Definition Files**: No limit (but split by domain)

### 2. Component Structure Pattern
```typescript
// ❌ BAD - Everything in one file (800+ lines)
screens/ProfileScreen.tsx

// ✅ GOOD - Modularized structure
screens/ProfileScreen.tsx (< 300 lines)     // Main screen orchestrator
├── hooks/profile/useProfileData.ts         // Business logic
├── components/profile/PremiumSection.tsx   // Feature component
├── components/profile/ActivityStats.tsx    // Feature component
├── components/profile/LikeSystemStatus.tsx // Feature component
└── types/profile.ts                        // Type definitions
```

### 3. Modularization Checklist
When creating new components:
- [ ] **파일당 300줄 이하 유지** - Keep files under 300 lines
- [ ] **즉시 hook 분리** - Extract hooks immediately when adding business logic
- [ ] **타입 정의 분리** - Separate type definitions into dedicated files
- [ ] **재사용 가능한 컴포넌트 추출** - Extract reusable UI components

### 4. Refactoring Patterns

#### Pattern 1: Custom Hook Extraction
```typescript
// Before: Logic mixed with UI (500+ lines)
const ProfileScreen = () => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState();
  // ... 100 lines of business logic
  return <View>...</View>;
};

// After: Separated concerns
const useProfileData = () => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState();
  // ... business logic
  return { data, loading };
};

const ProfileScreen = () => {
  const { data, loading } = useProfileData();
  return <View>...</View>;
};
```

#### Pattern 2: Component Composition
```typescript
// Before: Monolithic component
const ProfileScreen = () => (
  <View>
    {/* 200 lines of premium section */}
    {/* 150 lines of stats section */}
    {/* 180 lines of settings */}
  </View>
);

// After: Composed components
const ProfileScreen = () => (
  <View>
    <PremiumSection />
    <ActivityStats />
    <SettingsMenu />
  </View>
);
```

### 5. Real-world Examples
Successfully refactored files in this project:

| Original File | Lines | After Refactoring | Reduction |
|--------------|-------|-------------------|-----------|
| likeSlice.ts | 1,163 | 459 | 60.5% |
| NearbyGroupsScreen.tsx | 917 | 414 | 54.9% |
| ProfileScreen.tsx | 879 | 324 | 63.1% |

### 6. Benefits Achieved
- **가독성 향상**: 각 파일이 단일 책임만 담당
- **테스트 용이성**: 독립된 모듈별 유닛 테스트 가능
- **재사용성**: 컴포넌트와 훅을 다른 화면에서 재사용
- **유지보수성**: 변경사항이 격리되어 사이드 이펙트 최소화
- **팀 협업**: 여러 개발자가 충돌 없이 동시 작업 가능

### 7. When to Modularize
Immediate modularization triggers:
- File exceeds 300 lines
- Component has 3+ distinct responsibilities
- Business logic mixed with UI logic
- Duplicate code patterns detected
- Complex state management in component

## 🚨 Safety Rules (CRITICAL - 반드시 준수)

### 🔴 Absolutely Forbidden Commands

#### Database Destructive Operations
```bash
# NEVER USE without explicit user permission
npx prisma db push --force-reset    # Deletes all data
npx prisma migrate reset            # Migration reset (data loss)
DROP DATABASE / DROP TABLE          # Complete deletion
TRUNCATE TABLE / DELETE FROM table  # Data destruction
```

#### Git Dangerous Operations  
```bash
# NEVER USE on shared branches
git push --force / git push -f      # Force push (history destruction)
git reset --hard HEAD~n            # Hard reset (work loss)
git commit --no-verify             # Skip safety hooks
```

#### npm Risky Operations
```bash
# NEVER USE without consideration
npm audit fix --force              # Breaking dependency updates
npm install -g package             # Global pollution
rm -rf node_modules package-lock.json  # Complete dependency removal
```

#### System Dangerous Commands
```bash
# ABSOLUTELY NEVER USE
rm -rf / rm -rf ~ rm -rf *         # System destruction
sudo rm -rf                        # Admin destructive deletion
chmod 777 -R                       # Security risk
```

### 🟡 Requires User Confirmation
- `npx prisma migrate deploy` (production)
- `git rebase -i` (history modification)
- `npm install --legacy-peer-deps` (dependency conflicts)

### ✅ Safe Alternatives
```bash
# Safe Git operations
git stash                          # Temporary save
git checkout -b new-branch         # Create branch

# Safe database operations  
npx prisma migrate dev             # Development migrations
npx prisma studio                  # Database GUI

# Safe package management
npm install                        # Standard install
npm run test                       # Run tests
```

### 🚨 Emergency Response
1. **Data Loss**: Stop immediately, restore from backup
2. **Git Damage**: Recover from other developer's local repo
3. **Dependency Issues**: Restore package-lock.json backup
4. **Build Failure**: Rollback to stable version

### Git Commit Policy
**FORBIDDEN**: Claude Code committing without explicit user request

**Allowed Only When User Says**:
- "커밋해줘" / "git commit 해줘" 
- "변경사항 커밋해줘" / "commit please"

**After Completion**: Report completion, don't commit automatically

## 🔧 Common Issues & Solutions

### Development Environment

#### Service Ports
- **Web Landing**: http://localhost:5173 (Vite dev server)
- **Admin Dashboard**: http://localhost:3000 (Next.js)
- **Mobile App**: http://localhost:8081 (Expo dev server)
- **API Server**: http://localhost:3001 (NestJS)

#### Connection Issues
**Problem**: 401 Unauthorized in development  
**Solution**: Ensure `x-dev-auth: true` header in mobile API client

**Test**: `curl -H "x-dev-auth: true" http://localhost:3001/api/v1/groups`

### Common Development Issues

#### React Native (Mobile)
1. **Missing Packages**: Always install before use (`npm install expo-blur`)
2. **Icon Errors**: Use valid names from https://icons.expo.fyi/
3. **i18n Format**: Use `t('namespace:key')` not `t('namespace.key')`
4. **Blank Screen**: Check TypeScript errors, clear Metro cache
5. **Port Conflicts**: `lsof -i :3001` then `kill -9 [PID]`

#### Next.js (Admin Dashboard)
1. **App Router**: Use `src/app/` directory structure for pages
2. **Clerk Auth**: Ensure middleware.ts is properly configured
3. **API Routes**: Place in `src/app/api/` directory
4. **Build Issues**: Check Next.js config for custom server setup
5. **Styling**: Tailwind CSS + Shadcn/UI component conflicts

#### Vite + React (Web Landing)
1. **Import Paths**: Use relative imports, not absolute
2. **Build Optimization**: Tree-shaking with Vite
3. **Asset Handling**: Place static files in `public/`
4. **TypeScript**: Strict mode enabled, check `tsconfig.json`
5. **Hot Reload**: Clear Vite cache if issues occur

### API Integration Requirements
**CRITICAL**: Never use mock data in production code
- Use real database with test data
- Implement proper error handling
- Verify TypeScript interface compliance

## 📱 Korean Market Features

### Service Integrations
- **SMS Auth**: Korean carrier support
- **Payments**: TossPay, KakaoPay gateways  
- **Maps**: Kakao Maps API
- **OCR**: Naver/Google Vision for verification
- **Company**: Email domain + document verification

### Target Metrics
- **ARPU**: ₩15,000-25,000
- **Conversion**: 5-8% free-to-premium  
- **Retention**: Anonymous matching + premium value

## 🎯 Next Development Priorities

### Phase 4 Options
1. **Production Deployment**: DevOps, monitoring, CI/CD
2. **Analytics & BI**: User behavior tracking
3. **AI Matching**: ML-powered compatibility
4. **Rich Media**: Video calls, voice messages

### Technical Debt
- Error monitoring & alerting
- Performance monitoring  
- Advanced security auditing
- Automated testing improvements

## 📚 Analysis Tools

### Gemini CLI for Monorepo Analysis
```bash
# Complete architecture analysis
gemini -p "@web/ @admin/ @mobile/ @server/ Analyze complete independent monorepo architecture"

# Type consistency check (independent packages)
gemini -p "@web/src/types/ @admin/src/types/ @mobile/types/ @server/src/types/ Check TypeScript type patterns across packages"

# Security audit
gemini -p "@server/src/ @admin/src/ @mobile/services/ Security audit across all applications"

# UI/UX consistency check
gemini -p "@web/src/components/ @admin/src/components/ @mobile/components/ Check UI component consistency"
```

Use Gemini CLI for:
- Independent package architecture analysis
- Type pattern consistency across packages
- Security audits across the stack
- Component architecture validation
- API contract verification

## 🔍 Pre-Work Checklist

Before any major operation:
- [ ] Important data backed up
- [ ] Current branch and changes verified  
- [ ] Command options and paths double-checked
- [ ] Team impact assessed and communicated
- [ ] Test environment validation completed

## 🐛 Common TypeScript & React Native Issues & Solutions

### 1. Network Connection Errors in React Native

**Problem**: `ERROR API request failed: [TypeError: Network request failed]`

**Root Cause**: React Native native apps cannot connect to `localhost` directly. Simulators/devices must communicate through actual network interfaces.

**Solution**:
```javascript
// ❌ Wrong - breaks on native
return 'http://localhost:3001/api/v1';

// ✅ Correct - platform-aware
const getBaseURL = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001/api/v1';
  }
  // Native uses actual IP address
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.25.45:3001/api/v1';
};
```

**Prevention**: 
- Always use `Platform.OS` checks for network configuration
- Set `EXPO_PUBLIC_API_BASE_URL` in `.env` files
- Use IP-based URLs for native development

### 2. Timer Type Errors

**Problem**: `Type 'number' is not assignable to type 'Timeout'`

**Root Cause**: React Native vs Browser environment timer type conflicts

**Solution**:
```typescript
// ❌ Environment-specific type
const timer = useRef<NodeJS.Timeout | null>(null);

// ✅ Cross-platform compatible
const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
const interval = useRef<ReturnType<typeof setInterval> | null>(null);
```

**Prevention**: Always use `ReturnType<typeof setTimeout/setInterval>`

### 3. i18n Translation Function Type Errors

**Problem**: `Type 'string | $SpecialObject | TFunctionDetailedResult' is not assignable to parameter of type 'string'`

**Root Cause**: i18next `t()` function returns complex types, but React Native components expect simple strings

**Solution**:
```typescript
// ❌ Explicit TFunction type causes issues
const t: TFunction = (key: string, options?: any) => { ... };

// ✅ Remove explicit typing
const t = (key: string, options?: any) => { ... };

// ✅ Alternative: Type casting when needed
title={t('common:save') as string}
title={String(t('common:save'))}
```

**Prevention**: 
- Remove explicit `TFunction` types in custom hooks
- Use type casting or `String()` conversion when needed
- Keep TypeScript settings flexible for i18n compatibility

### 4. Zustand Store Type Definition Issues

**Problem**: `Property 'nearbyGroups' does not exist on type 'GroupStore'` / `Property 'isActive' is missing in type`

**Root Cause**: Interface definitions don't match actual implementations or sample data

**Solution**:
```typescript
// ✅ Ensure interface completeness
interface GroupState {
  groups: Group[];
  joinedGroups: Group[];
  nearbyGroups: Group[];     // Add missing properties
  officialGroups: Group[];
  createdGroups: Group[];
}

// ✅ Sync initial state
const initialState = {
  groups: sampleGroups,
  joinedGroups: sampleGroups,
  nearbyGroups: [],          // Add missing arrays
  officialGroups: [],
  createdGroups: [],
}

// ✅ Complete sample data
const sampleGroups: Group[] = [
  {
    id: 'group-1',
    name: '서강대학교',
    // ... existing properties
    isActive: true,           // Add missing required fields
  }
];
```

**Prevention**:
- Keep interface ↔ initial state ↔ sample data in sync
- Update all three when extending store functionality
- Use TypeScript strict checks for completeness

### 5. Navigation Type Definition Errors

**Problem**: `Type '"NearbyGroups"' is not assignable to type 'keyof HomeStackParamList'`

**Root Cause**: Navigator screens added but not reflected in type definitions

**Solution**:
```typescript
// ✅ Include all used screens in type definitions
export type HomeStackParamList = {
  HomeScreen: undefined;
  CreateContent: undefined;
  PostDetail: { postId: string };
  NearbyGroups: undefined;    // Add new screens
};
```

**Prevention**: 
- Update stack param lists immediately when adding screens
- Define types first, then implement navigator
- Code review navigation type consistency

### 6. Missing Module/Component Errors

**Problem**: `Cannot find module '@/components/call/CallButton'`

**Root Cause**: Importing modules that don't actually exist

**Solution**:
```typescript
// ✅ Create basic implementation
export const CallButton: React.FC<CallButtonProps> = ({ type, onPress, disabled }) => {
  return (
    <TouchableOpacity 
      style={[styles.button, disabled && styles.disabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{type === 'video' ? '영상통화' : '음성통화'}</Text>
    </TouchableOpacity>
  );
};
```

**Prevention**:
- Verify module existence before importing
- Create placeholder implementations for planned components
- Keep development plan synchronized with actual implementation

### 7. StyleSheet Type Errors

**Problem**: `Property 'pausedIndicator' does not exist on type 'Styles'`

**Root Cause**: StyleSheet interface missing actual styles used in components

**Solution**:
```typescript
// ✅ Define all used styles in interface
interface Styles {
  container: ViewStyle;
  storyImage: ImageStyle;
  // ... existing styles
  pausedIndicator: ViewStyle;    // Add missing styles
  bottomInfo: ViewStyle;
  storyCounter: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  // ... implement all defined styles
});
```

**Prevention**: 
- Update style interfaces when adding new styles
- Use appropriate ViewStyle/TextStyle/ImageStyle types
- Leverage `StyleSheet.create<Interface>` generic typing

### Development Checklist

**🔧 Network Configuration**
- [ ] Use Platform.OS for web/native distinction
- [ ] Native environments use actual IP addresses
- [ ] Environment variables configured (.env)

**📝 Type Definitions**
- [ ] Timers: Use `ReturnType<typeof setTimeout>`
- [ ] i18n: Remove explicit TFunction types in custom hooks
- [ ] Stores: Keep interface ↔ initial state ↔ sample data synced
- [ ] Navigation: Define all screen types

**🎨 Component Development**
- [ ] StyleSheet interfaces match actual styles
- [ ] All imported modules exist
- [ ] Missing components have basic implementations
- [ ] Props types fully defined

**⚙️ Recommended TypeScript Settings**
```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "strictFunctionTypes": false,
    "skipLibCheck": true,
    "moduleResolution": "bundler"
  }
}
```

**React Native + Expo development benefits from flexible TypeScript settings that prioritize development velocity while maintaining essential type safety.**

## 📐 Modularization Guidelines

### Screen Component Architecture

**Goal**: Keep screen files under 400 lines by extracting logic and UI into reusable modules.

#### 1. Screen Structure Pattern

```typescript
// screens/ExampleScreen.tsx (Target: < 400 lines)
export const ExampleScreen = () => {
  // 1. Store hooks
  const authStore = useAuthStore();
  
  // 2. Custom hooks for data & logic
  const { data, handlers } = useExampleData();
  const { actions } = useExampleActions();
  
  // 3. Simple rendering logic
  return (
    <SafeAreaView>
      <ExampleHeader />
      <ExampleContent data={data} />
      <ExampleFooter />
    </SafeAreaView>
  );
};
```

#### 2. Hook Extraction Pattern

**Data Management Hooks** (`hooks/[screen]/use[Screen]Data.ts`):
```typescript
export const useExampleData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const loadData = useCallback(async () => {
    // API calls or complex data fetching
  }, []);
  
  return { data, loading, loadData };
};
```

**Action Handlers** (`hooks/[screen]/use[Screen]Handlers.ts`):
```typescript
export const useExampleHandlers = ({ data, setData }) => {
  const handleAction = useCallback(() => {
    // Business logic here
  }, [data]);
  
  return { handleAction };
};
```

#### 3. Component Extraction Pattern

**List Components** (`components/[feature]/[Feature]List.tsx`):
```typescript
interface ExampleListProps {
  items: Item[];
  onItemPress: (id: string) => void;
}

export const ExampleList: React.FC<ExampleListProps> = ({ items, onItemPress }) => {
  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <ExampleItem item={item} onPress={onItemPress} />}
    />
  );
};
```

**Section Components** (`components/[feature]/[Feature]Section.tsx`):
```typescript
export const ExampleSection: React.FC<Props> = ({ title, children }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
};
```

#### 4. Modularization Checklist

Before starting a new screen:
- [ ] Plan the screen structure (< 400 lines target)
- [ ] Identify reusable components
- [ ] Extract data fetching into custom hooks
- [ ] Extract business logic into handler hooks
- [ ] Create section components for complex UI parts

When refactoring existing screens:
- [ ] Identify logical sections (data, UI, actions)
- [ ] Extract hooks first (easier to test)
- [ ] Then extract UI components
- [ ] Keep props minimal and focused
- [ ] Ensure TypeScript types are properly defined

#### 5. File Organization

```
mobile/
├── screens/
│   └── ExampleScreen.tsx (< 400 lines)
├── hooks/
│   └── example/
│       ├── useExampleData.ts
│       ├── useExampleHandlers.ts
│       └── useExampleHelpers.ts
├── components/
│   └── example/
│       ├── ExampleHeader.tsx
│       ├── ExampleContent.tsx
│       ├── ExampleFooter.tsx
│       └── ExampleItem.tsx
└── services/
    └── exampleService.ts
```

#### 6. Benefits of This Architecture

- **Maintainability**: Smaller files are easier to understand
- **Reusability**: Components and hooks can be shared
- **Testability**: Isolated logic is easier to test
- **Performance**: Better code splitting and lazy loading
- **Team Collaboration**: Less merge conflicts
- **Type Safety**: Clear interfaces between modules

#### 7. Real Examples from This Codebase

**Before** (948 lines):
```typescript
// HomeScreen.tsx - Monolithic file with everything
```

**After** (267 lines):
```typescript
// HomeScreen.tsx - Clean orchestrator
// hooks/home/useContentData.ts - Data management
// hooks/home/useLikeHandlers.ts - Business logic
// hooks/home/useStoryData.ts - Story management
// components/home/HomeHeader.tsx - UI component
// components/home/HomeFooter.tsx - UI component
// components/home/HomeEmptyState.tsx - UI component
```

**Results**:
- HomeScreen: 948 → 267 lines (72% reduction)
- GroupsScreen: 978 → 163 lines (83% reduction)
- InterestSearchScreen: 1,155 → 347 lines (70% reduction)
- NearbyUsersScreen: 1,172 → 325 lines (72% reduction)

#### 8. When to Modularize

- **Immediate**: When file exceeds 400 lines
- **Proactive**: When adding new features
- **Refactor**: During bug fixes or updates
- **Always**: For new screens from the start

## 🎨 NativeWind v4 전환 가이드 (CRITICAL)

### 핵심 개념 이해

**NativeWind v4**는 Tailwind CSS 클래스를 React Native에서 사용 가능하게 하는 도구입니다.
- **Atomic CSS**: 컴파일 타임에 최적화된 재사용 가능한 스타일 클래스
- **NOT 인라인 스타일**: className은 컴파일되어 StyleSheet 객체로 변환됨
- **Zero Runtime Cost**: 모든 스타일이 컴파일 타임에 생성됨

### ⚠️ 전환 시 주의사항 (실수 방지)

#### 1. Dark Mode 처리 - 가장 중요!
```typescript
// ❌ 잘못된 방식 - 수동 다크모드 체크
className={cn(
  "mx-4 my-2 p-4",
  isDarkMode ? "bg-gray-800" : "bg-white"  // 이렇게 하지 마세요!
)}

// ✅ 올바른 방식 - dark: prefix 사용
className="mx-4 my-2 p-4 bg-white dark:bg-gray-800"
```

**이유**: NativeWind v4는 이미 `dark:` prefix를 완벽 지원합니다. 수동 체크는 불필요하고 비효율적입니다.

#### 2. 플랫폼별 스타일
```typescript
// ✅ Platform.select와 cn() 조합 사용
className={cn(
  "base-styles",
  Platform.select({
    ios: "shadow-sm",
    android: "elevation-2", 
    web: "shadow-md"
  })
)}
```

#### 3. 조건부 스타일링
```typescript
// ✅ cn()으로 조건부 클래스 적용
<Text className={cn(
  "text-sm",
  isActive ? "text-primary-500" : "text-gray-600 dark:text-gray-400"
)}>
```

#### 4. Icon 색상 처리
```typescript
// ❌ 잘못된 방식
color={isDarkMode ? "#9CA3AF" : "#6B7280"}

// ✅ 올바른 방식 - 테마 색상 사용
color={colors.TEXT.SECONDARY}
```

### 전환 체크리스트

- [ ] **StyleSheet.create() 완전 제거**
- [ ] **모든 isDarkMode 조건문을 dark: prefix로 교체**
- [ ] **-NW.tsx 접미사로 병렬 운영**
- [ ] **cn() 유틸리티 반드시 사용**
- [ ] **Icon 색상은 colors 객체 사용**

### 성능 비교

| 측면 | StyleSheet | NativeWind v4 |
|------|-----------|---------------|
| **코드량** | 100% | 40-60% |
| **다크모드** | 수동 조건문 | dark: 자동 |
| **번들 크기** | 큼 | 30% 감소 |
| **메모리** | 중복 생성 | 재사용 |
| **개발 속도** | 느림 | 빠름 |

### 실제 전환 예시

```typescript
// Before: 413줄 (StyleSheet + 수동 다크모드)
const styles = StyleSheet.create({...150줄});
style={[styles.item, { backgroundColor: isDarkMode ? '#000' : '#FFF' }]}

// After: 295줄 (NativeWind + 자동 다크모드)
className="p-4 bg-white dark:bg-black"
```

### 자주하는 실수

1. **isDarkMode 수동 체크**: dark: prefix가 있는데도 조건문 사용
2. **StyleSheet 일부 남김**: 완전 제거해야 함
3. **cn() 미사용**: 클래스 충돌 방지 필수
4. **인라인 스타일 오해**: Atomic CSS는 컴파일 최적화됨

---

> 💡 **Remember**: This is a privacy-focused Korean dating app with complete full-stack implementation.  
> Always prioritize user anonymity, payment security, Korean UX, and type safety across the entire stack.

*Last updated: 2025-01-14*
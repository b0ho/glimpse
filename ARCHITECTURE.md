# ARCHITECTURE.md

> 🏗️ **Glimpse Architecture**  
> 📦 Independent monorepo structure and patterns

## 🏛️ Monorepo Structure

```
glimpse/
├── web/                    # Landing page (Vite + React)
├── admin/                  # Admin dashboard (Next.js 15)
├── mobile/                 # Mobile app (React Native + Expo)
├── server/                 # API server (Node.js + NestJS)
├── tests/                  # E2E tests (Playwright)
├── scripts/                # Build and deployment scripts
└── package.json            # Root orchestration
```

### Package Details

#### 📱 Mobile (`/mobile`)
- **Framework**: React Native 0.74 + Expo SDK 51
- **State**: Zustand stores
- **Navigation**: React Navigation v6
- **Styling**: NativeWind v4 (Tailwind CSS)
- **i18n**: react-i18next (ko, en, ja, zh)
- **Key Files**:
  - `App.tsx` - Entry point
  - `navigation/` - Navigation structure
  - `screens/` - 40+ screens
  - `components/` - Reusable UI
  - `store/` - State management
  - `services/` - API layer

#### 🌐 Web (`/web`)
- **Framework**: Vite + React 19
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Purpose**: Marketing landing page

#### 👨‍💼 Admin (`/admin`)
- **Framework**: Next.js 15 (App Router)
- **Auth**: Clerk
- **UI**: Shadcn/ui components
- **Purpose**: User management, analytics

#### 🔧 Server (`/server`)
- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.IO
- **Auth**: JWT + Clerk webhook
- **Key Modules**:
  - Users, Groups, Matches
  - Chat, Notifications
  - Payments, Subscriptions

## 📐 Modularization Patterns

### File Size Limits
- **Components**: Max 300 lines
- **Hooks**: Max 200 lines
- **Utils**: Max 150 lines
- **Screens**: Max 400 lines

### Screen Architecture Pattern

```typescript
// screens/ExampleScreen.tsx (< 400 lines)
export const ExampleScreen = () => {
  // 1. Store subscriptions
  const { user } = useAuthStore();
  
  // 2. Custom hooks for logic
  const { data, loading } = useExampleData();
  const { handleSubmit } = useExampleHandlers();
  
  // 3. Clean JSX
  return (
    <SafeAreaView>
      <Header />
      <Content data={data} />
      <Footer onSubmit={handleSubmit} />
    </SafeAreaView>
  );
};
```

### Folder Organization

```
screens/
  ExampleScreen.tsx          # Orchestrator only

hooks/example/
  useExampleData.ts         # Data fetching
  useExampleHandlers.ts     # Event handlers
  useExampleHelpers.ts      # Utilities

components/example/
  ExampleHeader.tsx         # UI sections
  ExampleContent.tsx
  ExampleFooter.tsx
```

### Real Refactoring Results

| Screen | Before | After | Reduction |
|--------|--------|-------|-----------|
| HomeScreen | 948 lines | 267 lines | 72% |
| GroupsScreen | 978 lines | 163 lines | 83% |
| InterestSearchScreen | 1,155 lines | 347 lines | 70% |
| NearbyUsersScreen | 1,172 lines | 325 lines | 72% |
| ProfileScreen | 879 lines | 324 lines | 63% |

## 🔄 Development Workflow

### Local Development Ports
- **Web**: http://localhost:5173
- **Admin**: http://localhost:3000  
- **Mobile**: http://localhost:8081
- **Server**: http://localhost:3001

### Database Setup
```bash
# PostgreSQL required
cd server
npx prisma migrate dev    # Run migrations
npx prisma studio         # Open GUI at :5555
```

### Environment Variables
```bash
# Mobile (.env)
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:3001/api/v1

# Server (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/glimpse
JWT_SECRET=your-secret
CLERK_WEBHOOK_SECRET=whsec_xxx
```

## 🏗️ Architecture Principles

### 1. Independent Packages
- No shared dependencies between packages
- Each package has own `node_modules`
- Separate TypeScript configs
- Independent build processes

### 2. Type Safety
- Each package maintains own types
- No cross-package type imports
- API contracts via OpenAPI/GraphQL schema

### 3. API Design
- RESTful endpoints with `/api/v1` prefix
- WebSocket for real-time features
- Consistent error responses
- Rate limiting and caching

### 4. State Management
- **Mobile**: Zustand for global state
- **Web**: React Context + hooks
- **Admin**: Server state with React Query

### 5. Testing Strategy
- Unit tests per package
- Integration tests for API
- E2E tests with Playwright
- 80% coverage target for business logic

## 🚀 Build & Deployment

### Build Commands
```bash
npm run build           # All packages
npm run build:web       # Landing page
npm run build:admin     # Admin dashboard
npm run build:mobile    # Mobile (Expo)
```

### Deployment Strategy
- **Web/Admin**: Vercel/Netlify
- **Mobile**: EAS Build → App stores
- **Server**: Docker → AWS/GCP
- **Database**: Managed PostgreSQL

### CI/CD Pipeline
1. Pre-commit: ESLint + Prettier
2. PR checks: Tests + TypeScript
3. Main branch: Auto-deploy to staging
4. Tagged release: Production deployment

## 🔒 Security Architecture

### Authentication Flow
1. User registers/logs in via Clerk
2. Clerk webhook creates user in DB
3. JWT issued for API access
4. Socket.IO authenticated via JWT

### Data Protection
- Passwords hashed with bcrypt
- Sensitive data encrypted at rest
- HTTPS only in production
- Rate limiting on all endpoints

### Privacy Features
- Anonymous user IDs until match
- Separate nickname/real name fields
- Soft delete for user data
- GDPR-compliant data export

---

*Last updated: 2025-01-21*
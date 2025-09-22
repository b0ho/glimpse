# TECH_STACK.md

> 🛠️ **Glimpse Technology Stack**  
> 💻 Technical specifications and common solutions

## 📦 Technology Overview

### Frontend Stack

| Package | Technology | Version | Purpose |
|---------|------------|---------|---------|
| **Mobile** | React Native | 0.74 | Cross-platform app |
| | Expo SDK | 51 | Development tools |
| | NativeWind | v4 | Tailwind for RN |
| | Zustand | 4.5 | State management |
| | React Navigation | v6 | Navigation |
| | Socket.IO Client | 4.7 | Real-time |
| **Web** | React | 19 | Landing page |
| | Vite | 5.0 | Build tool |
| | Tailwind CSS | 3.4 | Styling |
| | Framer Motion | 11 | Animations |
| **Admin** | Next.js | 15 | Dashboard |
| | Clerk | 5.0 | Authentication |
| | Shadcn/ui | Latest | UI components |
| | React Query | 5.0 | Server state |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | 10.0 | API framework |
| **PostgreSQL** | 16 | Database |
| **Prisma** | 5.0 | ORM |
| **Socket.IO** | 4.7 | WebSockets |
| **Redis** | 7.2 | Caching/sessions |
| **JWT** | - | Token auth |
| **Clerk Webhook** | - | User sync |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **AWS S3** | File storage |
| **Firebase FCM** | Push notifications |
| **Docker** | Containerization |
| **GitHub Actions** | CI/CD |
| **Vercel/Netlify** | Static hosting |
| **EAS Build** | Mobile builds |

## 🌍 Cross-Platform Development

### Platform Support Matrix

| Feature | Web | iOS | Android |
|---------|-----|-----|---------|
| Core Features | ✅ | ✅ | ✅ |
| Push Notifications | ✅ Web Push | ✅ APNS | ✅ FCM |
| Camera | ✅ File Input | ✅ expo-camera | ✅ expo-camera |
| Location | ✅ Geolocation API | ✅ expo-location | ✅ expo-location |
| Storage | ✅ localStorage | ✅ AsyncStorage | ✅ AsyncStorage |
| Secure Storage | ✅ sessionStorage | ✅ SecureStore | ✅ SecureStore |

### Platform-Aware Code Pattern

```typescript
// Correct platform detection
import { Platform } from 'react-native';

// API URL configuration
const getBaseURL = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001/api/v1';
  }
  // Mobile needs actual IP
  return process.env.EXPO_PUBLIC_API_BASE_URL || 
         'http://192.168.1.100:3001/api/v1';
};

// Cross-platform shadows
const shadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  android: {
    elevation: 4,
  },
  web: {
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
});
```

## 🎨 NativeWind v4 Migration

### Key Changes from v3
1. **className instead of style**
2. **dark: prefix for dark mode**
3. **No manual isDarkMode checks**
4. **cn() utility for conditional classes**

### Migration Examples

```typescript
// ❌ OLD (StyleSheet + manual dark mode)
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
  },
});
<View style={styles.container} />

// ✅ NEW (NativeWind v4)
<View className="p-4 bg-white dark:bg-gray-900" />

// Conditional styling
<Text className={cn(
  "text-base font-medium",
  isActive ? "text-blue-500" : "text-gray-600 dark:text-gray-400"
)} />
```

### Performance Impact
- **Bundle size**: 30% smaller
- **Runtime**: Zero overhead (compile-time)
- **Development**: 50% faster styling

## 🐛 Common Issues & Solutions

### TypeScript Configuration

```json
// Recommended tsconfig.json for React Native
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["ESNext"],
    "jsx": "react-native",
    "strict": false,
    "noImplicitAny": false,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "types": ["react-native", "jest"]
  }
}
```

### Common React Native Issues

#### 1. Network Request Failed
```typescript
// Problem: localhost doesn't work on mobile
// Solution: Use actual IP address
const API_URL = Platform.select({
  web: 'http://localhost:3001',
  default: 'http://192.168.1.100:3001', // Your IP
});
```

#### 2. Timer Type Errors
```typescript
// Problem: NodeJS.Timeout vs number
// Solution: Use ReturnType
const timer = useRef<ReturnType<typeof setTimeout>>();
```

#### 3. i18n Type Issues
```typescript
// Problem: TFunction type conflicts
// Solution: Remove explicit typing
const t = useTranslation().t; // Let TS infer
```

#### 4. Metro Cache Issues
```bash
# Clear all caches
npx expo start -c
# or
npx react-native start --reset-cache
```

#### 5. iOS Simulator Issues
```bash
# Reset simulator
xcrun simctl erase all
# Reinstall pods
cd ios && pod install
```

## 🔧 Development Tools

### Essential VS Code Extensions
- **ES7+ React/Redux/React-Native**
- **Tailwind CSS IntelliSense**
- **Prisma**
- **Thunder Client** (API testing)
- **React Native Tools**

### Debugging Setup

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Debug Mobile",
      "type": "reactnative",
      "request": "launch",
      "platform": "ios"
    },
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:server"]
    }
  ]
}
```

### Performance Monitoring

```typescript
// React Native performance
import { InteractionManager } from 'react-native';

// Defer heavy operations
InteractionManager.runAfterInteractions(() => {
  // Heavy computation
});

// Monitor renders
if (__DEV__) {
  console.log(`Render: ${componentName}`);
}
```

## 📊 Testing Stack

### Testing Tools
- **Jest**: Unit testing
- **React Native Testing Library**: Component testing
- **Playwright**: E2E testing
- **MSW**: API mocking
- **Detox**: Mobile E2E (planned)

### Testing Patterns

```typescript
// Component test example
describe('LoginScreen', () => {
  it('should show error on invalid credentials', async () => {
    const { getByTestId, findByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByTestId('email-input'), 'invalid');
    fireEvent.press(getByTestId('login-button'));
    
    expect(await findByText('Invalid credentials')).toBeTruthy();
  });
});
```

## 🚀 Performance Optimization

### Mobile Optimization
- **FlatList** for long lists (virtualization)
- **memo** for expensive components
- **useMemo/useCallback** for expensive operations
- **Image caching** with expo-image
- **Lazy loading** screens with React.lazy

### Bundle Size Optimization
- **Tree shaking** with Metro
- **Code splitting** per screen
- **Dynamic imports** for heavy libraries
- **Asset optimization** with sharp

### API Optimization
- **Pagination** for lists
- **Cursor-based pagination** for real-time
- **GraphQL** for selective fetching (planned)
- **CDN** for static assets
- **Redis caching** for frequently accessed data

---

*Last updated: 2025-01-21*
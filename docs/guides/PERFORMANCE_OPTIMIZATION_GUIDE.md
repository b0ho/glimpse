# Glimpse 성능 최적화 가이드

## 🚀 개요

이 가이드는 Glimpse 애플리케이션의 성능을 최적화하는 방법을 다룹니다. 모바일 앱과 서버 모두에서 최상의 성능을 달성하기 위한 실용적인 전략과 기술을 제공합니다.

## 📱 모바일 앱 최적화 (React Native)

### 1. 렌더링 최적화

#### React.memo와 useMemo 활용
```typescript
// ❌ Bad: 모든 렌더링마다 재계산
const ExpensiveComponent = ({ data }) => {
  const processedData = data.map(item => complexCalculation(item));
  return <View>{/* 렌더링 */}</View>;
};

// ✅ Good: 메모이제이션 활용
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(
    () => data.map(item => complexCalculation(item)),
    [data]
  );
  return <View>{/* 렌더링 */}</View>;
});
```

#### FlatList 최적화
```typescript
// 최적화된 FlatList 사용
<FlatList
  data={users}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <UserCard user={item} />}
  
  // 성능 최적화 props
  removeClippedSubviews={true}         // 화면 밖 항목 제거
  maxToRenderPerBatch={10}              // 배치당 렌더링 수
  initialNumToRender={10}               // 초기 렌더링 수
  windowSize={10}                       // 뷰포트 배수
  getItemLayout={(data, index) => ({    // 고정 높이인 경우
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  
  // 스크롤 성능
  scrollEventThrottle={16}              // 60fps
  onEndReachedThreshold={0.5}           // 미리 로드
/>
```

#### 이미지 최적화
```typescript
import FastImage from 'react-native-fast-image';

// ❌ Bad: 기본 Image 컴포넌트
<Image source={{ uri: imageUrl }} style={styles.image} />

// ✅ Good: FastImage 사용
<FastImage
  style={styles.image}
  source={{
    uri: imageUrl,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable,
  }}
  resizeMode={FastImage.resizeMode.cover}
/>

// 이미지 사전 로드
FastImage.preload([
  { uri: 'https://example.com/image1.jpg' },
  { uri: 'https://example.com/image2.jpg' },
]);
```

### 2. 상태 관리 최적화

#### Zustand 스토어 최적화
```typescript
// store/useUserStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

interface UserStore {
  users: User[];
  selectedUserId: string | null;
  isLoading: boolean;
  
  // Actions
  setUsers: (users: User[]) => void;
  selectUser: (userId: string) => void;
}

// 셀렉터를 사용한 구독 최적화
export const useUserStore = create<UserStore>()(
  subscribeWithSelector((set) => ({
    users: [],
    selectedUserId: null,
    isLoading: false,
    
    setUsers: (users) => set({ users }),
    selectUser: (userId) => set({ selectedUserId: userId }),
  }))
);

// 필요한 부분만 구독
export const useSelectedUser = () => {
  const { selectedUserId, users } = useUserStore(
    (state) => ({
      selectedUserId: state.selectedUserId,
      users: state.users,
    }),
    shallow // 얕은 비교로 불필요한 리렌더링 방지
  );
  
  return users.find(user => user.id === selectedUserId);
};
```

#### React Query 캐싱 전략
```typescript
// services/api.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5분
      cacheTime: 10 * 60 * 1000,      // 10분
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
  },
});

// 효율적인 쿼리 사용
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserProfile(userId),
    staleTime: 30 * 60 * 1000,       // 프로필은 30분
    enabled: !!userId,                 // 조건부 실행
    
    // 옵티미스틱 업데이트
    onMutate: async (newData) => {
      await queryClient.cancelQueries(['user', userId]);
      const previousData = queryClient.getQueryData(['user', userId]);
      queryClient.setQueryData(['user', userId], newData);
      return { previousData };
    },
  });
};
```

### 3. 번들 크기 최적화

#### 동적 임포트
```typescript
// ❌ Bad: 모든 스크린 즉시 로드
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import PremiumScreen from './screens/PremiumScreen';

// ✅ Good: 필요할 때 로드
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const PremiumScreen = lazy(() => import('./screens/PremiumScreen'));

// 사용
<Suspense fallback={<LoadingScreen />}>
  <ProfileScreen />
</Suspense>
```

#### 트리 쉐이킹
```typescript
// ❌ Bad: 전체 라이브러리 임포트
import _ from 'lodash';
const result = _.debounce(fn, 300);

// ✅ Good: 필요한 함수만 임포트
import debounce from 'lodash/debounce';
const result = debounce(fn, 300);
```

### 4. 애니메이션 최적화

#### React Native Reanimated 사용
```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const AnimatedCard = ({ onPress }) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePress = () => {
    'worklet';
    scale.value = withSpring(0.95, {}, () => {
      runOnJS(onPress)();
    });
  };
  
  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Pressable onPress={handlePress}>
        {/* 콘텐츠 */}
      </Pressable>
    </Animated.View>
  );
};
```

## 🖥 서버 최적화 (Node.js)

### 1. 데이터베이스 쿼리 최적화

#### Prisma 쿼리 최적화
```typescript
// ❌ Bad: N+1 문제
const users = await prisma.user.findMany();
for (const user of users) {
  const likes = await prisma.like.findMany({
    where: { fromUserId: user.id }
  });
  user.likes = likes;
}

// ✅ Good: Include 사용
const users = await prisma.user.findMany({
  include: {
    sentLikes: true,
    receivedLikes: true,
    matches: true,
  }
});

// 더 나은: 필요한 필드만 선택
const users = await prisma.user.findMany({
  select: {
    id: true,
    nickname: true,
    _count: {
      select: {
        sentLikes: true,
        matches: true,
      }
    }
  }
});
```

#### 인덱스 최적화
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  nickname  String
  createdAt DateTime @default(now())
  
  // 복합 인덱스
  @@index([createdAt, isActive])
  @@index([nickname])
}

model Like {
  id         String   @id @default(cuid())
  fromUserId String
  toUserId   String
  groupId    String
  createdAt  DateTime @default(now())
  
  // 쿼리 패턴에 맞는 인덱스
  @@index([fromUserId, toUserId])
  @@index([toUserId, status])
  @@index([groupId, createdAt])
}
```

#### 쿼리 분석 및 최적화
```sql
-- 슬로우 쿼리 로그 활성화
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- 쿼리 실행 계획 분석
EXPLAIN ANALYZE
SELECT u.*, COUNT(l.id) as like_count
FROM users u
LEFT JOIN likes l ON u.id = l.to_user_id
WHERE u.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id
ORDER BY like_count DESC
LIMIT 10;

-- 인덱스 사용 통계
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

### 2. 캐싱 전략

#### Redis 캐싱 구현
```typescript
// services/cacheService.ts
import Redis from 'ioredis';

class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT!),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }
  
  // 캐시 래퍼
  async cacheWrapper<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // 캐시 확인
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 캐시 미스: 데이터 가져오기
    const data = await fn();
    
    // 캐시 저장
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }
  
  // 패턴별 캐시 무효화
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// 사용 예시
export const getUserStats = async (userId: string) => {
  return cacheService.cacheWrapper(
    `user:stats:${userId}`,
    async () => {
      // 복잡한 통계 계산
      const stats = await prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT l.to_user_id) as likes_sent,
          COUNT(DISTINCT l2.from_user_id) as likes_received,
          COUNT(DISTINCT m.id) as matches
        FROM users u
        LEFT JOIN likes l ON u.id = l.from_user_id
        LEFT JOIN likes l2 ON u.id = l2.to_user_id
        LEFT JOIN matches m ON u.id IN (m.user1_id, m.user2_id)
        WHERE u.id = ${userId}
      `;
      return stats;
    },
    300 // 5분 캐시
  );
};
```

#### 캐시 전략
```typescript
// 캐시 전략 구현
export enum CacheStrategy {
  // Write-Through: 쓰기 시 캐시도 업데이트
  WRITE_THROUGH = 'write_through',
  // Write-Behind: 비동기로 나중에 업데이트
  WRITE_BEHIND = 'write_behind',
  // Cache-Aside: 필요할 때만 캐시
  CACHE_ASIDE = 'cache_aside',
}

class AdvancedCacheService extends CacheService {
  // Write-Through 구현
  async writeThrough<T>(
    key: string,
    data: T,
    persistFn: (data: T) => Promise<void>
  ): Promise<void> {
    // DB 저장
    await persistFn(data);
    // 캐시 업데이트
    await this.redis.setex(key, 3600, JSON.stringify(data));
  }
  
  // Write-Behind 구현
  private writeQueue: Map<string, any> = new Map();
  
  async writeBehind<T>(key: string, data: T): Promise<void> {
    // 즉시 캐시 업데이트
    await this.redis.setex(key, 3600, JSON.stringify(data));
    // 큐에 추가
    this.writeQueue.set(key, data);
  }
  
  // 주기적으로 큐 처리
  async processWriteQueue(): Promise<void> {
    for (const [key, data] of this.writeQueue) {
      try {
        await this.persistToDatabase(key, data);
        this.writeQueue.delete(key);
      } catch (error) {
        console.error(`Failed to persist ${key}:`, error);
      }
    }
  }
}
```

### 3. API 응답 최적화

#### 압축 및 스트리밍
```typescript
import compression from 'compression';
import { pipeline } from 'stream';

// 압축 미들웨어
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // 압축 레벨 (1-9)
}));

// 대용량 데이터 스트리밍
export const streamLargeData = async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  const stream = new Readable({
    async read() {
      const batch = await getNextBatch();
      if (batch) {
        this.push(JSON.stringify(batch) + '\n');
      } else {
        this.push(null); // 스트림 종료
      }
    }
  });
  
  pipeline(stream, res, (err) => {
    if (err) {
      console.error('Stream error:', err);
    }
  });
};
```

#### 페이지네이션 최적화
```typescript
// 커서 기반 페이지네이션
export const getCursorPaginatedUsers = async (
  cursor?: string,
  limit: number = 20
) => {
  const users = await prisma.user.findMany({
    take: limit + 1, // 다음 페이지 확인용
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // 커서 자체는 제외
    }),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      nickname: true,
      profileImageUrl: true,
      createdAt: true,
    },
  });
  
  const hasNextPage = users.length > limit;
  const results = hasNextPage ? users.slice(0, -1) : users;
  
  return {
    data: results,
    pageInfo: {
      hasNextPage,
      endCursor: results[results.length - 1]?.id,
    },
  };
};
```

### 4. 동시성 및 비동기 처리

#### Promise 병렬 처리
```typescript
// ❌ Bad: 순차 처리
const user = await getUser(userId);
const likes = await getUserLikes(userId);
const matches = await getUserMatches(userId);

// ✅ Good: 병렬 처리
const [user, likes, matches] = await Promise.all([
  getUser(userId),
  getUserLikes(userId),
  getUserMatches(userId),
]);

// 에러 처리를 위한 Promise.allSettled
const results = await Promise.allSettled([
  getUser(userId),
  getUserLikes(userId),
  getUserMatches(userId),
]);

const userData = results
  .filter(result => result.status === 'fulfilled')
  .map(result => result.value);
```

#### Worker Threads 활용
```typescript
// workers/imageProcessor.js
import { parentPort } from 'worker_threads';
import sharp from 'sharp';

parentPort?.on('message', async ({ imagePath, operations }) => {
  try {
    let image = sharp(imagePath);
    
    for (const op of operations) {
      switch (op.type) {
        case 'resize':
          image = image.resize(op.width, op.height);
          break;
        case 'blur':
          image = image.blur(op.sigma);
          break;
        case 'watermark':
          image = image.composite([{
            input: op.watermarkPath,
            gravity: 'southeast',
          }]);
          break;
      }
    }
    
    const result = await image.toBuffer();
    parentPort?.postMessage({ success: true, data: result });
  } catch (error) {
    parentPort?.postMessage({ success: false, error: error.message });
  }
});

// 메인 스레드에서 사용
import { Worker } from 'worker_threads';

export const processImage = (imagePath: string, operations: any[]) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./workers/imageProcessor.js');
    
    worker.postMessage({ imagePath, operations });
    
    worker.on('message', (result) => {
      if (result.success) {
        resolve(result.data);
      } else {
        reject(new Error(result.error));
      }
      worker.terminate();
    });
    
    worker.on('error', reject);
  });
};
```

## 🔄 WebSocket 최적화

### 연결 관리
```typescript
// WebSocket 연결 풀링
class WebSocketManager {
  private connections: Map<string, SocketConnection> = new Map();
  private heartbeatInterval: NodeJS.Timer;
  
  constructor(private io: Server) {
    // 주기적 헬스체크
    this.heartbeatInterval = setInterval(() => {
      this.checkConnections();
    }, 30000);
  }
  
  // 연결 상태 확인
  private checkConnections() {
    for (const [userId, connection] of this.connections) {
      if (!connection.socket.connected) {
        this.connections.delete(userId);
        continue;
      }
      
      // 핑 전송
      connection.socket.emit('ping');
      connection.lastPing = Date.now();
      
      // 타임아웃 체크
      if (Date.now() - connection.lastActivity > 300000) { // 5분
        connection.socket.disconnect();
        this.connections.delete(userId);
      }
    }
  }
  
  // 메시지 배치 처리
  private messageQueue: Map<string, Message[]> = new Map();
  
  async queueMessage(userId: string, message: Message) {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, []);
    }
    
    this.messageQueue.get(userId)!.push(message);
    
    // 배치 크기 또는 시간 제한
    if (this.messageQueue.get(userId)!.length >= 10) {
      await this.flushMessages(userId);
    }
  }
  
  private async flushMessages(userId: string) {
    const messages = this.messageQueue.get(userId);
    if (!messages || messages.length === 0) return;
    
    const connection = this.connections.get(userId);
    if (connection?.socket.connected) {
      connection.socket.emit('messages', messages);
    }
    
    this.messageQueue.delete(userId);
  }
}
```

## 🎯 성능 측정 및 모니터링

### 성능 메트릭 수집
```typescript
// 커스텀 성능 측정
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  measure(name: string, fn: () => Promise<any>) {
    return async (...args: any[]) => {
      const start = process.hrtime.bigint();
      
      try {
        const result = await fn(...args);
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1e6; // ms
        
        this.recordMetric(name, duration);
        
        return result;
      } catch (error) {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1e6;
        
        this.recordMetric(`${name}_error`, duration);
        throw error;
      }
    };
  }
  
  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // 최대 1000개 유지
    if (values.length > 1000) {
      values.shift();
    }
  }
  
  getStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b) / values.length,
      p50: sorted[Math.floor(values.length * 0.5)],
      p95: sorted[Math.floor(values.length * 0.95)],
      p99: sorted[Math.floor(values.length * 0.99)],
    };
  }
}

// 사용
const monitor = new PerformanceMonitor();

export const getUserProfile = monitor.measure(
  'getUserProfile',
  async (userId: string) => {
    // 실제 로직
  }
);
```

## 📊 성능 체크리스트

### 모바일 앱
- [ ] 초기 로딩 시간 < 3초
- [ ] 화면 전환 < 300ms
- [ ] FPS >= 60 (애니메이션)
- [ ] 메모리 사용량 < 200MB
- [ ] 번들 크기 < 50MB

### 서버
- [ ] API 응답 시간 p95 < 200ms
- [ ] 동시 접속 처리 > 10,000
- [ ] CPU 사용률 < 70%
- [ ] 메모리 사용률 < 80%
- [ ] 에러율 < 0.1%

### 데이터베이스
- [ ] 쿼리 응답 시간 < 100ms
- [ ] 연결 풀 사용률 < 80%
- [ ] 캐시 히트율 > 90%
- [ ] 인덱스 사용률 확인
- [ ] 슬로우 쿼리 제거

## 🔧 성능 도구

### 프로파일링 도구
- **React Native**: Flipper, React DevTools
- **Node.js**: clinic.js, 0x, Chrome DevTools
- **Database**: pgAdmin, EXPLAIN ANALYZE

### 부하 테스트
```bash
# k6를 사용한 부하 테스트
k6 run --vus 100 --duration 30s loadtest.js

# Artillery 사용
artillery quick --count 100 --num 10 https://api.glimpse.kr
```

### 모니터링
- **APM**: DataDog, New Relic, AppDynamics
- **Metrics**: Prometheus + Grafana
- **Logging**: ELK Stack

## 💡 베스트 프랙티스

1. **측정 우선**: 최적화 전 항상 측정
2. **점진적 개선**: 한 번에 하나씩
3. **캐싱 전략**: 적절한 TTL 설정
4. **비동기 처리**: 블로킹 작업 제거
5. **리소스 관리**: 메모리 누수 방지

## 📚 추가 리소스

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)
- [Web Performance](https://web.dev/performance/)

**성능은 기능입니다! 🚀**
# Glimpse 웹 관리자 대시보드 문서

## 📊 개요

Glimpse 웹 관리자 대시보드는 Next.js 기반으로 구축된 관리 도구로, 서비스 운영에 필요한 모든 기능을 제공합니다. 관리자는 사용자 관리, 콘텐츠 모더레이션, 통계 분석, 시스템 모니터링 등을 수행할 수 있습니다.

### 주요 기능
- **사용자 관리**: 회원 정보 조회, 수정, 정지 처리
- **콘텐츠 모더레이션**: 신고 처리, 부적절한 콘텐츠 관리
- **통계 대시보드**: 실시간 서비스 지표 모니터링
- **결제 관리**: 구독 및 결제 내역 관리
- **시스템 설정**: 서비스 설정 및 운영 정책 관리

## 🏗 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

### Authentication
- **Provider**: Clerk (Admin roles)
- **Permissions**: RBAC (Role-Based Access Control)

## 📁 프로젝트 구조

```
web/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 인증 관련 페이지
│   │   ├── login/
│   │   └── logout/
│   ├── (dashboard)/         # 대시보드 레이아웃
│   │   ├── layout.tsx       # 공통 레이아웃
│   │   ├── page.tsx         # 메인 대시보드
│   │   ├── users/           # 사용자 관리
│   │   │   ├── page.tsx     # 사용자 목록
│   │   │   └── [id]/        # 사용자 상세
│   │   ├── reports/         # 신고 관리
│   │   ├── payments/        # 결제 관리
│   │   ├── analytics/       # 통계 분석
│   │   ├── content/         # 콘텐츠 관리
│   │   └── settings/        # 시스템 설정
│   └── api/                 # API 라우트
├── components/              # 재사용 컴포넌트
│   ├── ui/                 # shadcn/ui 컴포넌트
│   ├── charts/             # 차트 컴포넌트
│   ├── tables/             # 테이블 컴포넌트
│   └── forms/              # 폼 컴포넌트
├── lib/                    # 유틸리티
│   ├── api/               # API 클라이언트
│   ├── hooks/             # 커스텀 훅
│   └── utils/             # 헬퍼 함수
└── types/                 # TypeScript 타입

```

## 🔐 인증 및 권한 관리

### 권한 레벨
```typescript
enum AdminRole {
  SUPER_ADMIN = 'super_admin',     // 모든 권한
  ADMIN = 'admin',                 // 일반 관리자
  MODERATOR = 'moderator',         // 콘텐츠 관리자
  SUPPORT = 'support',             // 고객 지원
  VIEWER = 'viewer'                // 읽기 전용
}

// 권한별 접근 가능 기능
const permissions = {
  super_admin: ['*'],
  admin: ['users', 'reports', 'payments', 'analytics', 'content'],
  moderator: ['users:read', 'reports', 'content'],
  support: ['users:read', 'reports:read', 'payments:read'],
  viewer: ['analytics:read', 'users:read']
};
```

### 인증 미들웨어
```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: ['/login'],
  afterAuth(auth, req) {
    // 권한 확인
    if (!auth.userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
    
    const userRole = auth.sessionClaims?.role;
    const requestedPath = req.nextUrl.pathname;
    
    // 권한별 접근 제어
    if (!hasPermission(userRole, requestedPath)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }
});
```

## 📊 주요 기능 상세

### 1. 메인 대시보드

#### 실시간 통계 위젯
```typescript
// app/(dashboard)/page.tsx
export default async function DashboardPage() {
  const stats = await getRealtimeStats();
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="활성 사용자"
        value={stats.activeUsers}
        change={stats.activeUsersChange}
        icon={<Users />}
      />
      <StatsCard
        title="오늘 매칭"
        value={stats.todayMatches}
        change={stats.matchesChange}
        icon={<Heart />}
      />
      <StatsCard
        title="매출"
        value={formatCurrency(stats.revenue)}
        change={stats.revenueChange}
        icon={<DollarSign />}
      />
      <StatsCard
        title="신고 대기"
        value={stats.pendingReports}
        urgent={stats.pendingReports > 10}
        icon={<AlertCircle />}
      />
    </div>
  );
}
```

#### 실시간 차트
```typescript
// components/charts/RealtimeChart.tsx
export function RealtimeChart() {
  const { data, isLoading } = useRealtimeData({
    refreshInterval: 5000 // 5초마다 갱신
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>실시간 활동</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="#8884d8" />
            <Line type="monotone" dataKey="messages" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### 2. 사용자 관리

#### 사용자 목록 테이블
```typescript
// app/(dashboard)/users/page.tsx
export default function UsersPage() {
  const [filters, setFilters] = useState<UserFilters>({
    status: 'all',
    verified: 'all',
    subscription: 'all'
  });
  
  const { data, isLoading } = useUsers(filters);
  
  return (
    <DataTable
      columns={userColumns}
      data={data?.users}
      filters={
        <UserFilters
          value={filters}
          onChange={setFilters}
        />
      }
      actions={
        <Button onClick={() => exportUsers(filters)}>
          <Download className="mr-2 h-4 w-4" />
          내보내기
        </Button>
      }
    />
  );
}

// 테이블 컬럼 정의
const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "nickname",
    header: "닉네임",
    cell: ({ row }) => (
      <Link href={`/users/${row.original.id}`}>
        {row.getValue("nickname")}
      </Link>
    )
  },
  {
    accessorKey: "status",
    header: "상태",
    cell: ({ row }) => (
      <Badge variant={getStatusVariant(row.getValue("status"))}>
        {row.getValue("status")}
      </Badge>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActions user={row.original} />
  }
];
```

#### 사용자 상세 페이지
```typescript
// app/(dashboard)/users/[id]/page.tsx
export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id);
  
  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <UserInfo user={user} />
        </CardContent>
      </Card>
      
      {/* 활동 내역 */}
      <Tabs defaultValue="likes">
        <TabsList>
          <TabsTrigger value="likes">좋아요</TabsTrigger>
          <TabsTrigger value="matches">매칭</TabsTrigger>
          <TabsTrigger value="reports">신고</TabsTrigger>
          <TabsTrigger value="payments">결제</TabsTrigger>
        </TabsList>
        <TabsContent value="likes">
          <UserLikesHistory userId={params.id} />
        </TabsContent>
        {/* ... */}
      </Tabs>
      
      {/* 관리 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>관리 작업</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SuspendUserDialog user={user} />
          <ResetPasswordButton userId={user.id} />
          <DeleteUserDialog user={user} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. 신고 관리

#### 신고 처리 대시보드
```typescript
// app/(dashboard)/reports/page.tsx
export default function ReportsPage() {
  const { data: pendingReports } = useReports({ status: 'pending' });
  
  return (
    <div className="space-y-6">
      {/* 긴급 신고 알림 */}
      {pendingReports?.urgent && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>긴급 신고</AlertTitle>
          <AlertDescription>
            {pendingReports.urgent.length}건의 긴급 신고가 있습니다.
          </AlertDescription>
        </Alert>
      )}
      
      {/* 신고 목록 */}
      <ReportsList />
    </div>
  );
}

// components/reports/ReportCard.tsx
export function ReportCard({ report }: { report: Report }) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleAction = async (action: ReportAction) => {
    setIsProcessing(true);
    try {
      await processReport(report.id, action);
      toast.success('신고가 처리되었습니다.');
    } catch (error) {
      toast.error('처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="text-lg">
            {report.type} 신고
          </CardTitle>
          <Badge variant={getUrgencyVariant(report.urgency)}>
            {report.urgency}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 신고 내용 */}
          <div>
            <p className="text-sm text-muted-foreground">신고 사유</p>
            <p>{report.reason}</p>
          </div>
          
          {/* 증거 자료 */}
          {report.evidence && (
            <div>
              <p className="text-sm text-muted-foreground">증거 자료</p>
              <EvidenceViewer evidence={report.evidence} />
            </div>
          )}
          
          {/* 처리 액션 */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleAction('warn')}
              disabled={isProcessing}
              variant="secondary"
            >
              경고
            </Button>
            <Button
              onClick={() => handleAction('suspend')}
              disabled={isProcessing}
              variant="destructive"
            >
              정지
            </Button>
            <Button
              onClick={() => handleAction('dismiss')}
              disabled={isProcessing}
              variant="ghost"
            >
              기각
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4. 결제 관리

#### 결제 내역 대시보드
```typescript
// app/(dashboard)/payments/page.tsx
export default function PaymentsPage() {
  const { data: stats } = usePaymentStats();
  
  return (
    <div className="space-y-6">
      {/* 수익 통계 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>오늘 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.today || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>이번 달 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.month || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>활성 구독</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeSubscriptions || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 결제 내역 테이블 */}
      <PaymentsTable />
      
      {/* 환불 요청 */}
      <RefundRequests />
    </div>
  );
}
```

### 5. 통계 분석

#### 분석 대시보드
```typescript
// app/(dashboard)/analytics/page.tsx
export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  return (
    <div className="space-y-6">
      {/* 날짜 선택 */}
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
      />
      
      {/* 핵심 지표 */}
      <div className="grid gap-6 md:grid-cols-2">
        <UserGrowthChart dateRange={dateRange} />
        <MatchingRateChart dateRange={dateRange} />
        <RevenueChart dateRange={dateRange} />
        <RetentionChart dateRange={dateRange} />
      </div>
      
      {/* 상세 분석 */}
      <Tabs defaultValue="cohort">
        <TabsList>
          <TabsTrigger value="cohort">코호트 분석</TabsTrigger>
          <TabsTrigger value="funnel">퍼널 분석</TabsTrigger>
          <TabsTrigger value="behavior">행동 분석</TabsTrigger>
        </TabsList>
        <TabsContent value="cohort">
          <CohortAnalysis dateRange={dateRange} />
        </TabsContent>
        {/* ... */}
      </Tabs>
    </div>
  );
}
```

## 🔧 시스템 설정

### 서비스 설정 관리
```typescript
// app/(dashboard)/settings/page.tsx
export default function SettingsPage() {
  const { data: settings, mutate } = useSettings();
  
  const form = useForm<SystemSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings
  });
  
  const onSubmit = async (data: SystemSettings) => {
    try {
      await updateSettings(data);
      toast.success('설정이 저장되었습니다.');
    } catch (error) {
      toast.error('설정 저장에 실패했습니다.');
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* 매칭 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>매칭 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="matching.cooldownPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>좋아요 쿨다운 (일)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="matching.dailyFreeLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>일일 무료 좋아요</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        {/* 보안 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>보안 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="security.maxLoginAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>최대 로그인 시도</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Button type="submit">설정 저장</Button>
      </form>
    </Form>
  );
}
```

## 🚀 배포 및 운영

### 환경 변수
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.glimpse.kr/api/v1
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
ADMIN_EMAILS=admin@glimpse.kr,super@glimpse.kr
```

### 빌드 및 배포
```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start

# Docker 배포
docker build -t glimpse-admin .
docker run -p 3000:3000 glimpse-admin
```

### 모니터링
- **성능 모니터링**: Vercel Analytics
- **에러 추적**: Sentry
- **로그 수집**: LogDNA
- **업타임 모니터링**: UptimeRobot

## 🔒 보안 고려사항

### 접근 제어
- IP 화이트리스트 적용
- 2FA 필수 적용
- 세션 타임아웃 설정
- 감사 로그 기록

### 데이터 보호
- 민감 정보 마스킹
- 읽기 전용 권한 분리
- 데이터 내보내기 제한
- 개인정보 접근 로그

## 📚 사용 가이드

### 관리자 온보딩
1. Clerk 대시보드에서 관리자 계정 생성
2. 적절한 권한 레벨 할당
3. 2FA 설정 필수
4. 관리 도구 사용 교육

### 일반 작업 플로우
1. **사용자 정지**: 사용자 상세 → 관리 작업 → 정지
2. **신고 처리**: 신고 목록 → 상세 확인 → 처리 결정
3. **환불 처리**: 결제 내역 → 환불 요청 → 승인/거절
4. **통계 확인**: 분석 → 원하는 지표 선택 → 기간 설정

## 🆘 문제 해결

### 자주 발생하는 문제
1. **로그인 실패**: Clerk 설정 확인
2. **데이터 로딩 실패**: API 서버 상태 확인
3. **권한 오류**: 사용자 권한 레벨 확인
4. **차트 표시 오류**: 브라우저 캐시 삭제
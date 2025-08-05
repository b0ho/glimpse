'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  UserCheck,
  Heart,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Activity,
  Shield,
  Clock,
} from 'lucide-react';
import SystemMonitor from '@/components/admin/SystemMonitor';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  totalMessages: number;
  revenue: number;
  premiumUsers: number;
  reportedUsers: number;
  onlineUsers: number;
}

interface RecentActivity {
  id: string;
  type: 'registration' | 'match' | 'message' | 'report' | 'payment';
  description: string;
  timestamp: string;
  userId?: string;
  userNickname?: string;
}

interface UserReport {
  id: string;
  reportedUser: string;
  reporterUser: string;
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalMatches: 0,
    totalMessages: 0,
    revenue: 0,
    premiumUsers: 0,
    reportedUsers: 0,
    onlineUsers: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // API 호출
      const response = await fetch('/api/admin/dashboard');
      
      if (response.ok) {
        const data = await response.json();
        
        // 데이터 매핑
        const dashboardStats: DashboardStats = {
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          totalMatches: data.totalMatches || 0,
          totalMessages: data.totalMessages || 0,
          revenue: data.revenue || 0,
          premiumUsers: data.premiumUsers || 0,
          reportedUsers: data.reportedUsers || 0,
          onlineUsers: data.onlineUsers || 0,
        };
        
        setStats(dashboardStats);
        
        // 나머지 데이터는 아직 더미 사용
      } else if (response.status === 401) {
        // 인증 오류 시 로그인 페이지로
        window.location.href = '/admin/login';
        return;
      } else {
        // 에러 발생 시 더미 데이터 사용
        const mockStats: DashboardStats = {
          totalUsers: 15847,
          activeUsers: 8932,
          totalMatches: 3421,
          totalMessages: 28954,
          revenue: 2450000,
          premiumUsers: 1247,
          reportedUsers: 23,
          onlineUsers: 342,
        };
        setStats(mockStats);
      }

      // 최근 활동 (더미 데이터)
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'registration',
          description: '새 사용자가 가입했습니다',
          timestamp: '2분 전',
          userNickname: '커피러버',
        },
        {
          id: '2',
          type: 'match',
          description: '새로운 매치가 생성되었습니다',
          timestamp: '5분 전',
        },
        {
          id: '3',
          type: 'payment',
          description: '프리미엄 구독이 결제되었습니다 (₩9,900)',
          timestamp: '12분 전',
          userNickname: '헬스매니아',
        },
        {
          id: '4',
          type: 'report',
          description: '사용자 신고가 접수되었습니다',
          timestamp: '30분 전',
        },
        {
          id: '5',
          type: 'message',
          description: '1,000번째 메시지가 전송되었습니다',
          timestamp: '1시간 전',
        },
      ];

      // 사용자 신고
      const mockReports: UserReport[] = [
        {
          id: '1',
          reportedUser: '의심스러운유저',
          reporterUser: '신고자123',
          reason: '부적절한 메시지',
          description: '성희롱성 메시지를 계속 보냅니다.',
          status: 'pending',
          timestamp: '30분 전',
        },
        {
          id: '2',
          reportedUser: '가짜프로필',
          reporterUser: '정직한사람',
          reason: '가짜 프로필',
          description: '프로필 사진이 연예인 사진인 것 같습니다.',
          status: 'pending',
          timestamp: '2시간 전',
        },
        {
          id: '3',
          reportedUser: '스팸봇',
          reporterUser: '일반사용자',
          reason: '스팸/광고',
          description: '계속 광고 메시지를 보냅니다.',
          status: 'resolved',
          timestamp: '1일 전',
        },
      ];

      // Already set above
      setRecentActivity(mockActivity);
      setUserReports(mockReports);
    } catch (error) {
      console.error('Dashboard data loading error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      // 실제 구현에서는 API 호출
      console.log(`Report ${reportId} ${action}ed`);
      
      setUserReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, status: action === 'resolve' ? 'resolved' : 'dismissed' }
            : report
        )
      );
    } catch (error) {
      console.error('Report action error:', error);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'registration':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'match':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'report':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getReportStatusBadge = (status: UserReport['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">대기중</Badge>;
      case 'resolved':
        return <Badge variant="default">해결됨</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">기각됨</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">
              관리자 대시보드를 로드하는 중...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">📊 Glimpse 관리자 대시보드</h1>
            <p className="text-muted-foreground mt-2">
              익명 데이팅 앱의 전체 현황을 모니터링하고 관리하세요
            </p>
          </div>
          <Button onClick={loadDashboardData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>

        {/* 주요 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                활성 사용자: {stats.activeUsers.toLocaleString()}명
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 매치</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMatches.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                성공적인 매칭 수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">월 매출</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₩{stats.revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                프리미엄 사용자: {stats.premiumUsers}명
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">온라인 사용자</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onlineUsers}</div>
              <p className="text-xs text-muted-foreground">
                현재 접속 중
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 탭 섹션 */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activity">최근 활동</TabsTrigger>
            <TabsTrigger value="reports">사용자 신고</TabsTrigger>
            <TabsTrigger value="analytics">분석</TabsTrigger>
            <TabsTrigger value="system">시스템</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>실시간 활동 모니터링</CardTitle>
                <CardDescription>
                  최근 사용자 활동과 시스템 이벤트를 실시간으로 추적합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          {activity.userNickname && (
                            <p className="text-xs text-muted-foreground">
                              사용자: {activity.userNickname}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {activity.timestamp}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>사용자 신고 관리</CardTitle>
                <CardDescription>
                  사용자 신고를 검토하고 적절한 조치를 취하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userReports.map((report) => (
                    <div key={report.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-red-500" />
                          <span className="font-medium">신고 #{report.id}</span>
                          {getReportStatusBadge(report.status)}
                        </div>
                        <span className="text-xs text-muted-foreground">{report.timestamp}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">신고 대상:</span>
                          <span className="ml-2 font-medium">{report.reportedUser}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">신고자:</span>
                          <span className="ml-2">{report.reporterUser}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">사유:</span>
                          <span className="ml-2 font-medium">{report.reason}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">설명:</span>
                          <p className="mt-1 text-muted-foreground">{report.description}</p>
                        </div>
                      </div>

                      {report.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleReportAction(report.id, 'resolve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            해결 처리
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReportAction(report.id, 'dismiss')}
                          >
                            기각 처리
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>사용자 증가 추이</CardTitle>
                  <CardDescription>지난 30일간 신규 가입자 현황</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">차트 구현 예정</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Chart.js 또는 Recharts 라이브러리 사용
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>매출 분석</CardTitle>
                  <CardDescription>프리미엄 구독 및 크레딧 판매 현황</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                    <div className="text-center">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">매출 차트 구현 예정</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        월별/일별 매출 추이 분석
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system">
            <SystemMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
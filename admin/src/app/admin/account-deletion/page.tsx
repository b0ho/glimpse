'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle,
  Calendar,
  Users,
  Clock,
  UserX,
  RefreshCw,
  ChevronRight,
  Download
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface AccountDeletionItem {
  id: string;
  userId: string;
  nickname?: string;
  phoneNumber?: string;
  requestedAt: string;
  scheduledDeletionAt: string;
  daysRemaining: number;
  reason?: string;
  status: 'DELETION_REQUESTED' | 'PERMANENTLY_DELETED';
}

interface DeletionStats {
  pendingDeletions: number;
  deletedToday: number;
  deletedThisWeek: number;
  deletedThisMonth: number;
  mostCommonReason: string;
}

export default function AccountDeletionPage() {
  const [deletionRequests, setDeletionRequests] = useState<AccountDeletionItem[]>([]);
  const [deletionStats, setDeletionStats] = useState<DeletionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'urgent' | 'soon'>('all');

  useEffect(() => {
    fetchDeletionData();
    // 5분마다 데이터 새로고침
    const interval = setInterval(fetchDeletionData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDeletionData = async () => {
    try {
      setIsLoading(true);
      // TODO: 실제 API 호출
      const mockRequests: AccountDeletionItem[] = [
        {
          id: '1',
          userId: 'user-1',
          nickname: '김민수',
          phoneNumber: '010-1234-5678',
          requestedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          scheduledDeletionAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 1,
          reason: 'privacy_concern',
          status: 'DELETION_REQUESTED',
        },
        {
          id: '2',
          userId: 'user-2',
          nickname: '이영희',
          phoneNumber: '010-2345-6789',
          requestedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          scheduledDeletionAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 3,
          reason: 'found_partner',
          status: 'DELETION_REQUESTED',
        },
        {
          id: '3',
          userId: 'user-3',
          nickname: '박철수',
          phoneNumber: '010-3456-7890',
          requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          scheduledDeletionAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 5,
          reason: 'not_useful',
          status: 'DELETION_REQUESTED',
        },
      ];

      const mockStats: DeletionStats = {
        pendingDeletions: 15,
        deletedToday: 3,
        deletedThisWeek: 12,
        deletedThisMonth: 45,
        mostCommonReason: '서비스 불만족',
      };

      setDeletionRequests(mockRequests);
      setDeletionStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch deletion data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReasonLabel = (reason?: string) => {
    const reasons = {
      not_useful: '서비스 불만족',
      privacy_concern: '개인정보 우려',
      found_partner: '상대방 만남',
      technical_issues: '기술적 문제',
      other: '기타',
    };
    return reasons[reason as keyof typeof reasons] || '기타';
  };

  const getUrgencyBadge = (daysRemaining: number) => {
    if (daysRemaining <= 1) {
      return <Badge variant="destructive">긴급 (1일 이내)</Badge>;
    } else if (daysRemaining <= 3) {
      return <Badge variant="secondary">곧 삭제 (3일 이내)</Badge>;
    } else {
      return <Badge variant="outline">{daysRemaining}일 남음</Badge>;
    }
  };

  const filteredRequests = deletionRequests.filter(request => {
    switch (selectedFilter) {
      case 'urgent':
        return request.daysRemaining <= 1;
      case 'soon':
        return request.daysRemaining <= 3;
      default:
        return true;
    }
  });

  const handleForceDelete = async (userId: string) => {
    if (confirm('정말로 이 계정을 즉시 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        // TODO: 즉시 삭제 API 호출
        console.log('Force deleting user:', userId);
        await fetchDeletionData(); // 데이터 새로고침
      } catch (error) {
        console.error('Failed to force delete account:', error);
      }
    }
  };

  const handleRestoreAccount = async (userId: string) => {
    if (confirm('이 계정의 삭제 요청을 취소하시겠습니까?')) {
      try {
        // TODO: 복구 API 호출
        console.log('Restoring user:', userId);
        await fetchDeletionData(); // 데이터 새로고침
      } catch (error) {
        console.error('Failed to restore account:', error);
      }
    }
  };

  const exportDeletionReport = () => {
    // TODO: CSV 형태로 삭제 리포트 내보내기
    console.log('Exporting deletion report...');
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">계정 삭제 관리</h1>
            <p className="text-gray-600 mt-2">삭제 대기 중인 계정들을 관리하고 모니터링합니다</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchDeletionData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
            <Button onClick={exportDeletionReport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              리포트 내보내기
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        {deletionStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">삭제 대기</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{deletionStats.pendingDeletions}</div>
                <p className="text-xs text-muted-foreground">현재 대기 중인 계정</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">오늘 삭제</CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{deletionStats.deletedToday}</div>
                <p className="text-xs text-muted-foreground">오늘 삭제된 계정</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">이번 주</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{deletionStats.deletedThisWeek}</div>
                <p className="text-xs text-muted-foreground">이번 주 삭제</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">주요 사유</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-gray-900">{deletionStats.mostCommonReason}</div>
                <p className="text-xs text-muted-foreground">가장 많은 삭제 사유</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 필터 */}
        <div className="flex gap-2">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
          >
            전체
          </Button>
          <Button
            variant={selectedFilter === 'urgent' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('urgent')}
          >
            긴급 (1일 이내)
          </Button>
          <Button
            variant={selectedFilter === 'soon' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('soon')}
          >
            곧 삭제 (3일 이내)
          </Button>
        </div>

        {/* 삭제 요청 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              삭제 대기 계정 ({filteredRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">로딩 중...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                현재 삭제 대기 중인 계정이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-gray-900">
                          {request.nickname || '익명'}
                        </div>
                        {getUrgencyBadge(request.daysRemaining)}
                        <Badge variant="outline">
                          {getReasonLabel(request.reason)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="font-medium">전화번호:</span> {request.phoneNumber}
                        </div>
                        <div>
                          <span className="font-medium">요청일:</span> {formatDate(request.requestedAt)}
                        </div>
                        <div>
                          <span className="font-medium">삭제 예정:</span> {formatDate(request.scheduledDeletionAt)}
                        </div>
                        <div>
                          <span className="font-medium">남은 시간:</span> {request.daysRemaining}일
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreAccount(request.userId)}
                      >
                        복구
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleForceDelete(request.userId)}
                      >
                        즉시 삭제
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 주의사항 */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              중요 안내사항
            </CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700 space-y-2">
            <p>• 계정 삭제는 GDPR 규정에 따라 모든 개인정보를 완전히 제거합니다.</p>
            <p>• 삭제된 계정은 복구할 수 없으며, 결제 기록은 법적 의무에 따라 익명화되어 보관됩니다.</p>
            <p>• 긴급한 경우를 제외하고는 7일 대기 기간을 준수해주세요.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
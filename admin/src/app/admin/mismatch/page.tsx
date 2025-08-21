'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  Search,
  Calendar,
  User,
  Users,
  Clock,
  MessageSquare,
  RefreshCw,
  Filter,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface MismatchData {
  id: string;
  user1: {
    id: string;
    nickname: string;
    phoneNumber: string;
    profileImage?: string;
  };
  user2: {
    id: string;
    nickname: string;
    phoneNumber: string;
    profileImage?: string;
  };
  group: {
    id: string;
    name: string;
    type: string;
  };
  mismatchedBy: string;
  mismatchedAt: string;
  mismatchReason?: string;
  originalMatchedAt: string;
  messageCount: number;
}

export default function MismatchMonitoringPage() {
  const [mismatches, setMismatches] = useState<MismatchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, today, week, month
  const [stats, setStats] = useState({
    total: 0,
    todayCount: 0,
    weekCount: 0,
    averageMessageCount: 0,
  });

  const fetchMismatchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/mismatch', {
        headers: {
          'x-dev-auth': 'true',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMismatches(data.mismatches || []);
        setStats(data.stats || {
          total: 0,
          todayCount: 0,
          weekCount: 0,
          averageMessageCount: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch mismatch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMismatchData();
    // 5분마다 자동 새로고침
    const interval = setInterval(fetchMismatchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredMismatches = mismatches.filter(mismatch => {
    // 검색어 필터
    const searchMatch = 
      mismatch.user1.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mismatch.user2.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mismatch.group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mismatch.mismatchReason && mismatch.mismatchReason.toLowerCase().includes(searchTerm.toLowerCase()));

    // 기간 필터
    const mismatchDate = new Date(mismatch.mismatchedAt);
    const now = new Date();
    let periodMatch = true;

    if (filterPeriod === 'today') {
      periodMatch = mismatchDate.toDateString() === now.toDateString();
    } else if (filterPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      periodMatch = mismatchDate >= weekAgo;
    } else if (filterPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      periodMatch = mismatchDate >= monthAgo;
    }

    return searchMatch && periodMatch;
  });

  const getReporterNickname = (mismatch: MismatchData) => {
    if (mismatch.mismatchedBy === mismatch.user1.id) {
      return mismatch.user1.nickname;
    } else if (mismatch.mismatchedBy === mismatch.user2.id) {
      return mismatch.user2.nickname;
    }
    return '알 수 없음';
  };

  const getOtherUserNickname = (mismatch: MismatchData) => {
    if (mismatch.mismatchedBy === mismatch.user1.id) {
      return mismatch.user2.nickname;
    } else if (mismatch.mismatchedBy === mismatch.user2.id) {
      return mismatch.user1.nickname;
    }
    return '알 수 없음';
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">미스매치 모니터링</h1>
            <p className="text-muted-foreground mt-1">
              잘못된 매칭으로 신고된 케이스를 모니터링합니다
            </p>
          </div>
          <Button
            onClick={fetchMismatchData}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                전체 미스매치
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                총 신고 건수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                오늘 신고
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCount}</div>
              <p className="text-xs text-muted-foreground">
                24시간 이내
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                주간 신고
              </CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weekCount}</div>
              <p className="text-xs text-muted-foreground">
                최근 7일
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                평균 메시지
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageMessageCount.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                신고 전 주고받은 메시지
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 필터 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle>필터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="닉네임, 그룹명, 사유로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterPeriod === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterPeriod('all')}
                  size="sm"
                >
                  전체
                </Button>
                <Button
                  variant={filterPeriod === 'today' ? 'default' : 'outline'}
                  onClick={() => setFilterPeriod('today')}
                  size="sm"
                >
                  오늘
                </Button>
                <Button
                  variant={filterPeriod === 'week' ? 'default' : 'outline'}
                  onClick={() => setFilterPeriod('week')}
                  size="sm"
                >
                  주간
                </Button>
                <Button
                  variant={filterPeriod === 'month' ? 'default' : 'outline'}
                  onClick={() => setFilterPeriod('month')}
                  size="sm"
                >
                  월간
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 미스매치 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>미스매치 목록</CardTitle>
            <CardDescription>
              {filteredMismatches.length}건의 미스매치가 발견되었습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">데이터 로딩 중...</p>
                </div>
              ) : filteredMismatches.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">미스매치 신고가 없습니다</p>
                </div>
              ) : (
                filteredMismatches.map((mismatch) => (
                  <div
                    key={mismatch.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            미스매치
                          </Badge>
                          <Badge variant="outline">
                            {mismatch.group.name}
                          </Badge>
                          <Badge variant="secondary">
                            메시지 {mismatch.messageCount}개
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">신고자:</span>
                            <span>{getReporterNickname(mismatch)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">상대방:</span>
                            <span>{getOtherUserNickname(mismatch)}</span>
                          </div>
                        </div>

                        {mismatch.mismatchReason && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">사유:</span> {mismatch.mismatchReason}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">매칭일:</span>{' '}
                            {format(new Date(mismatch.originalMatchedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                          </div>
                          <div>
                            <span className="font-medium">신고일:</span>{' '}
                            {format(new Date(mismatch.mismatchedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          상세보기
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
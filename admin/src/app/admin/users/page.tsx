'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Crown,
  AlertCircle,
  Ban,
  CheckCircle,
  Edit,
  Trash2
} from 'lucide-react';

interface User {
  id: string;
  nickname: string;
  email: string;
  phone: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  location: string;
  isPremium: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  joinedAt: string;
  lastActive: string;
  totalMatches: number;
  reportCount: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED';
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PREMIUM' | 'BLOCKED' | 'REPORTED'>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // API 호출 (실제 구현에서는 서버 API 호출)
      const response = await fetch('/api/admin/users');
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        // 더미 데이터 사용
        const mockUsers: User[] = [
          {
            id: '1',
            nickname: '커피러버',
            email: 'coffee@example.com',
            phone: '010-1234-5678',
            age: 28,
            gender: 'FEMALE',
            location: '서울시 강남구',
            isPremium: true,
            isVerified: true,
            isBlocked: false,
            joinedAt: '2024-01-15T09:30:00Z',
            lastActive: '2024-08-12T08:00:00Z',
            totalMatches: 15,
            reportCount: 0,
            status: 'ACTIVE'
          },
          {
            id: '2',
            nickname: '헬스매니아',
            email: 'fitness@example.com',
            phone: '010-2345-6789',
            age: 32,
            gender: 'MALE',
            location: '서울시 서초구',
            isPremium: false,
            isVerified: true,
            isBlocked: false,
            joinedAt: '2024-02-20T14:15:00Z',
            lastActive: '2024-08-11T22:30:00Z',
            totalMatches: 8,
            reportCount: 0,
            status: 'ACTIVE'
          },
          {
            id: '3',
            nickname: '의심스러운유저',
            email: 'suspicious@example.com',
            phone: '010-3456-7890',
            age: 25,
            gender: 'MALE',
            location: '서울시 마포구',
            isPremium: false,
            isVerified: false,
            isBlocked: true,
            joinedAt: '2024-07-30T11:00:00Z',
            lastActive: '2024-08-10T15:20:00Z',
            totalMatches: 3,
            reportCount: 5,
            status: 'SUSPENDED'
          },
          {
            id: '4',
            nickname: '독서클럽',
            email: 'bookclub@example.com',
            phone: '010-4567-8901',
            age: 29,
            gender: 'FEMALE',
            location: '부산시 해운대구',
            isPremium: true,
            isVerified: true,
            isBlocked: false,
            joinedAt: '2024-03-10T16:45:00Z',
            lastActive: '2024-08-12T07:15:00Z',
            totalMatches: 22,
            reportCount: 0,
            status: 'ACTIVE'
          },
          {
            id: '5',
            nickname: '가짜프로필',
            email: 'fake@example.com',
            phone: '010-5678-9012',
            age: 24,
            gender: 'FEMALE',
            location: '인천시 남동구',
            isPremium: false,
            isVerified: false,
            isBlocked: true,
            joinedAt: '2024-08-01T10:30:00Z',
            lastActive: '2024-08-05T19:45:00Z',
            totalMatches: 1,
            reportCount: 3,
            status: 'BANNED'
          }
        ];
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'ALL' ||
                         (selectedFilter === 'PREMIUM' && user.isPremium) ||
                         (selectedFilter === 'BLOCKED' && user.isBlocked) ||
                         (selectedFilter === 'REPORTED' && user.reportCount > 0);
    
    return matchesSearch && matchesFilter;
  });

  const handleUserAction = async (userId: string, action: 'block' | 'unblock' | 'suspend' | 'delete') => {
    try {
      // API 호출 구현
      console.log(`User ${userId} ${action}ed`);
      
      setUsers(prev => prev.map(user => {
        if (user.id === userId) {
          switch (action) {
            case 'block':
              return { ...user, isBlocked: true, status: 'SUSPENDED' as const };
            case 'unblock':
              return { ...user, isBlocked: false, status: 'ACTIVE' as const };
            case 'suspend':
              return { ...user, status: 'SUSPENDED' as const };
            case 'delete':
              return { ...user, status: 'BANNED' as const };
            default:
              return user;
          }
        }
        return user;
      }));
      
      setIsUserDialogOpen(false);
    } catch (error) {
      console.error('User action failed:', error);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.isBlocked) {
      return <Badge variant="destructive">차단됨</Badge>;
    }
    if (user.status === 'SUSPENDED') {
      return <Badge variant="secondary">정지됨</Badge>;
    }
    if (user.status === 'BANNED') {
      return <Badge variant="destructive">영구차단</Badge>;
    }
    return <Badge variant="default">활성</Badge>;
  };

  const getPremiumBadge = (isPremium: boolean) => {
    return isPremium ? (
      <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600">
        <Crown className="h-3 w-3 mr-1" />
        프리미엄
      </Badge>
    ) : (
      <Badge variant="outline">무료</Badge>
    );
  };

  const UserDetailDialog = () => {
    if (!selectedUser) return null;

    return (
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              사용자 상세 정보
            </DialogTitle>
            <DialogDescription>
              {selectedUser.nickname}님의 계정 정보와 활동 내역입니다
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>닉네임</Label>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedUser.nickname}</span>
                  {selectedUser.isVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
              </div>
              <div className="space-y-2">
                <Label>상태</Label>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedUser)}
                  {getPremiumBadge(selectedUser.isPremium)}
                </div>
              </div>
              <div className="space-y-2">
                <Label>이메일</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedUser.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>전화번호</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedUser.phone}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>나이/성별</Label>
                <span className="text-sm">{selectedUser.age}세, {selectedUser.gender === 'MALE' ? '남성' : '여성'}</span>
              </div>
              <div className="space-y-2">
                <Label>지역</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedUser.location}</span>
                </div>
              </div>
            </div>

            {/* 활동 통계 */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{selectedUser.totalMatches}</div>
                <div className="text-xs text-muted-foreground">총 매치</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{selectedUser.reportCount}</div>
                <div className="text-xs text-muted-foreground">신고 횟수</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {Math.floor((new Date().getTime() - new Date(selectedUser.joinedAt).getTime()) / (1000 * 60 * 60 * 24))}
                </div>
                <div className="text-xs text-muted-foreground">가입일수</div>
              </div>
            </div>

            {/* 타임스탬프 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                가입일: {new Date(selectedUser.joinedAt).toLocaleDateString('ko-KR')}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                마지막 활동: {new Date(selectedUser.lastActive).toLocaleDateString('ko-KR')}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {!selectedUser.isBlocked ? (
              <Button 
                variant="destructive"
                onClick={() => handleUserAction(selectedUser.id, 'block')}
              >
                <Ban className="h-4 w-4 mr-2" />
                차단하기
              </Button>
            ) : (
              <Button 
                variant="default"
                onClick={() => handleUserAction(selectedUser.id, 'unblock')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                차단해제
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => handleUserAction(selectedUser.id, 'suspend')}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              일시정지
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleUserAction(selectedUser.id, 'delete')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              계정삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">
              사용자 데이터를 로드하는 중...
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">👥 사용자 관리</h1>
              <p className="text-muted-foreground mt-2">
                전체 {users.length}명의 사용자를 관리하고 모니터링하세요
              </p>
            </div>
            <Button onClick={loadUsers} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>

          {/* 필터링 및 검색 */}
          <Card>
            <CardHeader>
              <CardTitle>필터 및 검색</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="닉네임 또는 이메일로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['ALL', 'PREMIUM', 'BLOCKED', 'REPORTED'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={selectedFilter === filter ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter(filter)}
                    >
                      {filter === 'ALL' && '전체'}
                      {filter === 'PREMIUM' && '프리미엄'}
                      {filter === 'BLOCKED' && '차단됨'}
                      {filter === 'REPORTED' && '신고됨'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 사용자 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>사용자 목록 ({filteredUsers.length}명)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-medium text-primary">
                          {user.nickname.charAt(0)}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.nickname}</span>
                          {user.isVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {getPremiumBadge(user.isPremium)}
                          {getStatusBadge(user)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email} • {user.age}세 • {user.location}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          매치 {user.totalMatches}회 • 신고 {user.reportCount}회 • 
                          최근 활동: {new Date(user.lastActive).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsUserDialogOpen(true);
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <UserDetailDialog />
      </div>
    </AdminLayout>
  );
}
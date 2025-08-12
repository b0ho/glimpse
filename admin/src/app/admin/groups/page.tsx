'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Users,
  Search,
  MoreVertical,
  Calendar,
  MapPin,
  Building,
  Heart,
  MessageCircle,
  Flag,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Shield,
  Crown,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Camera
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  type: 'OFFICIAL' | 'CREATED' | 'INSTANCE' | 'LOCATION';
  category: string;
  isActive: boolean;
  isVerified: boolean;
  memberCount: number;
  maxMembers: number;
  maleCount: number;
  femaleCount: number;
  creatorId: string;
  creatorNickname: string;
  adminIds: string[];
  location?: string;
  verificationMethod?: string;
  joinRequests: number;
  reportCount: number;
  totalPosts: number;
  totalStories: number;
  createdAt: string;
  lastActivityAt: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
}

export default function GroupsManagement() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'OFFICIAL' | 'REPORTED' | 'INACTIVE'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      
      // API 호출 (실제 구현에서는 서버 API 호출)
      const response = await fetch('/api/admin/groups');
      
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      } else {
        // 더미 데이터 사용
        const mockGroups: Group[] = [
          {
            id: '1',
            name: '서울 카페 애호가',
            description: '서울 지역의 다양한 카페를 함께 탐방하는 모임입니다. 커피와 디저트를 사랑하는 분들의 소통 공간입니다.',
            type: 'CREATED',
            category: '취미/여가',
            isActive: true,
            isVerified: true,
            memberCount: 247,
            maxMembers: 500,
            maleCount: 98,
            femaleCount: 149,
            creatorId: 'user1',
            creatorNickname: '커피러버',
            adminIds: ['user1', 'user2'],
            location: '서울시 강남구',
            joinRequests: 12,
            reportCount: 0,
            totalPosts: 156,
            totalStories: 89,
            createdAt: '2024-01-15T09:30:00Z',
            lastActivityAt: '2024-08-12T08:30:00Z',
            status: 'ACTIVE'
          },
          {
            id: '2',
            name: '네이버 공식 그룹',
            description: 'NAVER Corporation 공식 직원 그룹입니다. 사내 네트워킹과 소통을 위한 공간입니다.',
            type: 'OFFICIAL',
            category: '회사',
            isActive: true,
            isVerified: true,
            memberCount: 1247,
            maxMembers: 5000,
            maleCount: 623,
            femaleCount: 624,
            creatorId: 'naver_admin',
            creatorNickname: '네이버관리자',
            adminIds: ['naver_admin', 'naver_hr'],
            verificationMethod: '이메일 도메인 인증',
            joinRequests: 45,
            reportCount: 0,
            totalPosts: 892,
            totalStories: 234,
            createdAt: '2024-01-01T00:00:00Z',
            lastActivityAt: '2024-08-12T09:15:00Z',
            status: 'ACTIVE'
          },
          {
            id: '3',
            name: '헬스 & 피트니스',
            description: '건강한 라이프스타일을 추구하는 분들의 모임입니다. 운동 팁과 경험을 공유해요!',
            type: 'CREATED',
            category: '건강/운동',
            isActive: true,
            isVerified: false,
            memberCount: 189,
            maxMembers: 300,
            maleCount: 112,
            femaleCount: 77,
            creatorId: 'user3',
            creatorNickname: '헬스매니아',
            adminIds: ['user3'],
            joinRequests: 8,
            reportCount: 0,
            totalPosts: 78,
            totalStories: 145,
            createdAt: '2024-02-20T14:15:00Z',
            lastActivityAt: '2024-08-12T07:45:00Z',
            status: 'ACTIVE'
          },
          {
            id: '4',
            name: '의심스러운 그룹',
            description: '여기서 만나서 개인적으로 연락해요. 진짜 만남 원하는 분만.',
            type: 'CREATED',
            category: '기타',
            isActive: false,
            isVerified: false,
            memberCount: 23,
            maxMembers: 100,
            maleCount: 15,
            femaleCount: 8,
            creatorId: 'user4',
            creatorNickname: '의심스러운유저',
            adminIds: ['user4'],
            joinRequests: 2,
            reportCount: 15,
            totalPosts: 8,
            totalStories: 3,
            createdAt: '2024-07-30T11:00:00Z',
            lastActivityAt: '2024-08-10T15:20:00Z',
            status: 'SUSPENDED'
          },
          {
            id: '5',
            name: '강남역 즉석 모임',
            description: '강남역 근처에서 즉석으로 만나는 모임입니다. QR코드로 인증하세요.',
            type: 'LOCATION',
            category: '지역/모임',
            isActive: true,
            isVerified: true,
            memberCount: 45,
            maxMembers: 50,
            maleCount: 22,
            femaleCount: 23,
            creatorId: 'system',
            creatorNickname: '시스템',
            adminIds: ['system'],
            location: '서울시 강남구 강남대로',
            verificationMethod: 'GPS + QR코드',
            joinRequests: 0,
            reportCount: 0,
            totalPosts: 12,
            totalStories: 28,
            createdAt: '2024-08-12T14:00:00Z',
            lastActivityAt: '2024-08-12T16:30:00Z',
            status: 'ACTIVE'
          },
          {
            id: '6',
            name: '북클럽 서울',
            description: '매주 한 권씩 책을 읽고 토론하는 독서 모임입니다. 다양한 장르의 책을 함께 읽어요.',
            type: 'CREATED',
            category: '교육/문화',
            isActive: true,
            isVerified: true,
            memberCount: 67,
            maxMembers: 100,
            maleCount: 23,
            femaleCount: 44,
            creatorId: 'user6',
            creatorNickname: '독서클럽',
            adminIds: ['user6', 'user7'],
            location: '서울시 마포구',
            joinRequests: 15,
            reportCount: 0,
            totalPosts: 234,
            totalStories: 45,
            createdAt: '2024-03-10T16:45:00Z',
            lastActivityAt: '2024-08-12T10:20:00Z',
            status: 'ACTIVE'
          }
        ];
        setGroups(mockGroups);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.creatorNickname.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'ALL' ||
                         (selectedFilter === 'OFFICIAL' && group.type === 'OFFICIAL') ||
                         (selectedFilter === 'REPORTED' && group.reportCount > 0) ||
                         (selectedFilter === 'INACTIVE' && !group.isActive);
    
    return matchesSearch && matchesFilter;
  });

  const handleGroupAction = async (groupId: string, action: 'activate' | 'deactivate' | 'suspend' | 'delete') => {
    try {
      console.log(`Group ${groupId} ${action}ed`);
      
      setGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          switch (action) {
            case 'activate':
              return { ...group, isActive: true, status: 'ACTIVE' as const };
            case 'deactivate':
              return { ...group, isActive: false, status: 'INACTIVE' as const };
            case 'suspend':
              return { ...group, isActive: false, status: 'SUSPENDED' as const };
            case 'delete':
              return { ...group, status: 'DELETED' as const };
            default:
              return group;
          }
        }
        return group;
      }));
      
      setIsGroupDialogOpen(false);
    } catch (error) {
      console.error('Group action failed:', error);
    }
  };

  const getTypeIcon = (type: Group['type']) => {
    switch (type) {
      case 'OFFICIAL':
        return <Building className="h-4 w-4 text-blue-600" />;
      case 'CREATED':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'INSTANCE':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'LOCATION':
        return <MapPin className="h-4 w-4 text-purple-600" />;
    }
  };

  const getTypeName = (type: Group['type']) => {
    switch (type) {
      case 'OFFICIAL':
        return '공식';
      case 'CREATED':
        return '생성';
      case 'INSTANCE':
        return '즉석';
      case 'LOCATION':
        return '위치';
    }
  };

  const getStatusBadge = (group: Group) => {
    if (group.status === 'DELETED') {
      return <Badge variant="destructive">삭제됨</Badge>;
    }
    if (group.status === 'SUSPENDED') {
      return <Badge variant="destructive">정지됨</Badge>;
    }
    if (!group.isActive) {
      return <Badge variant="secondary">비활성</Badge>;
    }
    if (group.reportCount > 0) {
      return <Badge variant="destructive">신고됨</Badge>;
    }
    return <Badge variant="default">활성</Badge>;
  };

  const GroupDetailDialog = () => {
    if (!selectedGroup) return null;

    return (
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              그룹 상세 정보
            </DialogTitle>
            <DialogDescription>
              {selectedGroup.name} 그룹의 상세 정보와 관리 옵션입니다
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 그룹 기본 정보 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">기본 정보</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium">{selectedGroup.name}</span>
                      {selectedGroup.isVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(selectedGroup.type)}
                      <Badge variant="outline">
                        {getTypeName(selectedGroup.type)} 그룹
                      </Badge>
                      {getStatusBadge(selectedGroup)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedGroup.description}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">분류 및 위치</h4>
                  <div className="space-y-1 text-sm">
                    <div>카테고리: {selectedGroup.category}</div>
                    {selectedGroup.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedGroup.location}
                      </div>
                    )}
                    {selectedGroup.verificationMethod && (
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {selectedGroup.verificationMethod}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">관리자 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>생성자: {selectedGroup.creatorNickname}</span>
                      <Crown className="h-3 w-3 text-yellow-500" />
                    </div>
                    <div>관리자 수: {selectedGroup.adminIds.length}명</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">가입 요청</h4>
                  <div className="text-sm">
                    <div className="text-2xl font-bold text-blue-500">
                      {selectedGroup.joinRequests}
                    </div>
                    <div className="text-muted-foreground">대기 중인 요청</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 멤버 통계 */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {selectedGroup.memberCount}
                </div>
                <div className="text-xs text-muted-foreground">
                  전체 멤버 (최대 {selectedGroup.maxMembers})
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">
                  {selectedGroup.femaleCount}
                </div>
                <div className="text-xs text-muted-foreground">여성 멤버</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-500">
                  {selectedGroup.maleCount}
                </div>
                <div className="text-xs text-muted-foreground">남성 멤버</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {selectedGroup.reportCount}
                </div>
                <div className="text-xs text-muted-foreground">신고 횟수</div>
              </div>
            </div>

            {/* 활동 통계 */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-card border rounded-lg">
              <div className="text-center">
                <div className="text-xl font-bold text-green-500">
                  {selectedGroup.totalPosts}
                </div>
                <div className="text-xs text-muted-foreground">총 게시글</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-500">
                  {selectedGroup.totalStories}
                </div>
                <div className="text-xs text-muted-foreground">총 스토리</div>
              </div>
            </div>

            {/* 타임스탬프 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                생성일: {new Date(selectedGroup.createdAt).toLocaleString('ko-KR')}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                최근 활동: {new Date(selectedGroup.lastActivityAt).toLocaleString('ko-KR')}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {selectedGroup.isActive ? (
              <Button 
                variant="outline"
                onClick={() => handleGroupAction(selectedGroup.id, 'deactivate')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                비활성화
              </Button>
            ) : (
              <Button 
                variant="default"
                onClick={() => handleGroupAction(selectedGroup.id, 'activate')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                활성화
              </Button>
            )}
            <Button 
              variant="destructive"
              onClick={() => handleGroupAction(selectedGroup.id, 'suspend')}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              정지
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleGroupAction(selectedGroup.id, 'delete')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
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
              그룹 데이터를 로드하는 중...
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
              <h1 className="text-3xl font-bold">🏢 그룹 관리</h1>
              <p className="text-muted-foreground mt-2">
                전체 {groups.length}개의 그룹을 관리하고 모니터링하세요
              </p>
            </div>
            <Button onClick={loadGroups} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">전체 그룹</p>
                    <p className="text-2xl font-bold">{groups.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">공식 그룹</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {groups.filter(g => g.type === 'OFFICIAL').length}
                    </p>
                  </div>
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">신고된 그룹</p>
                    <p className="text-2xl font-bold text-red-500">
                      {groups.filter(g => g.reportCount > 0).length}
                    </p>
                  </div>
                  <Flag className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">총 멤버</p>
                    <p className="text-2xl font-bold text-green-500">
                      {groups.reduce((sum, g) => sum + g.memberCount, 0)}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
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
                      placeholder="그룹명, 설명, 카테고리, 생성자로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['ALL', 'OFFICIAL', 'REPORTED', 'INACTIVE'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={selectedFilter === filter ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter(filter)}
                    >
                      {filter === 'ALL' && '전체'}
                      {filter === 'OFFICIAL' && '공식'}
                      {filter === 'REPORTED' && '신고됨'}
                      {filter === 'INACTIVE' && '비활성'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 그룹 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>그룹 목록 ({filteredGroups.length}개)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredGroups.map((group) => (
                  <div key={group.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-3">
                        {/* 헤더 */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(group.type)}
                            <span className="font-medium text-lg">{group.name}</span>
                            {group.isVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </div>
                          <Badge variant="outline">
                            {getTypeName(group.type)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {group.category}
                          </Badge>
                          {getStatusBadge(group)}
                        </div>
                        
                        {/* 설명 */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {group.description}
                        </p>
                        
                        {/* 멤버 정보 */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{group.memberCount}</span>
                            <span className="text-muted-foreground">/ {group.maxMembers}</span>
                          </div>
                          <div className="flex items-center gap-1 text-pink-500">
                            <span>♀</span>
                            <span>{group.femaleCount}</span>
                          </div>
                          <div className="flex items-center gap-1 text-cyan-500">
                            <span>♂</span>
                            <span>{group.maleCount}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Crown className="h-3 w-3" />
                            <span>{group.creatorNickname}</span>
                          </div>
                        </div>
                        
                        {/* 통계 및 기타 정보 */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {group.totalPosts} 게시글
                          </div>
                          <div className="flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            {group.totalStories} 스토리
                          </div>
                          {group.joinRequests > 0 && (
                            <div className="flex items-center gap-1 text-blue-500">
                              <Mail className="h-3 w-3" />
                              {group.joinRequests} 가입요청
                            </div>
                          )}
                          {group.reportCount > 0 && (
                            <div className="flex items-center gap-1 text-red-500">
                              <AlertTriangle className="h-3 w-3" />
                              {group.reportCount} 신고
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(group.lastActivityAt).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedGroup(group);
                          setIsGroupDialogOpen(true);
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <GroupDetailDialog />
      </div>
    </AdminLayout>
  );
}
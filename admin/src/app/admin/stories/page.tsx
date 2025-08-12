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
  Camera,
  Search,
  MoreVertical,
  Calendar,
  Eye,
  EyeOff,
  Flag,
  Trash2,
  AlertTriangle,
  Clock,
  User,
  Play,
  Image as ImageIcon,
  Video,
} from 'lucide-react';

interface Story {
  id: string;
  authorId: string;
  authorNickname: string;
  content: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  thumbnailUrl?: string;
  duration?: number; // for videos
  isVisible: boolean;
  isReported: boolean;
  viewCount: number;
  reportCount: number;
  createdAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'HIDDEN' | 'DELETED';
  groupId?: string;
  groupName?: string;
}

export default function StoriesManagement() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ACTIVE' | 'REPORTED' | 'EXPIRED'>('ALL');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isStoryDialogOpen, setIsStoryDialogOpen] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      
      // API 호출 (실제 구현에서는 서버 API 호출)
      const response = await fetch('/api/admin/stories');
      
      if (response.ok) {
        const data = await response.json();
        setStories(data.stories || []);
      } else {
        // 더미 데이터 사용
        const mockStories: Story[] = [
          {
            id: '1',
            authorId: 'user1',
            authorNickname: '커피러버',
            content: '새로운 카페 발견! ☕️',
            mediaType: 'IMAGE',
            mediaUrl: '/placeholder-cafe.jpg',
            thumbnailUrl: '/placeholder-cafe-thumb.jpg',
            isVisible: true,
            isReported: false,
            viewCount: 145,
            reportCount: 0,
            createdAt: '2024-08-12T08:30:00Z',
            expiresAt: '2024-08-13T08:30:00Z',
            status: 'ACTIVE',
            groupId: 'group1',
            groupName: '서울 카페 애호가'
          },
          {
            id: '2',
            authorId: 'user2',
            authorNickname: '헬스매니아',
            content: '오늘 운동 루틴 공유!',
            mediaType: 'VIDEO',
            mediaUrl: '/placeholder-workout.mp4',
            thumbnailUrl: '/placeholder-workout-thumb.jpg',
            duration: 45,
            isVisible: true,
            isReported: false,
            viewCount: 289,
            reportCount: 0,
            createdAt: '2024-08-12T06:00:00Z',
            expiresAt: '2024-08-13T06:00:00Z',
            status: 'ACTIVE',
            groupId: 'group2',
            groupName: '헬스 & 피트니스'
          },
          {
            id: '3',
            authorId: 'user3',
            authorNickname: '의심스러운유저',
            content: '개인 연락처로 연락주세요',
            mediaType: 'IMAGE',
            mediaUrl: '/placeholder-contact.jpg',
            thumbnailUrl: '/placeholder-contact-thumb.jpg',
            isVisible: false,
            isReported: true,
            viewCount: 23,
            reportCount: 12,
            createdAt: '2024-08-11T22:15:00Z',
            expiresAt: '2024-08-12T22:15:00Z',
            status: 'HIDDEN'
          },
          {
            id: '4',
            authorId: 'user4',
            authorNickname: '독서클럽',
            content: '이번 주 추천 도서 📚',
            mediaType: 'IMAGE',
            mediaUrl: '/placeholder-books.jpg',
            thumbnailUrl: '/placeholder-books-thumb.jpg',
            isVisible: true,
            isReported: false,
            viewCount: 76,
            reportCount: 0,
            createdAt: '2024-08-11T19:30:00Z',
            expiresAt: '2024-08-12T19:30:00Z',
            status: 'EXPIRED',
            groupId: 'group3',
            groupName: '북클럽 서울'
          },
          {
            id: '5',
            authorId: 'user5',
            authorNickname: '요리사',
            content: '오늘 저녁 메뉴 🍝',
            mediaType: 'VIDEO',
            mediaUrl: '/placeholder-cooking.mp4',
            thumbnailUrl: '/placeholder-cooking-thumb.jpg',
            duration: 60,
            isVisible: true,
            isReported: false,
            viewCount: 201,
            reportCount: 0,
            createdAt: '2024-08-12T17:45:00Z',
            expiresAt: '2024-08-13T17:45:00Z',
            status: 'ACTIVE',
            groupId: 'group4',
            groupName: '홈쿠킹 모임'
          },
          {
            id: '6',
            authorId: 'user6',
            authorNickname: '스팸유저',
            content: '🎉 대박 이벤트 🎉',
            mediaType: 'IMAGE',
            mediaUrl: '/placeholder-spam.jpg',
            thumbnailUrl: '/placeholder-spam-thumb.jpg',
            isVisible: false,
            isReported: true,
            viewCount: 8,
            reportCount: 25,
            createdAt: '2024-08-10T14:20:00Z',
            expiresAt: '2024-08-11T14:20:00Z',
            status: 'DELETED'
          }
        ];
        setStories(mockStories);
      }
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         story.authorNickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (story.groupName && story.groupName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'ALL' ||
                         (selectedFilter === 'ACTIVE' && story.status === 'ACTIVE') ||
                         (selectedFilter === 'REPORTED' && story.isReported) ||
                         (selectedFilter === 'EXPIRED' && story.status === 'EXPIRED');
    
    return matchesSearch && matchesFilter;
  });

  const handleStoryAction = async (storyId: string, action: 'hide' | 'show' | 'delete') => {
    try {
      console.log(`Story ${storyId} ${action}ed`);
      
      setStories(prev => prev.map(story => {
        if (story.id === storyId) {
          switch (action) {
            case 'hide':
              return { ...story, isVisible: false, status: 'HIDDEN' as const };
            case 'show':
              return { ...story, isVisible: true, status: 'ACTIVE' as const };
            case 'delete':
              return { ...story, status: 'DELETED' as const };
            default:
              return story;
          }
        }
        return story;
      }));
      
      setIsStoryDialogOpen(false);
    } catch (error) {
      console.error('Story action failed:', error);
    }
  };

  const getStatusBadge = (story: Story) => {
    if (story.status === 'DELETED') {
      return <Badge variant="destructive">삭제됨</Badge>;
    }
    if (story.status === 'HIDDEN' || !story.isVisible) {
      return <Badge variant="secondary">숨김</Badge>;
    }
    if (story.status === 'EXPIRED') {
      return <Badge variant="outline">만료됨</Badge>;
    }
    if (story.isReported) {
      return <Badge variant="destructive">신고됨</Badge>;
    }
    return <Badge variant="default">활성</Badge>;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return '만료됨';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 남음`;
    }
    return `${minutes}분 남음`;
  };

  const StoryDetailDialog = () => {
    if (!selectedStory) return null;

    return (
      <Dialog open={isStoryDialogOpen} onOpenChange={setIsStoryDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              스토리 상세 정보
            </DialogTitle>
            <DialogDescription>
              {selectedStory.authorNickname}님의 스토리 관리
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 작성자 정보 */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{selectedStory.authorNickname}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedStory.groupName && `${selectedStory.groupName} • `}
                  {new Date(selectedStory.createdAt).toLocaleString('ko-KR')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedStory)}
              </div>
            </div>

            {/* 스토리 미리보기 */}
            <div className="space-y-3">
              <div className="aspect-[9/16] max-w-xs mx-auto bg-card border rounded-lg overflow-hidden">
                <div className="w-full h-full bg-muted flex items-center justify-center relative">
                  {selectedStory.mediaType === 'VIDEO' ? (
                    <div className="text-center">
                      <Video className="h-12 w-12 mx-auto mb-2 text-purple-500" />
                      <p className="text-sm text-muted-foreground">
                        동영상 ({selectedStory.duration}초)
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 text-blue-500" />
                      <p className="text-sm text-muted-foreground">이미지</p>
                    </div>
                  )}
                  
                  {/* 스토리 텍스트 오버레이 */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-sm font-medium">
                      {selectedStory.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{selectedStory.viewCount}</div>
                <div className="text-xs text-muted-foreground">조회수</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{selectedStory.reportCount}</div>
                <div className="text-xs text-muted-foreground">신고 횟수</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  selectedStory.status === 'EXPIRED' ? 'text-gray-500' : 'text-green-500'
                }`}>
                  {selectedStory.status === 'EXPIRED' ? '0' : '24h'}
                </div>
                <div className="text-xs text-muted-foreground">남은 시간</div>
              </div>
            </div>

            {/* 만료 정보 */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  {getTimeRemaining(selectedStory.expiresAt)}
                </span>
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                만료 예정: {new Date(selectedStory.expiresAt).toLocaleString('ko-KR')}
              </div>
            </div>

            {/* 타임스탬프 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                작성일: {new Date(selectedStory.createdAt).toLocaleString('ko-KR')}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {selectedStory.isVisible ? (
              <Button 
                variant="outline"
                onClick={() => handleStoryAction(selectedStory.id, 'hide')}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                숨기기
              </Button>
            ) : (
              <Button 
                variant="default"
                onClick={() => handleStoryAction(selectedStory.id, 'show')}
              >
                <Eye className="h-4 w-4 mr-2" />
                표시하기
              </Button>
            )}
            <Button 
              variant="destructive"
              onClick={() => handleStoryAction(selectedStory.id, 'delete')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제하기
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
              스토리 데이터를 로드하는 중...
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
              <h1 className="text-3xl font-bold">📸 스토리 관리</h1>
              <p className="text-muted-foreground mt-2">
                전체 {stories.length}개의 스토리를 관리하고 모니터링하세요
              </p>
            </div>
            <Button onClick={loadStories} variant="outline">
              <Camera className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">전체 스토리</p>
                    <p className="text-2xl font-bold">{stories.length}</p>
                  </div>
                  <Camera className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">활성 스토리</p>
                    <p className="text-2xl font-bold text-green-500">
                      {stories.filter(s => s.status === 'ACTIVE').length}
                    </p>
                  </div>
                  <Play className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">신고된 스토리</p>
                    <p className="text-2xl font-bold text-red-500">
                      {stories.filter(s => s.isReported).length}
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
                    <p className="text-sm font-medium text-muted-foreground">만료된 스토리</p>
                    <p className="text-2xl font-bold text-gray-500">
                      {stories.filter(s => s.status === 'EXPIRED').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-gray-500" />
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
                      placeholder="스토리 내용, 작성자, 그룹명으로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['ALL', 'ACTIVE', 'REPORTED', 'EXPIRED'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={selectedFilter === filter ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter(filter)}
                    >
                      {filter === 'ALL' && '전체'}
                      {filter === 'ACTIVE' && '활성'}
                      {filter === 'REPORTED' && '신고됨'}
                      {filter === 'EXPIRED' && '만료'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 스토리 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>스토리 목록 ({filteredStories.length}개)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStories.map((story) => (
                  <div key={story.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    {/* 스토리 썸네일 */}
                    <div className="aspect-[9/16] bg-muted relative">
                      <div className="w-full h-full flex items-center justify-center">
                        {story.mediaType === 'VIDEO' ? (
                          <div className="text-center">
                            <Video className="h-8 w-8 mx-auto mb-1 text-purple-500" />
                            <p className="text-xs text-muted-foreground">{story.duration}초</p>
                          </div>
                        ) : (
                          <ImageIcon className="h-8 w-8 text-blue-500" />
                        )}
                      </div>
                      
                      {/* 스토리 상태 뱃지 */}
                      <div className="absolute top-2 left-2">
                        {getStatusBadge(story)}
                      </div>
                      
                      {/* 신고 표시 */}
                      {story.reportCount > 0 && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {story.reportCount}
                          </Badge>
                        </div>
                      )}
                      
                      {/* 스토리 텍스트 오버레이 */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                        <p className="text-white text-xs font-medium line-clamp-2">
                          {story.content}
                        </p>
                      </div>
                    </div>
                    
                    {/* 스토리 정보 */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{story.authorNickname}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStory(story);
                            setIsStoryDialogOpen(true);
                          }}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {story.groupName && (
                        <Badge variant="outline" className="text-xs">
                          {story.groupName}
                        </Badge>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {story.viewCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeRemaining(story.expiresAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <StoryDetailDialog />
      </div>
    </AdminLayout>
  );
}
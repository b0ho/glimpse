'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  FileText,
  Search,
  MoreVertical,
  Calendar,
  Heart,
  MessageCircle,
  Flag,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Image as ImageIcon,
  Video,
  User
} from 'lucide-react';

interface Post {
  id: string;
  authorId: string;
  authorNickname: string;
  content: string;
  mediaType: 'NONE' | 'IMAGE' | 'VIDEO';
  mediaUrl?: string;
  isVisible: boolean;
  isReported: boolean;
  likesCount: number;
  commentsCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  groupId?: string;
  groupName?: string;
  status: 'ACTIVE' | 'HIDDEN' | 'DELETED';
}

export default function PostsManagement() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'REPORTED' | 'HIDDEN' | 'MEDIA'>('ALL');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      // API 호출 (실제 구현에서는 서버 API 호출)
      const response = await fetch('/api/admin/posts');
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        // 더미 데이터 사용
        const mockPosts: Post[] = [
          {
            id: '1',
            authorId: 'user1',
            authorNickname: '커피러버',
            content: '오늘 날씨가 너무 좋네요! 카페에서 힐링 중입니다 ☕️ #일상 #카페',
            mediaType: 'IMAGE',
            mediaUrl: '/placeholder-image.jpg',
            isVisible: true,
            isReported: false,
            likesCount: 24,
            commentsCount: 8,
            reportCount: 0,
            createdAt: '2024-08-12T09:30:00Z',
            updatedAt: '2024-08-12T09:30:00Z',
            groupId: 'group1',
            groupName: '서울 카페 애호가',
            status: 'ACTIVE'
          },
          {
            id: '2',
            authorId: 'user2',
            authorNickname: '헬스매니아',
            content: '오늘 운동 완료! 💪 새벽 6시부터 시작해서 2시간 동안 열심히 했어요. 여러분도 건강한 하루 되세요!',
            mediaType: 'VIDEO',
            mediaUrl: '/placeholder-video.mp4',
            isVisible: true,
            isReported: false,
            likesCount: 45,
            commentsCount: 12,
            reportCount: 0,
            createdAt: '2024-08-12T06:15:00Z',
            updatedAt: '2024-08-12T06:15:00Z',
            groupId: 'group2',
            groupName: '헬스 & 피트니스',
            status: 'ACTIVE'
          },
          {
            id: '3',
            authorId: 'user3',
            authorNickname: '의심스러운유저',
            content: '여기서 만날 사람? 개인 연락처로 연락주세요. 카톡아이디: suspicious123',
            mediaType: 'NONE',
            isVisible: false,
            isReported: true,
            likesCount: 2,
            commentsCount: 0,
            reportCount: 8,
            createdAt: '2024-08-11T20:45:00Z',
            updatedAt: '2024-08-11T22:30:00Z',
            status: 'HIDDEN'
          },
          {
            id: '4',
            authorId: 'user4',
            authorNickname: '독서클럽',
            content: '이번 주 독서 모임에서 읽을 책 추천받아요! 📚 SF 소설 위주로 찾고 있습니다.',
            mediaType: 'IMAGE',
            mediaUrl: '/placeholder-books.jpg',
            isVisible: true,
            isReported: false,
            likesCount: 18,
            commentsCount: 15,
            reportCount: 0,
            createdAt: '2024-08-11T14:20:00Z',
            updatedAt: '2024-08-11T14:20:00Z',
            groupId: 'group3',
            groupName: '북클럽 서울',
            status: 'ACTIVE'
          },
          {
            id: '5',
            authorId: 'user5',
            authorNickname: '스팸게시자',
            content: '🎉대박 이벤트🎉 지금 가입하면 100% 환급! 링크 클릭: spam-site.com 지금 바로 확인하세요!!!',
            mediaType: 'NONE',
            isVisible: false,
            isReported: true,
            likesCount: 0,
            commentsCount: 0,
            reportCount: 15,
            createdAt: '2024-08-10T16:30:00Z',
            updatedAt: '2024-08-10T18:00:00Z',
            status: 'DELETED'
          },
          {
            id: '6',
            authorId: 'user6',
            authorNickname: '요리사',
            content: '집에서 만든 파스타 레시피 공유합니다! 🍝 간단하면서도 맛있어요. 궁금한 점 있으면 댓글로 질문하세요~',
            mediaType: 'IMAGE',
            mediaUrl: '/placeholder-pasta.jpg',
            isVisible: true,
            isReported: false,
            likesCount: 67,
            commentsCount: 23,
            reportCount: 0,
            createdAt: '2024-08-10T12:00:00Z',
            updatedAt: '2024-08-10T12:00:00Z',
            groupId: 'group4',
            groupName: '홈쿠킹 모임',
            status: 'ACTIVE'
          }
        ];
        setPosts(mockPosts);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.authorNickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.groupName && post.groupName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'ALL' ||
                         (selectedFilter === 'REPORTED' && post.isReported) ||
                         (selectedFilter === 'HIDDEN' && !post.isVisible) ||
                         (selectedFilter === 'MEDIA' && post.mediaType !== 'NONE');
    
    return matchesSearch && matchesFilter;
  });

  const handlePostAction = async (postId: string, action: 'hide' | 'show' | 'delete') => {
    try {
      console.log(`Post ${postId} ${action}ed`);
      
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          switch (action) {
            case 'hide':
              return { ...post, isVisible: false, status: 'HIDDEN' as const };
            case 'show':
              return { ...post, isVisible: true, status: 'ACTIVE' as const };
            case 'delete':
              return { ...post, status: 'DELETED' as const };
            default:
              return post;
          }
        }
        return post;
      }));
      
      setIsPostDialogOpen(false);
    } catch (error) {
      console.error('Post action failed:', error);
    }
  };

  const getStatusBadge = (post: Post) => {
    if (post.status === 'DELETED') {
      return <Badge variant="destructive">삭제됨</Badge>;
    }
    if (post.status === 'HIDDEN' || !post.isVisible) {
      return <Badge variant="secondary">숨김</Badge>;
    }
    if (post.isReported) {
      return <Badge variant="destructive">신고됨</Badge>;
    }
    return <Badge variant="default">활성</Badge>;
  };

  const getMediaIcon = (mediaType: Post['mediaType']) => {
    switch (mediaType) {
      case 'IMAGE':
        return <ImageIcon className="h-4 w-4 text-blue-500" />;
      case 'VIDEO':
        return <Video className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const PostDetailDialog = () => {
    if (!selectedPost) return null;

    return (
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              게시글 상세 정보
            </DialogTitle>
            <DialogDescription>
              {selectedPost.authorNickname}님의 게시글 관리
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 작성자 정보 */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">{selectedPost.authorNickname}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedPost.groupName && `${selectedPost.groupName} • `}
                  {new Date(selectedPost.createdAt).toLocaleString('ko-KR')}
                </div>
              </div>
              <div className="ml-auto">
                {getStatusBadge(selectedPost)}
              </div>
            </div>

            {/* 게시글 내용 */}
            <div className="space-y-3">
              <div className="p-4 bg-card border rounded-lg">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
                
                {selectedPost.mediaType !== 'NONE' && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    {getMediaIcon(selectedPost.mediaType)}
                    <span>
                      {selectedPost.mediaType === 'IMAGE' ? '이미지' : '동영상'} 첨부됨
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{selectedPost.likesCount}</div>
                <div className="text-xs text-muted-foreground">좋아요</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{selectedPost.commentsCount}</div>
                <div className="text-xs text-muted-foreground">댓글</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{selectedPost.reportCount}</div>
                <div className="text-xs text-muted-foreground">신고</div>
              </div>
            </div>

            {/* 타임스탬프 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                작성일: {new Date(selectedPost.createdAt).toLocaleString('ko-KR')}
              </div>
              {selectedPost.updatedAt !== selectedPost.createdAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  수정일: {new Date(selectedPost.updatedAt).toLocaleString('ko-KR')}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {selectedPost.isVisible ? (
              <Button 
                variant="outline"
                onClick={() => handlePostAction(selectedPost.id, 'hide')}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                숨기기
              </Button>
            ) : (
              <Button 
                variant="default"
                onClick={() => handlePostAction(selectedPost.id, 'show')}
              >
                <Eye className="h-4 w-4 mr-2" />
                표시하기
              </Button>
            )}
            <Button 
              variant="destructive"
              onClick={() => handlePostAction(selectedPost.id, 'delete')}
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
              게시글 데이터를 로드하는 중...
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
              <h1 className="text-3xl font-bold">📝 게시글 관리</h1>
              <p className="text-muted-foreground mt-2">
                전체 {posts.length}개의 게시글을 관리하고 모니터링하세요
              </p>
            </div>
            <Button onClick={loadPosts} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">전체 게시글</p>
                    <p className="text-2xl font-bold">{posts.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">신고된 게시글</p>
                    <p className="text-2xl font-bold text-red-500">
                      {posts.filter(p => p.isReported).length}
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
                    <p className="text-sm font-medium text-muted-foreground">숨김 처리</p>
                    <p className="text-2xl font-bold text-orange-500">
                      {posts.filter(p => !p.isVisible).length}
                    </p>
                  </div>
                  <EyeOff className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">미디어 게시글</p>
                    <p className="text-2xl font-bold text-purple-500">
                      {posts.filter(p => p.mediaType !== 'NONE').length}
                    </p>
                  </div>
                  <ImageIcon className="h-8 w-8 text-purple-500" />
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
                      placeholder="게시글 내용, 작성자, 그룹명으로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['ALL', 'REPORTED', 'HIDDEN', 'MEDIA'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={selectedFilter === filter ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFilter(filter)}
                    >
                      {filter === 'ALL' && '전체'}
                      {filter === 'REPORTED' && '신고됨'}
                      {filter === 'HIDDEN' && '숨김'}
                      {filter === 'MEDIA' && '미디어'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 게시글 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>게시글 목록 ({filteredPosts.length}개)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        {/* 헤더 */}
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{post.authorNickname}</span>
                          {post.groupName && (
                            <Badge variant="outline" className="text-xs">
                              {post.groupName}
                            </Badge>
                          )}
                          {getStatusBadge(post)}
                          {getMediaIcon(post.mediaType)}
                        </div>
                        
                        {/* 내용 */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.content}
                        </p>
                        
                        {/* 통계 */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likesCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post.commentsCount}
                          </div>
                          {post.reportCount > 0 && (
                            <div className="flex items-center gap-1 text-red-500">
                              <AlertTriangle className="h-3 w-3" />
                              {post.reportCount}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPost(post);
                          setIsPostDialogOpen(true);
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
        
        <PostDetailDialog />
      </div>
    </AdminLayout>
  );
}
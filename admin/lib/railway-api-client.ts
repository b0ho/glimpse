// Admin → Server API 연동 클라이언트

// API Response 타입 정의
interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  totalMessages: number;
  revenue: number;
  premiumUsers: number;
  reportedUsers: number;
  onlineUsers: number;
  users?: {
    total: number;
    active: number;
    premium: number;
  };
  groups?: {
    total: number;
  };
  matches?: {
    total: number;
  };
  reports?: {
    total: number;
    pending: number;
  };
}

interface User {
  id: string;
  anonymousId: string;
  phoneNumber?: string;
  nickname?: string;
  profileImage?: string;
  isPremium: boolean;
  premiumUntil?: Date;
  createdAt: Date;
  lastActive: Date;
  deletedAt?: Date;
  matchCount?: number;
  reportCount?: number;
}

interface Group {
  id: string;
  name: string;
  type: string;
  description?: string;
  isActive: boolean;
  memberCount?: number;
  createdAt: Date;
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

export class RailwayApiClient {
  private baseURL: string;
  private isDevelopment: boolean;

  constructor() {
    // 환경 감지 (mobile 앱과 동일한 패턴 적용)
    this.isDevelopment = process.env.NODE_ENV === 'development' || 
                         (typeof window !== 'undefined' && window.location.hostname.includes('localhost')) ||
                         (typeof window !== 'undefined' && window.location.hostname.includes('127.0.0.1')) ||
                         (typeof window !== 'undefined' && window.location.hostname.includes('.local'));
    
    // Server API URL - 로컬에서는 로컬 서버로, 운영에서는 Railway 서버로
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 
                   process.env.API_URL || 
                   (this.isDevelopment 
                     ? 'http://localhost:3001'  // 로컬 서버
                     : 'https://glimpse-server.up.railway.app');  // Railway 서버
    
    console.log('[API Client] Environment:', { isDevelopment: this.isDevelopment, baseURL: this.baseURL });
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}/api/v1${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // 개발 환경에서 x-dev-auth 헤더 추가
    if (this.isDevelopment) {
      headers['x-dev-auth'] = 'true';
    }

    // 브라우저 환경에서 쿠키에서 토큰 가져오기
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token') || 
                    document.cookie.replace(/(?:(?:^|.*;\s*)admin_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // 인증 오류 시 로그인 페이지로
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
        throw new Error('Authentication required');
      }
      
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // 관리자 인증
  async login(email: string, password: string): Promise<{
    access_token: string;
    user: {
      email: string;
      name: string;
      role: string;
      permissions: string[];
    };
  }> {
    const result = await this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // 토큰을 브라우저 저장소에 저장
    if (typeof window !== 'undefined' && result.access_token) {
      localStorage.setItem('admin_token', result.access_token);
      document.cookie = `admin_token=${result.access_token}; path=/; max-age=86400`; // 24시간
    }

    return result;
  }

  async logout(): Promise<void> {
    // 토큰 삭제
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
  }

  // 대시보드 통계
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request('/admin/dashboard');
  }

  // 사용자 관리
  async getUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    filter?: string;
  } = {}): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.search) params.append('search', query.search);
    if (query.filter) params.append('filter', query.filter);

    return this.request(`/admin/users?${params.toString()}`);
  }

  async getUserById(userId: string): Promise<User> {
    return this.request(`/admin/users/${userId}`);
  }

  async banUser(userId: string, data: {
    reason: string;
    durationDays?: number;
  }): Promise<{ success: boolean }> {
    return this.request(`/admin/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ ...data, action: 'ban' }),
    });
  }

  async unbanUser(userId: string): Promise<{ success: boolean }> {
    return this.request(`/admin/users/${userId}/unban`, {
      method: 'POST',
    });
  }

  // 그룹 관리
  async getGroups(page = 1, limit = 20): Promise<PaginatedResponse<Group>> {
    return this.request(`/admin/groups?page=${page}&limit=${limit}`);
  }

  // 신고 관리
  async getReports(query: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<UserReport>> {
    const params = new URLSearchParams();
    if (query.status) params.append('status', query.status);
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());

    return this.request(`/admin/reports?${params.toString()}`);
  }

  async handleReport(reportId: string, action: 'approve' | 'reject'): Promise<{ success: boolean }> {
    return this.request(`/admin/reports/${reportId}/handle`, {
      method: 'POST',
      body: JSON.stringify({ action: action === 'approve' ? 'BLOCK' : 'DISMISS' }),
    });
  }

  // 그룹 승인/거절
  async moderateGroup(groupId: string, data: {
    action: 'approve' | 'reject';
    reason?: string;
  }): Promise<{ success: boolean }> {
    return this.request(`/admin/groups/${groupId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ 
        action: data.action === 'approve' ? 'APPROVE' : 'REJECT',
        reason: data.reason 
      }),
    });
  }

  // 공지사항 발송
  async createAnnouncement(data: {
    title: string;
    content: string;
    targetAudience?: 'all' | 'premium' | 'active';
  }): Promise<{ sentCount: number }> {
    return this.request('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// 싱글톤 인스턴스
export const railwayApi = new RailwayApiClient();

// 타입 export
export type { DashboardStats, User, Group, UserReport, PaginatedResponse };
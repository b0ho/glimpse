// Admin → Railway API 연동 클라이언트
import { User, Group, Match } from '@/types/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export class RailwayApiClient {
  private baseURL: string;
  private adminToken: string;

  constructor() {
    // Railway에서 배포된 서버 URL
    this.baseURL = process.env.NEXT_PUBLIC_RAILWAY_API_URL || 'https://glimpse-server.railway.app';
    this.adminToken = process.env.NEXT_PUBLIC_ADMIN_API_TOKEN || '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.adminToken}`,
        'X-Admin-Access': 'true',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // 사용자 관리
  async getUsers(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<User>>> {
    return this.request(`/api/v1/admin/users?page=${page}&limit=${limit}`);
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    return this.request(`/api/v1/admin/users/${userId}`);
  }

  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request('/api/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request(`/api/v1/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // 그룹 관리
  async getGroups(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<Group>>> {
    return this.request(`/api/v1/admin/groups?page=${page}&limit=${limit}`);
  }

  async getGroupById(groupId: string): Promise<ApiResponse<Group>> {
    return this.request(`/api/v1/admin/groups/${groupId}`);
  }

  // 매치 관리
  async getMatches(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<Match>>> {
    return this.request(`/api/v1/admin/matches?page=${page}&limit=${limit}`);
  }

  // 시스템 통계
  async getDashboardStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalGroups: number;
    totalMatches: number;
    activeUsers: number;
    premiumUsers: number;
  }>> {
    return this.request('/api/v1/admin/dashboard/stats');
  }

  // 실시간 모니터링
  async getSystemHealth(): Promise<ApiResponse<{
    status: 'healthy' | 'warning' | 'critical';
    database: boolean;
    redis: boolean;
    websocket: boolean;
    uptime: number;
  }>> {
    return this.request('/api/v1/admin/system/health');
  }
}

// 싱글톤 인스턴스
export const railwayApi = new RailwayApiClient();
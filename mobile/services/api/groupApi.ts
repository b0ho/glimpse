import apiClient from './config';
import { Group, GroupType } from '@shared/types';

/**
 * 그룹 생성 데이터 인터페이스
 * @interface CreateGroupData
 */
interface CreateGroupData {
  name: string;
  description: string;
  type: GroupType;
  settings?: {
    requiresApproval?: boolean;
    allowInvites?: boolean;
    isPrivate?: boolean;
  };
  location?: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  companyId?: string;
}

/**
 * 초대 링크 인터페이스
 * @interface InviteLink
 */
interface InviteLink {
  inviteLink: string;
}

/**
 * 그룹 참여 응답 인터페이스
 * @interface JoinGroupResponse
 */
interface JoinGroupResponse {
  success: boolean;
  requiresApproval: boolean;
  group: {
    id: string;
    name: string;
    type: GroupType;
  };
}

/**
 * 그룹 초대 정보 인터페이스
 * @interface GroupInvite
 */
interface GroupInvite {
  id: string;
  inviteCode: string;
  createdBy: {
    id: string;
    nickname: string;
  };
  createdAt: Date;
  expiresAt: Date;
  uses: number;
  maxUses: number | null;
  link: string;
}

/**
 * 그룹 관리 API 서비스
 * @namespace groupApi
 * @description 그룹 생성, 참여, 관리 등 그룹 관련 모든 API
 */
export const groupApi = {
  /**
   * 그룹 목록 조회
   * @async
   * @param {Object} [params] - 조회 파라미터
   * @param {GroupType} [params.type] - 그룹 타입
   * @param {string} [params.search] - 검색어
   * @param {number} [params.page] - 페이지 번호
   * @param {number} [params.limit] - 페이지당 항목 수
   * @returns {Promise<Group[]>} 그룹 리스트
   */
  async getGroups(params?: {
    type?: GroupType;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Group[]> {
    const response = await apiClient.get<{ success: boolean; data: Group[] }>('/groups', params);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('그룹 목록 조회 실패');
  },

  /**
   * 새 그룹 생성
   * @async
   * @param {CreateGroupData} data - 그룹 생성 데이터
   * @returns {Promise<Group>} 생성된 그룹 정보
   */
  async createGroup(data: CreateGroupData): Promise<Group> {
    const response = await apiClient.post<{ success: boolean; data: Group }>('/groups', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('그룹 생성 실패');
  },

  /**
   * 특정 그룹 조회
   * @async
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<Group>} 그룹 상세 정보
   */
  async getGroupById(groupId: string): Promise<Group> {
    const response = await apiClient.get<{ success: boolean; data: Group }>(`/groups/${groupId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('그룹 조회 실패');
  },

  /**
   * 그룹 정보 업데이트
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {Partial<CreateGroupData>} data - 업데이트할 데이터
   * @returns {Promise<Group>} 업데이트된 그룹 정보
   */
  async updateGroup(groupId: string, data: Partial<CreateGroupData>): Promise<Group> {
    const response = await apiClient.put<{ success: boolean; data: Group }>(`/groups/${groupId}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error('그룹 수정 실패');
  },

  /**
   * 그룹 삭제
   * @async
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<void>}
   */
  async deleteGroup(groupId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}`);
  },

  /**
   * 그룹 참여
   * @async
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<void>}
   */
  async joinGroup(groupId: string): Promise<void> {
    await apiClient.post(`/groups/${groupId}/join`);
  },

  /**
   * 그룹 탈퇴
   * @async
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<void>}
   */
  async leaveGroup(groupId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/leave`);
  },

  /**
   * 그룹 멤버 목록 조회
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=50] - 페이지당 항목 수
   * @returns {Promise<any[]>} 멤버 리스트
   */
  async getGroupMembers(groupId: string, page = 1, limit = 50): Promise<any[]> {
    const response = await apiClient.get<{ data: { data: any[] } }>(`/groups/${groupId}/members`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  /**
   * 초대 링크 생성
   * @async
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<string>} 초대 링크 URL
   */
  async generateInviteLink(groupId: string): Promise<string> {
    const response = await apiClient.post<{ data: { data: { inviteLink: string } } }>(`/groups/${groupId}/invites`);
    return response.data.data.inviteLink;
  },

  /**
   * 초대 코드로 그룹 참여
   * @async
   * @param {string} inviteCode - 초대 코드
   * @returns {Promise<JoinGroupResponse>} 참여 결과
   */
  async joinGroupByInvite(inviteCode: string): Promise<JoinGroupResponse> {
    const response = await apiClient.post<{ data: { data: JoinGroupResponse } }>(`/groups/join/${inviteCode}`);
    return response.data.data;
  },

  /**
   * 그룹 초대 목록 조회
   * @async
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<GroupInvite[]>} 초대 리스트
   */
  async getGroupInvites(groupId: string): Promise<GroupInvite[]> {
    const response = await apiClient.get<{ data: { data: GroupInvite[] } }>(`/groups/${groupId}/invites`);
    return response.data.data;
  },

  /**
   * 초대 취소
   * @async
   * @param {string} inviteId - 초대 ID
   * @returns {Promise<void>}
   */
  async revokeInvite(inviteId: string): Promise<void> {
    await apiClient.delete(`/groups/invites/${inviteId}`);
  },

  /**
   * 전화번호로 사용자 초대
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {string[]} phoneNumbers - 전화번호 리스트
   * @returns {Promise<any>} 초대 결과
   */
  async inviteToGroup(groupId: string, phoneNumbers: string[]): Promise<any> {
    const response = await apiClient.post<{ data: { data: any } }>(`/groups/${groupId}/invite`, { phoneNumbers });
    return response.data.data;
  },

  /**
   * 멤버 역할 업데이트
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {string} userId - 사용자 ID
   * @param {'MEMBER' | 'ADMIN'} role - 역할
   * @returns {Promise<void>}
   */
  async updateMemberRole(groupId: string, userId: string, role: 'MEMBER' | 'ADMIN'): Promise<void> {
    await apiClient.put(`/groups/${groupId}/members/${userId}`, { role });
  },

  /**
   * 멤버 제거
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/members/${userId}`);
  },

  /**
   * 위치 체크인
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {Object} data - 체크인 데이터
   * @param {number} data.latitude - 위도
   * @param {number} data.longitude - 경도
   * @param {number} [data.accuracy] - 정확도
   * @param {'GPS' | 'QR_CODE'} [data.method] - 체크인 방법
   * @returns {Promise<any>} 체크인 결과
   */
  async locationCheckIn(groupId: string, data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    method?: 'GPS' | 'QR_CODE';
  }): Promise<any> {
    const response = await apiClient.post<{ data: any }>(`/groups/${groupId}/checkin`, data);
    return response.data;
  },

  /**
   * 체크인 내역 조회
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {number} [page=1] - 페이지 번호
   * @param {number} [limit=20] - 페이지당 항목 수
   * @returns {Promise<any[]>} 체크인 리스트
   */
  async getCheckIns(groupId: string, page = 1, limit = 20): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`/groups/${groupId}/checkins`, { page, limit });
    return response.data;
  },

  /**
   * 대기 중인 멤버 조회
   * @async
   * @param {string} groupId - 그룹 ID
   * @returns {Promise<any[]>} 대기 중인 멤버 리스트
   */
  async getPendingMembers(groupId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`/groups/${groupId}/pending-members`);
    return response.data;
  },

  /**
   * 멤버 승인
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {string} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  async approveMember(groupId: string, userId: string): Promise<void> {
    await apiClient.put(`/groups/${groupId}/members/${userId}/approve`);
  },

  /**
   * 멤버 거절
   * @async
   * @param {string} groupId - 그룹 ID
   * @param {string} userId - 사용자 ID
   * @param {string} [reason] - 거절 사유
   * @returns {Promise<void>}
   */
  async rejectMember(groupId: string, userId: string, reason?: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/members/${userId}/reject`);
  }
};
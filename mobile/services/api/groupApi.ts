import apiClient from './config';
import { Group, GroupType } from '@shared/types';

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

interface InviteLink {
  inviteLink: string;
}

interface JoinGroupResponse {
  success: boolean;
  requiresApproval: boolean;
  group: {
    id: string;
    name: string;
    type: GroupType;
  };
}

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

export const groupApi = {
  // Get groups
  async getGroups(params?: {
    type?: GroupType;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Group[]> {
    const response = await apiClient.get('/groups', { params });
    return response.data.data;
  },

  // Create a new group
  async createGroup(data: CreateGroupData): Promise<Group> {
    const response = await apiClient.post('/groups', data);
    return response.data.data;
  },

  // Get group by ID
  async getGroupById(groupId: string): Promise<Group> {
    const response = await apiClient.get(`/groups/${groupId}`);
    return response.data.data;
  },

  // Update group
  async updateGroup(groupId: string, data: Partial<CreateGroupData>): Promise<Group> {
    const response = await apiClient.put(`/groups/${groupId}`, data);
    return response.data.data;
  },

  // Delete group
  async deleteGroup(groupId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}`);
  },

  // Join group
  async joinGroup(groupId: string): Promise<void> {
    await apiClient.post(`/groups/${groupId}/join`);
  },

  // Leave group
  async leaveGroup(groupId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/leave`);
  },

  // Get group members
  async getGroupMembers(groupId: string, page = 1, limit = 50): Promise<any[]> {
    const response = await apiClient.get(`/groups/${groupId}/members`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  // Generate invite link
  async generateInviteLink(groupId: string): Promise<string> {
    const response = await apiClient.post(`/groups/${groupId}/invites`);
    return response.data.data.inviteLink;
  },

  // Join group by invite code
  async joinGroupByInvite(inviteCode: string): Promise<JoinGroupResponse> {
    const response = await apiClient.post(`/groups/join/${inviteCode}`);
    return response.data.data;
  },

  // Get group invites
  async getGroupInvites(groupId: string): Promise<GroupInvite[]> {
    const response = await apiClient.get(`/groups/${groupId}/invites`);
    return response.data.data;
  },

  // Revoke invite
  async revokeInvite(inviteId: string): Promise<void> {
    await apiClient.delete(`/groups/invites/${inviteId}`);
  },

  // Invite users to group (by phone numbers)
  async inviteToGroup(groupId: string, phoneNumbers: string[]): Promise<any> {
    const response = await apiClient.post(`/groups/${groupId}/invite`, { phoneNumbers });
    return response.data.data;
  },

  // Update member role
  async updateMemberRole(groupId: string, userId: string, role: 'MEMBER' | 'ADMIN'): Promise<void> {
    await apiClient.put(`/groups/${groupId}/members/${userId}`, { role });
  },

  // Remove member
  async removeMember(groupId: string, userId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/members/${userId}`);
  },

  // Location check-in
  async locationCheckIn(groupId: string, data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    method?: 'GPS' | 'QR_CODE';
  }): Promise<any> {
    const response = await apiClient.post(`/groups/${groupId}/checkin`, data);
    return response.data.data;
  },

  // Get check-ins
  async getCheckIns(groupId: string, page = 1, limit = 20): Promise<any[]> {
    const response = await apiClient.get(`/groups/${groupId}/checkins`, {
      params: { page, limit }
    });
    return response.data.data;
  },

  // Get pending members
  async getPendingMembers(groupId: string): Promise<any[]> {
    const response = await apiClient.get(`/groups/${groupId}/pending-members`);
    return response.data.data;
  },

  // Approve member
  async approveMember(groupId: string, userId: string): Promise<void> {
    await apiClient.put(`/groups/${groupId}/members/${userId}/approve`);
  },

  // Reject member
  async rejectMember(groupId: string, userId: string, reason?: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/members/${userId}/reject`, {
      data: { reason }
    });
  }
};
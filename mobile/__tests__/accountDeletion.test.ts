import { accountDeletionService, AccountDeletionInfo } from '../services/api/accountDeletionService';

// Mock API client
jest.mock('../services/api/config', () => ({
  delete: jest.fn(),
  post: jest.fn(),
  get: jest.fn(),
}));

import apiClient from '../services/api/config';

describe('Account Deletion Service', () => {
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestDeletion', () => {
    it('should successfully request account deletion', async () => {
      const mockResponse = {
        data: {
          data: {
            scheduledDeletionAt: '2024-01-08T00:00:00.000Z',
            daysRemaining: 7,
          },
        },
      };
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.requestDeletion({
        reason: 'not_useful',
      });

      expect(result.success).toBe(true);
      expect(result.scheduledDeletionAt).toBe('2024-01-08T00:00:00.000Z');
      expect(result.daysRemaining).toBe(7);
      expect(mockApiClient.delete).toHaveBeenCalledWith('/users/account', {
        data: { reason: 'not_useful' },
      });
    });

    it('should handle API error during deletion request', async () => {
      const mockError = {
        response: {
          data: {
            message: '이미 삭제 요청된 계정입니다.',
          },
        },
      };
      mockApiClient.delete.mockRejectedValue(mockError);

      const result = await accountDeletionService.requestDeletion({
        reason: 'not_useful',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('이미 삭제 요청된 계정입니다.');
    });

    it('should handle network error during deletion request', async () => {
      mockApiClient.delete.mockRejectedValue(new Error('Network Error'));

      const result = await accountDeletionService.requestDeletion({
        reason: 'privacy_concern',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('계정 삭제 요청에 실패했습니다.');
    });
  });

  describe('restoreAccount', () => {
    it('should successfully restore account', async () => {
      const mockResponse = {
        data: {
          success: true,
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.restoreAccount();

      expect(result.success).toBe(true);
      expect(result.message).toBe('계정이 성공적으로 복구되었습니다.');
      expect(mockApiClient.post).toHaveBeenCalledWith('/users/account/restore');
    });

    it('should handle restore failure when grace period expired', async () => {
      const mockError = {
        response: {
          data: {
            message: '복구 기간이 만료되었습니다. (7일 초과)',
          },
        },
      };
      mockApiClient.post.mockRejectedValue(mockError);

      const result = await accountDeletionService.restoreAccount();

      expect(result.success).toBe(false);
      expect(result.message).toBe('복구 기간이 만료되었습니다. (7일 초과)');
    });
  });

  describe('getDeletionStatus', () => {
    it('should return active account status', async () => {
      const mockStatus: AccountDeletionInfo = {
        status: 'ACTIVE',
      };
      const mockResponse = {
        data: {
          data: mockStatus,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.getDeletionStatus();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('ACTIVE');
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/account/deletion-status');
    });

    it('should return deletion requested status with remaining days', async () => {
      const mockStatus: AccountDeletionInfo = {
        status: 'DELETION_REQUESTED',
        requestedAt: new Date('2024-01-01T00:00:00.000Z'),
        scheduledDeletionAt: new Date('2024-01-08T00:00:00.000Z'),
        daysRemaining: 5,
        reason: 'not_useful',
      };
      const mockResponse = {
        data: {
          data: mockStatus,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.getDeletionStatus();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('DELETION_REQUESTED');
      expect(result.data?.daysRemaining).toBe(5);
      expect(result.data?.reason).toBe('not_useful');
    });

    it('should handle error when fetching deletion status', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Server Error'));

      const result = await accountDeletionService.getDeletionStatus();

      expect(result.success).toBe(false);
      expect(result.message).toBe('삭제 상태 조회에 실패했습니다.');
    });
  });

  describe('isPendingDeletion', () => {
    it('should return true for pending deletion', async () => {
      const mockResponse = {
        data: {
          data: {
            isPendingDeletion: true,
          },
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.isPendingDeletion();

      expect(result.success).toBe(true);
      expect(result.isPendingDeletion).toBe(true);
      expect(mockApiClient.get).toHaveBeenCalledWith('/users/account/pending-deletion');
    });

    it('should return false for active account', async () => {
      const mockResponse = {
        data: {
          data: {
            isPendingDeletion: false,
          },
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await accountDeletionService.isPendingDeletion();

      expect(result.success).toBe(true);
      expect(result.isPendingDeletion).toBe(false);
    });

    it('should handle network error', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network Error'));

      const result = await accountDeletionService.isPendingDeletion();

      expect(result.success).toBe(false);
      expect(result.message).toBe('삭제 상태 확인에 실패했습니다.');
    });
  });
});
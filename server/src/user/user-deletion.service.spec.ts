import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserDeletionService } from './user-deletion.service';
import { PrismaService } from '../core/prisma/prisma.service';
import { CacheService } from '../core/cache/cache.service';
import { DeletionStatus } from './dto/delete-account.dto';

describe('UserDeletionService', () => {
  let service: UserDeletionService;
  let prismaService: PrismaService;
  let cacheService: CacheService;

  const mockUser = {
    id: 'user-1',
    nickname: 'testuser',
    phoneNumber: '+821234567890',
    deletedAt: null,
    deletionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    match: {
      updateMany: jest.fn(),
    },
    story: {
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    groupMember: {
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    userLike: {
      deleteMany: jest.fn(),
    },
    chatMessage: {
      updateMany: jest.fn(),
    },
    payment: {
      updateMany: jest.fn(),
    },
    subscription: {
      updateMany: jest.fn(),
    },
    fcmToken: {
      deleteMany: jest.fn(),
    },
    userDeviceToken: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockCacheService = {
    invalidateUserCache: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserDeletionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<UserDeletionService>(UserDeletionService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestAccountDeletion', () => {
    it('should successfully request account deletion', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
        deletionReason: 'not_useful',
      });
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));
      mockPrismaService.match.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.story.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.requestAccountDeletion('user-1', 'not_useful');

      expect(result.success).toBe(true);
      expect(result.daysRemaining).toBe(7);
      expect(result.scheduledDeletionAt).toBeInstanceOf(Date);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          deletionReason: 'not_useful',
          deletedAt: expect.any(Date),
        },
      });
      expect(mockCacheService.invalidateUserCache).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.requestAccountDeletion('non-existent-user'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw BadRequestException for already deleted account', async () => {
      const deletedUser = {
        ...mockUser,
        deletedAt: new Date(),
        deletionReason: 'test',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(deletedUser);

      await expect(service.requestAccountDeletion('user-1'))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('restoreAccount', () => {
    it('should successfully restore account within grace period', async () => {
      const recentlyDeletedUser = {
        ...mockUser,
        deletedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        deletionReason: 'not_useful',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(recentlyDeletedUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));
      mockPrismaService.match.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.story.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.restoreAccount('user-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          deletedAt: null,
          deletionReason: null,
        },
      });
      expect(mockCacheService.invalidateUserCache).toHaveBeenCalledWith('user-1');
    });

    it('should throw BadRequestException when grace period expired', async () => {
      const oldDeletedUser = {
        ...mockUser,
        deletedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        deletionReason: 'not_useful',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(oldDeletedUser);

      await expect(service.restoreAccount('user-1'))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-deleted account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.restoreAccount('user-1'))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('permanentlyDeleteAccount', () => {
    it('should permanently delete account after grace period', async () => {
      const expiredUser = {
        ...mockUser,
        deletedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        groupMemberships: [],
        sentLikes: [],
        receivedLikes: [],
        matches1: [],
        matches2: [],
        sentMessages: [],
        stories: [],
        payments: [],
        subscriptions: [],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(expiredUser);
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));

      // Mock all transaction operations
      mockPrismaService.fcmToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.userDeviceToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.chatMessage.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.story.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.userLike.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.match.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.groupMember.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.payment.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.subscription.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.user.delete.mockResolvedValue(expiredUser);

      const result = await service.permanentlyDeleteAccount('user-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(mockCacheService.invalidateUserCache).toHaveBeenCalledWith('user-1');
    });

    it('should force delete account when force flag is true', async () => {
      const recentlyDeletedUser = {
        ...mockUser,
        deletedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        groupMemberships: [],
        sentLikes: [],
        receivedLikes: [],
        matches1: [],
        matches2: [],
        sentMessages: [],
        stories: [],
        payments: [],
        subscriptions: [],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(recentlyDeletedUser);
      mockPrismaService.$transaction.mockImplementation((callback) => callback(mockPrismaService));
      mockPrismaService.user.delete.mockResolvedValue(recentlyDeletedUser);

      const result = await service.permanentlyDeleteAccount('user-1', true);

      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException when grace period not expired without force', async () => {
      const recentlyDeletedUser = {
        ...mockUser,
        deletedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      };
      mockPrismaService.user.findUnique.mockResolvedValue(recentlyDeletedUser);

      await expect(service.permanentlyDeleteAccount('user-1', false))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('getAccountDeletionStatus', () => {
    it('should return ACTIVE status for non-deleted account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        deletedAt: null,
        deletionReason: null,
      });

      const status = await service.getAccountDeletionStatus('user-1');

      expect(status.status).toBe(DeletionStatus.ACTIVE);
      expect(status.requestedAt).toBeUndefined();
    });

    it('should return DELETION_REQUESTED status with correct remaining days', async () => {
      const deletionDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      mockPrismaService.user.findUnique.mockResolvedValue({
        deletedAt: deletionDate,
        deletionReason: 'not_useful',
      });

      const status = await service.getAccountDeletionStatus('user-1');

      expect(status.status).toBe(DeletionStatus.DELETION_REQUESTED);
      expect(status.requestedAt).toEqual(deletionDate);
      expect(status.daysRemaining).toBe(4); // 7 - 3 = 4 days remaining
      expect(status.reason).toBe('not_useful');
    });
  });

  describe('getAccountsScheduledForDeletion', () => {
    it('should return users scheduled for deletion', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'user-1' },
        { id: 'user-2' },
      ]);

      const result = await service.getAccountsScheduledForDeletion();

      expect(result).toEqual(['user-1', 'user-2']);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: {
            lt: expect.any(Date),
          },
        },
        select: { id: true },
      });
    });
  });

  describe('isAccountPendingDeletion', () => {
    it('should return true for pending deletion account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        deletedAt: new Date(),
      });

      const result = await service.isAccountPendingDeletion('user-1');

      expect(result).toBe(true);
    });

    it('should return false for active account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        deletedAt: null,
      });

      const result = await service.isAccountPendingDeletion('user-1');

      expect(result).toBe(false);
    });
  });
});
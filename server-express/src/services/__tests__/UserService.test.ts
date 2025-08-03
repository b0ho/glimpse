import { UserService } from '../UserService';
import { prismaMock } from '../../__tests__/setup';
import { createMockUser } from '../../__tests__/setup';
import { createError } from '../../middleware/errorHandler';

jest.mock('../NotificationService', () => ({
  notificationService: {
    sendNotification: jest.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('getUserByPhoneNumber', () => {
    it('should return user when found', async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserByPhoneNumber('010-1234-5678');

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { phoneNumber: '010-1234-5678' },
      });
    });

    it('should return null when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserByPhoneNumber('010-9999-9999');

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getUserById('test-user-id');

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
      });
    });

    it('should throw error when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(userService.getUserById('non-existent')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        clerkId: 'clerk-123',
        phoneNumber: '010-1234-5678',
        nickname: 'TestUser',
        age: 25,
        gender: 'MALE' as const,
      };

      const mockUser = createMockUser(userData);
      prismaMock.user.findUnique.mockResolvedValue(null); // No existing user
      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(userData);

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          credits: 1, // Free daily credit
        },
      });
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        clerkId: 'clerk-123',
        phoneNumber: '010-1234-5678',
        nickname: 'TestUser',
        age: 25,
        gender: 'MALE' as const,
      };

      const existingUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      await expect(userService.createUser(userData)).rejects.toThrow(
        '이미 가입된 전화번호입니다.'
      );
    });

    it('should validate age range', async () => {
      const userData = {
        clerkId: 'clerk-123',
        phoneNumber: '010-1234-5678',
        nickname: 'TestUser',
        age: 17, // Too young
        gender: 'MALE' as const,
      };

      await expect(userService.createUser(userData)).rejects.toThrow(
        'Age must be between 18 and 100'
      );
    });
  });

  describe('updateUser', () => {
    it('should update user profile', async () => {
      const userId = 'test-user-id';
      const updateData = {
        nickname: 'UpdatedNickname',
        bio: 'Updated bio',
        age: 30,
      };

      const mockUser = createMockUser(updateData);
      prismaMock.user.update.mockResolvedValue(mockUser);

      const result = await userService.updateUser(userId, updateData);

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
    });

    it('should throw error on database failure', async () => {
      prismaMock.user.update.mockRejectedValue(new Error('Database error'));

      await expect(
        userService.updateUser('user-id', { nickname: 'Test' })
      ).rejects.toThrow('Database error');
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user', async () => {
      const userId = 'test-user-id';
      const deletedUser = createMockUser({
        deletedAt: new Date(),
        nickname: 'deleted_user',
        anonymousId: expect.stringMatching(/^deleted_/),
      });

      prismaMock.user.update.mockResolvedValue(deletedUser);

      const result = await userService.deleteUser(userId);

      expect(result).toEqual({ message: '회원 탈퇴가 완료되었습니다.' });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          deletedAt: expect.any(Date),
          nickname: 'deleted_user',
          anonymousId: expect.stringMatching(/^deleted_/),
          phoneNumber: null,
          profileImage: null,
          bio: null,
        },
      });
    });
  });

  describe('purchaseCredits', () => {
    it('should add credits to user account', async () => {
      const userId = 'test-user-id';
      const creditAmount = 10;
      
      const mockUser = createMockUser({ credits: 5 });
      const updatedUser = { ...mockUser, credits: 15 };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await userService.purchaseCredits(userId, creditAmount);

      expect(result).toEqual(updatedUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { credits: { increment: creditAmount } },
      });
    });

    it('should throw error if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        userService.purchaseCredits('non-existent', 10)
      ).rejects.toThrow('User not found');
    });
  });

  describe('checkDailyCredit', () => {
    it('should give daily credit if not received today', async () => {
      const userId = 'test-user-id';
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const mockUser = createMockUser({ credits: 0, lastDailyCredit: yesterday });
      const updatedUser = { ...mockUser, credits: 1, lastDailyCredit: new Date() };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await userService.checkDailyCredit(userId);

      expect(result).toEqual(updatedUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          credits: { increment: 1 },
          lastDailyCredit: expect.any(Date),
        },
      });
    });

    it('should not give credit if already received today', async () => {
      const userId = 'test-user-id';
      const today = new Date();

      const mockUser = createMockUser({ credits: 5, lastDailyCredit: today });
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.checkDailyCredit(userId);

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  describe('premium features', () => {
    it('should upgrade user to premium', async () => {
      const userId = 'test-user-id';
      const premiumUntil = new Date();
      premiumUntil.setMonth(premiumUntil.getMonth() + 1);

      const updatedUser = createMockUser({
        isPremium: true,
        premiumUntil,
      });

      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await userService.upgradeToPremium(userId, 'MONTHLY');

      expect(result).toEqual(updatedUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          isPremium: true,
          premiumUntil: expect.any(Date),
        },
      });
    });

    it('should cancel premium subscription', async () => {
      const userId = 'test-user-id';
      const updatedUser = createMockUser({
        isPremium: false,
        premiumUntil: null,
      });

      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await userService.cancelPremium(userId);

      expect(result).toEqual(updatedUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          isPremium: false,
          premiumUntil: null,
        },
      });
    });
  });
});
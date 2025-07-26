import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../../store/slices/authSlice';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('authSlice', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.clearAuth();
    });
    jest.clearAllMocks();
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should set user and token successfully', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: 'user123',
      clerkId: 'clerk123',
      phoneNumber: '+821012345678',
      nickname: 'TestUser',
      age: 25,
      gender: 'MALE' as const,
      bio: 'Test bio',
      profileImage: null,
      isVerified: true,
      credits: 5,
      isPremium: false,
      premiumUntil: null,
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    act(() => {
      result.current.setToken('test-token');
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('test-token');
    expect(result.current.isAuthenticated).toBe(true);
    // SecureStore is handled by persist middleware
  });

  it('should clear auth', async () => {
    const { result } = renderHook(() => useAuthStore());

    // First login
    act(() => {
      result.current.setToken('test-token');
      result.current.setUser({ id: 'user123' } as any);
    });

    // Then logout
    act(() => {
      result.current.clearAuth();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    // SecureStore is handled by persist middleware
  });


  it('should update user profile', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const initialUser = {
      id: 'user123',
      nickname: 'OldName',
      bio: 'Old bio',
    } as any;

    act(() => {
      result.current.setUser(initialUser);
    });

    const updates = {
      nickname: 'NewName',
      bio: 'New bio',
    };

    act(() => {
      result.current.updateUser(updates);
    });

    expect(result.current.user).toEqual({
      ...initialUser,
      ...updates,
    });
  });

  it('should handle loading state', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });
});
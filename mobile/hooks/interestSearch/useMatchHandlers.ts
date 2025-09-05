/**
 * 매칭 관련 핸들러 관리 훅
 */
import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useInterestStore } from '@/store/slices/interestSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';

export const useMatchHandlers = () => {
  const navigation = useNavigation<any>();
  const { fetchMatches } = useInterestStore();
  const { user } = useAuthStore();
  
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  const handleReportMismatch = useCallback(async (item: any) => {
    const showMismatchConfirmToast = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const confirmed = window.confirm('미스매치 신고\n\n상대방이 등록한 정보가 일치하지 않나요?\n신고하면 관리자가 검토 후 조치합니다.');
          resolve(confirmed);
        } else {
          Alert.alert(
            '미스매치 신고',
            '상대방이 등록한 정보가 일치하지 않나요?\n신고하면 관리자가 검토 후 조치합니다.',
            [
              { text: '취소', style: 'cancel', onPress: () => resolve(false) },
              { text: '신고', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        }
      });
    };

    const confirmed = await showMismatchConfirmToast();
    
    if (confirmed) {
      try {
        const storedMatches = await AsyncStorage.getItem('interest-matches');
        if (storedMatches) {
          const matches = JSON.parse(storedMatches);
          const updatedMatches = matches.map((m: any) => 
            m.id === item.id 
              ? { ...m, status: 'MISMATCH', mismatchedAt: new Date().toISOString() }
              : m
          );
          await AsyncStorage.setItem('interest-matches', JSON.stringify(updatedMatches));
          await fetchMatches();
          
          Toast.show({
            type: 'success',
            text1: '신고 완료',
            text2: '미스매치가 신고되었습니다',
            position: 'bottom',
            visibilityTime: 3000,
          });
        }
      } catch (error) {
        console.error('Failed to report mismatch:', error);
        Toast.show({
          type: 'error',
          text1: '신고 실패',
          text2: '신고 처리 중 오류가 발생했습니다',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    }
  }, [fetchMatches]);

  const handleChatPress = useCallback(async (item: any) => {
    const newChatRoom = {
      id: `interest-${item.searchId || item.id}`,
      matchId: item.matchedUserId || item.matchedUser?.id,
      otherUserNickname: item.matchedUser?.nickname || '익명',
      lastMessage: '채팅을 시작해보세요!',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      isOnline: false,
    };
    
    try {
      const existingRoomsStr = await AsyncStorage.getItem('chat-rooms');
      const existingRooms = existingRoomsStr ? JSON.parse(existingRoomsStr) : [];
      
      // 중복 체크
      const existingRoom = existingRooms.find((room: any) => room.id === newChatRoom.id);
      if (!existingRoom) {
        existingRooms.push(newChatRoom);
        await AsyncStorage.setItem('chat-rooms', JSON.stringify(existingRooms));
      }
      
      // 채팅 화면으로 이동
      navigation.navigate('Chat', {
        roomId: newChatRoom.id,
        matchId: newChatRoom.matchId,
        otherUserNickname: newChatRoom.otherUserNickname,
      });
    } catch (error) {
      console.error('Failed to save chat room:', error);
    }
  }, [navigation]);

  const handleShareStory = useCallback((match: any) => {
    setSelectedMatch(match);
    setStoryModalVisible(true);
  }, []);

  const handleSaveSuccessStory = useCallback(async (story: string, tags: string[], isAnonymous: boolean) => {
    try {
      const existingStoriesStr = await AsyncStorage.getItem('success-stories');
      const existingStories = existingStoriesStr ? JSON.parse(existingStoriesStr) : [];
      
      const newStory = {
        id: `story-${Date.now()}`,
        userId: user?.id,
        partnerId: selectedMatch.matchedUserId || selectedMatch.matchedUser?.id,
        userNickname: user?.nickname || '나',
        partnerNickname: selectedMatch.matchedUser?.nickname || '익명',
        story,
        tags,
        celebrationCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAnonymous,
        matchType: selectedMatch.matchType,
      };
      
      existingStories.unshift(newStory);
      await AsyncStorage.setItem('success-stories', JSON.stringify(existingStories));
      
      setStoryModalVisible(false);
      setSelectedMatch(null);
    } catch (error) {
      console.error('Failed to save success story:', error);
      throw error;
    }
  }, [selectedMatch, user]);

  const handleDeleteMatch = useCallback(async (matchId: string, matches: any[]) => {
    const showDeleteMatchConfirmToast = (): Promise<'delete' | 'story' | 'cancel'> => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const action = window.confirm('매칭 이력을 삭제하시겠습니까?\n\n확인: 삭제\n취소: 성공 스토리 공유');
          resolve(action ? 'delete' : 'story');
        } else {
          Alert.alert(
            '선택하세요',
            '',
            [
              {
                text: '삭제',
                style: 'destructive',
                onPress: () => resolve('delete'),
              },
              {
                text: '성공 스토리 공유',
                onPress: () => resolve('story'),
              },
              { text: '취소', style: 'cancel', onPress: () => resolve('cancel') },
            ],
          );
        }
      });
    };

    const showFinalDeleteConfirm = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const confirmed = window.confirm('매칭 이력 삭제\n\n이 매칭 이력을 삭제하시겠습니까?');
          resolve(confirmed);
        } else {
          Alert.alert(
            '매칭 이력 삭제',
            '이 매칭 이력을 삭제하시겠습니까?',
            [
              { text: '취소', style: 'cancel', onPress: () => resolve(false) },
              { text: '삭제', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        }
      });
    };

    const action = await showDeleteMatchConfirmToast();
    
    if (action === 'delete') {
      const finalConfirm = await showFinalDeleteConfirm();
      if (finalConfirm) {
        try {
          const storedMatches = await AsyncStorage.getItem('interest-matches');
          if (storedMatches) {
            const matchesData = JSON.parse(storedMatches);
            const updatedMatches = matchesData.filter((m: any) => m.id !== matchId);
            await AsyncStorage.setItem('interest-matches', JSON.stringify(updatedMatches));
            await fetchMatches();
            
            Toast.show({
              type: 'success',
              text1: '삭제 완료',
              text2: '매칭 이력이 삭제되었습니다',
              position: 'bottom',
              visibilityTime: 3000,
            });
          }
        } catch (error) {
          console.error('Failed to delete match:', error);
          Toast.show({
            type: 'error',
            text1: '삭제 실패',
            text2: '삭제 중 오류가 발생했습니다',
            position: 'bottom',
            visibilityTime: 3000,
          });
        }
      }
    } else if (action === 'story') {
      const match = matches.find(m => m.id === matchId);
      if (match) handleShareStory(match);
    }
  }, [fetchMatches, handleShareStory]);

  return {
    storyModalVisible,
    selectedMatch,
    setStoryModalVisible,
    handleReportMismatch,
    handleChatPress,
    handleShareStory,
    handleSaveSuccessStory,
    handleDeleteMatch,
  };
};
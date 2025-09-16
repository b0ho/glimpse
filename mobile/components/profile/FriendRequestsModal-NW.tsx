import React, { useEffect } from 'react';
import {
  View,
  Text
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { useProfileStore } from '@/store/slices/profileSlice';
import { useTheme } from '@/hooks/useTheme';
import { FriendRequest } from '../../shared/types';

/**
 * FriendRequestsModal 컴포넌트 Props
 * @interface FriendRequestsModalProps
 */
interface FriendRequestsModalProps {
  /** 모달 표시 여부 */
  visible: boolean;
  /** 닫기 핸들러 */
  onClose: () => void;
}

/**
 * 친구 요청 모달 컴포넌트 - 받은 친구 요청 관리
 * @component
 * @param {FriendRequestsModalProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 친구 요청 모달 UI
 * @description 받은 친구 요청을 표시하고 수락/거절할 수 있는 모달 컴포넌트
 */
export const FriendRequestsModal = ({
  visible,
  onClose,
}) => {
  const { 
    friendRequests, 
    fetchFriendRequests, 
    acceptFriendRequest,
    rejectFriendRequest,
    loading 
  } = useProfileStore();
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) {
      fetchFriendRequests();
    }
  }, [visible]);

  /**
   * 친구 요청 수락 핸들러
   * @param {string} requestId - 요청 ID
   * @returns {Promise<void>}
   */
  const handleAccept = async (requestId: string) => {
    Alert.alert(
      '친구 요청 수락',
      '이 친구 요청을 수락하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '수락',
          onPress: async () => {
            const success = await acceptFriendRequest(requestId);
            if (success) {
              Alert.alert('성공', '친구 요청을 수락했습니다.');
            } else {
              Alert.alert('오류', '친구 요청 수락에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  /**
   * 친구 요청 거절 핸들러
   * @param {string} requestId - 요청 ID
   * @returns {Promise<void>}
   */
  const handleReject = async (requestId: string) => {
    Alert.alert(
      '친구 요청 거절',
      '이 친구 요청을 거절하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거절',
          style: 'destructive',
          onPress: async () => {
            const success = await rejectFriendRequest(requestId);
            if (success) {
              Alert.alert('완료', '친구 요청을 거절했습니다.');
            } else {
              Alert.alert('오류', '친구 요청 거절에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  /**
   * 친구 요청 아이템 렌더링
   * @param {Object} params - 리스트 아이템 파라미터
   * @param {FriendRequest} params.item - 친구 요청 객체
   * @returns {JSX.Element} 친구 요청 아이템 UI
   */
  const renderRequestItem = ({ item }: { item: FriendRequest }) => {
    const timeAgo = getTimeAgo(new Date(item.createdAt));
    
    return (
      <View className="requestItem">
        <Image
          source={item.fromUser?.profileImage 
            ? { uri: item.fromUser.profileImage }
            : require('@/assets/default-profile.png')
          }
          className="profileImage"
        />
        
        <View className="requestInfo">
          <Text className="nickname">
            {item.fromUser?.nickname || '익명'}
          </Text>
          <Text className="message">
            {item.message || '친구가 되고 싶어요!'}
          </Text>
          <Text className="timeAgo">{timeAgo}</Text>
        </View>
        
        <View className="actionButtons">
          <TouchableOpacity 
            className="actionButton acceptButton"
            onPress={() => handleAccept(item.id)}
          >
            <MaterialCommunityIcons name="check" size={20} color={colors.TEXT.WHITE} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="actionButton rejectButton"
            onPress={() => handleReject(item.id)}
          >
            <MaterialCommunityIcons name="close" size={20} color={colors.TEXT.WHITE} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * 시간 차이 계산
   * @param {Date} date - 날짜 객체
   * @returns {string} 시간 차이 문자열
   */
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return '방금 전';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}주 전`;
    const months = Math.floor(days / 30);
    return `${months}개월 전`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="modalOverlay">
        <View className="modalContent">
          <View className="header">
            <Text className="title">친구 요청</Text>
            <TouchableOpacity onPress={onClose} className="closeButton">
              <MaterialCommunityIcons name="close" size={24} color={colors.TEXT.PRIMARY} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View className="loadingContainer">
              <ActivityIndicator size="large" color={colors.PRIMARY} />
            </View>
          ) : friendRequests && friendRequests.length > 0 ? (
            <>
              <Text className="subtitle">
                {friendRequests.length}개의 새로운 친구 요청
              </Text>
              
              <FlatList
                data={friendRequests}
                renderItem={renderRequestItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : (
            <View className="emptyContainer">
              <MaterialCommunityIcons name="account-question-outline" size={64} color={colors.TEXT.LIGHT} />
              <Text className="emptyText">친구 요청이 없습니다</Text>
              <Text className="emptySubtext">
                커뮤니티 모드에서 새로운 친구를 만나보세요!
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};


import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { FriendRequest } from '@shared/types';

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
      <View style={[styles.requestItem, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
        <Image
          source={item.fromUser?.profileImage 
            ? { uri: item.fromUser.profileImage }
            : require('@/assets/default-profile.png')
          }
          style={styles.profileImage}
        />
        
        <View style={styles.requestInfo}>
          <Text style={[styles.nickname, { color: colors.TEXT.PRIMARY }]}>
            {item.fromUser?.nickname || '익명'}
          </Text>
          <Text style={[styles.message, { color: colors.TEXT.SECONDARY }]}>
            {item.message || '친구가 되고 싶어요!'}
          </Text>
          <Text style={[styles.timeAgo, { color: colors.TEXT.LIGHT }]}>{timeAgo}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.SUCCESS }]}
            onPress={() => handleAccept(item.id)}
          >
            <MaterialCommunityIcons name="check" size={20} color={colors.TEXT.WHITE} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton, { backgroundColor: colors.ERROR }]}
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
      <View style={[styles.modalOverlay, { backgroundColor: colors.OVERLAY || 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.BACKGROUND }]}>
          <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
            <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>친구 요청</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={colors.TEXT.PRIMARY} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.PRIMARY} />
            </View>
          ) : friendRequests && friendRequests.length > 0 ? (
            <>
              <Text style={[styles.subtitle, { color: colors.TEXT.SECONDARY }]}>
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
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-question-outline" size={64} color={colors.TEXT.LIGHT} />
              <Text style={[styles.emptyText, { color: colors.TEXT.PRIMARY }]}>친구 요청이 없습니다</Text>
              <Text style={[styles.emptySubtext, { color: colors.TEXT.SECONDARY }]}>
                커뮤니티 모드에서 새로운 친구를 만나보세요!
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: SPACING.LG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.LG,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: SPACING.XS,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    textAlign: 'center',
    marginVertical: SPACING.MD,
  },
  listContainer: {
    paddingHorizontal: SPACING.LG,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.MD,
  },
  requestInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: FONT_SIZES.SM,
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: FONT_SIZES.XS,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.XS,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    // Applied dynamically in component
  },
  rejectButton: {
    // Applied dynamically in component
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.MD,
    textAlign: 'center',
    lineHeight: 22,
  },
});
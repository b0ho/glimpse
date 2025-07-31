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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { useProfileStore } from '@/store/slices/profileSlice';
import { FriendRequest } from '@shared/types';

interface FriendRequestsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FriendRequestsModal: React.FC<FriendRequestsModalProps> = ({
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

  useEffect(() => {
    if (visible) {
      fetchFriendRequests();
    }
  }, [visible]);

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

  const renderRequestItem = ({ item }: { item: FriendRequest }) => {
    const timeAgo = getTimeAgo(new Date(item.createdAt));
    
    return (
      <View style={styles.requestItem}>
        <Image
          source={item.fromUser?.profileImage 
            ? { uri: item.fromUser.profileImage }
            : require('@/assets/default-profile.png')
          }
          style={styles.profileImage}
        />
        
        <View style={styles.requestInfo}>
          <Text style={styles.nickname}>
            {item.fromUser?.nickname || '익명'}
          </Text>
          <Text style={styles.message}>
            {item.message || '친구가 되고 싶어요!'}
          </Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAccept(item.id)}
          >
            <MaterialCommunityIcons name="check" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
          >
            <MaterialCommunityIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>친구 요청</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.TEXT.PRIMARY} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            </View>
          ) : friendRequests && friendRequests.length > 0 ? (
            <>
              <Text style={styles.subtitle}>
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
              <MaterialCommunityIcons name="account-question-outline" size={64} color={COLORS.TEXT.LIGHT} />
              <Text style={styles.emptyText}>친구 요청이 없습니다</Text>
              <Text style={styles.emptySubtext}>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.BACKGROUND,
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
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  closeButton: {
    padding: SPACING.XS,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginVertical: SPACING.MD,
  },
  listContainer: {
    paddingHorizontal: SPACING.LG,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
    shadowColor: '#000',
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
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  message: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
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
    backgroundColor: COLORS.SUCCESS,
  },
  rejectButton: {
    backgroundColor: COLORS.ERROR,
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
    color: COLORS.TEXT.PRIMARY,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
});
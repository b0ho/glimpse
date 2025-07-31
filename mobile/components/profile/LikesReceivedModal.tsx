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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { useProfileStore } from '@/store/slices/profileSlice';
import { Like } from '@shared/types';

interface LikesReceivedModalProps {
  visible: boolean;
  onClose: () => void;
  onLikePress: (like: Like) => void;
}

export const LikesReceivedModal: React.FC<LikesReceivedModalProps> = ({
  visible,
  onClose,
  onLikePress,
}) => {
  const { likesReceived, fetchLikesReceived, loading } = useProfileStore();

  useEffect(() => {
    if (visible) {
      fetchLikesReceived();
    }
  }, [visible]);

  const renderLikeItem = ({ item }: { item: Like }) => {
    const timeAgo = getTimeAgo(new Date(item.createdAt));
    
    return (
      <TouchableOpacity 
        style={styles.likeItem}
        onPress={() => onLikePress(item)}
      >
        <Image
          source={item.fromUser?.profileImage 
            ? { uri: item.fromUser.profileImage }
            : require('@/assets/default-profile.png')
          }
          style={styles.profileImage}
        />
        
        <View style={styles.likeInfo}>
          <Text style={styles.nickname}>
            {item.fromUser?.nickname || '익명'}
          </Text>
          <Text style={styles.groupName}>
            {item.group?.name || '그룹 정보 없음'}
          </Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
        
        <View style={styles.likeType}>
          {item.isSuper ? (
            <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
          ) : (
            <MaterialCommunityIcons name="heart" size={24} color="#FF4757" />
          )}
        </View>
      </TouchableOpacity>
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
            <Text style={styles.title}>받은 좋아요</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.TEXT.PRIMARY} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            </View>
          ) : likesReceived && likesReceived.length > 0 ? (
            <>
              <Text style={styles.subtitle}>
                {likesReceived.length}명이 당신에게 관심을 보였습니다
              </Text>
              
              <FlatList
                data={likesReceived}
                renderItem={renderLikeItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="heart-off-outline" size={64} color={COLORS.TEXT.LIGHT} />
              <Text style={styles.emptyText}>아직 받은 좋아요가 없습니다</Text>
              <Text style={styles.emptySubtext}>
                그룹에 참여하고 프로필을 완성하면{'\n'}더 많은 관심을 받을 수 있어요!
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
  likeItem: {
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
  likeInfo: {
    flex: 1,
  },
  nickname: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  groupName: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
  },
  likeType: {
    marginLeft: SPACING.SM,
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
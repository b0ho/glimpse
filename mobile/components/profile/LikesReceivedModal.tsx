import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { useProfileStore } from '@/store/slices/profileSlice';
import { useTheme } from '@/hooks/useTheme';
import { Like } from '../../shared/types';

/**
 * LikesReceivedModal 컴포넌트 Props
 * @interface LikesReceivedModalProps
 */
interface LikesReceivedModalProps {
  /** 모달 표시 여부 */
  visible: boolean;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 좋아요 클릭 핸들러 */
  onLikePress: (like: Like) => void;
}

/**
 * 받은 좋아요 모달 컴포넌트 - 내가 받은 좋아요 목록 표시
 * @component
 * @param {LikesReceivedModalProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 받은 좋아요 모달 UI
 * @description 다른 사용자로부터 받은 좋아요 목록을 표시하는 모달 컴포넌트
 */
export const LikesReceivedModal = ({
  visible,
  onClose,
  onLikePress,
}) => {
  const { likesReceived, fetchLikesReceived, loading } = useProfileStore();
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) {
      fetchLikesReceived();
    }
  }, [visible]);

  /**
   * 좋아요 아이템 렌더링
   * @param {Object} params - 리스트 아이템 파라미터
   * @param {Like} params.item - 좋아요 객체
   * @returns {JSX.Element} 좋아요 아이템 UI
   */
  const renderLikeItem = ({ item }: { item: Like }) => {
    const timeAgo = getTimeAgo(new Date(item.createdAt));
    
    return (
      <TouchableOpacity 
        className="likeItem"
        onPress={() => onLikePress(item)}
      >
        <Image
          source={item.fromUser?.profileImage 
            ? { uri: item.fromUser.profileImage }
            : require('@/assets/default-profile.png')
          }
          className="profileImage"
        />
        
        <View className="likeInfo">
          <Text className="nickname">
            {item.fromUser?.nickname || '익명'}
          </Text>
          <Text className="groupName">
            {item.group?.name || '그룹 정보 없음'}
          </Text>
          <Text className="timeAgo">{timeAgo}</Text>
        </View>
        
        <View className="likeType">
          {item.isSuper ? (
            <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
          ) : (
            <MaterialCommunityIcons name="heart" size={24} color="#FF4757" />
          )}
        </View>
      </TouchableOpacity>
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
            <Text className="title">받은 좋아요</Text>
            <TouchableOpacity onPress={onClose} className="closeButton">
              <MaterialCommunityIcons name="close" size={24} color={colors.TEXT.PRIMARY} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View className="loadingContainer">
              <ActivityIndicator size="large" color={colors.PRIMARY} />
            </View>
          ) : likesReceived && likesReceived.length > 0 ? (
            <>
              <Text className="subtitle">
                {likesReceived.length}명이 당신에게 관심을 보였습니다
              </Text>
              
              <FlatList
                data={likesReceived}
                renderItem={renderLikeItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: SPACING.md }}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : (
            <View className="emptyContainer">
              <MaterialCommunityIcons name="heart-off-outline" size={64} color={colors.TEXT.LIGHT} />
              <Text className="emptyText">아직 받은 좋아요가 없습니다</Text>
              <Text className="emptySubtext">
                그룹에 참여하고 프로필을 완성하면{'\n'}더 많은 관심을 받을 수 있어요!
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};


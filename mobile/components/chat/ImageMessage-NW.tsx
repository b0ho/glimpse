import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES } from '../../constants/theme';

/**
 * ImageMessage 컴포넌트 Props
 * @interface ImageMessageProps
 */
interface ImageMessageProps {
  /** 이미지 URL */
  imageUrl: string;
  /** 내 메시지 여부 */
  isOwnMessage?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * 이미지 메시지 컴포넌트 - 채팅 내 이미지 표시
 * @component
 * @param {ImageMessageProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 이미지 메시지 UI
 * @description 채팅에서 이미지를 표시하고 탭 시 전체 화면으로 볼 수 있는 컴포넌트
 */
export const ImageMessage= ({
  imageUrl,
  isOwnMessage = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  /**
   * 이미지 로드 완료 핸들러
   * @returns {void}
   */
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  /**
   * 이미지 로드 오류 핸들러
   * @returns {void}
   */
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  /**
   * 전체 화면 모드 열기
   * @returns {void}
   */
  const openFullScreen = () => {
    setShowFullScreen(true);
  };

  /**
   * 전체 화면 모드 닫기
   * @returns {void}
   */
  const closeFullScreen = () => {
    setShowFullScreen(false);
  };

  return (
    <>
      <TouchableOpacity
        className="container"
        onPress={openFullScreen}
        activeOpacity={0.8}
      >
        {isLoading && (
          <View className="loadingContainer">
            <ActivityIndicator size="small" color={COLORS.gray} />
          </View>
        )}
        
        {hasError ? (
          <View className="errorContainer">
            <Ionicons name="image-outline" size={40} color={COLORS.gray} />
          </View>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            className="image"
            onLoad={handleImageLoad}
            onError={handleImageError}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>

      {/* 전체 화면 모달 */}
      <Modal
        visible={showFullScreen}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreen}
      >
        <TouchableOpacity
          className="fullScreenContainer"
          activeOpacity={1}
          onPress={closeFullScreen}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="fullScreenImageWrapper"
          >
            <Image
              source={{ uri: imageUrl }}
              className="fullScreenImage"
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            className="closeButton"
            onPress={closeFullScreen}
          >
            <Ionicons name="close" size={30} color={COLORS.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};


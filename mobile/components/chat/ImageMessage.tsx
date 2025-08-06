import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
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
        style={[
          styles.container,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
        onPress={openFullScreen}
        activeOpacity={0.8}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.gray} />
          </View>
        )}
        
        {hasError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="image-outline" size={40} color={COLORS.gray} />
          </View>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
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
          style={styles.fullScreenContainer}
          activeOpacity={1}
          onPress={closeFullScreen}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.fullScreenImageWrapper}
          >
            <Image
              source={{ uri: imageUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeFullScreen}
          >
            <Ionicons name="close" size={30} color={COLORS.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    maxWidth: screenWidth * 0.7,
    minWidth: 200,
    minHeight: 150,
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  image: {
    width: '100%',
    minHeight: 150,
    maxHeight: 300,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  errorContainer: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageWrapper: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
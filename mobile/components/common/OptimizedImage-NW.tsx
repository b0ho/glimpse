import React, { useState, useEffect } from 'react';
import {
  Image,
  ImageProps,
  View,
  ActivityIndicator
  Dimensions,
} from 'react-native';

/**
 * OptimizedImage 컴포넌트 Props
 * @interface OptimizedImageProps
 */
interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  /** 이미지 소스 */
  source: {
    /** 기본 이미지 URI */
    uri: string;
    /** 블러 이미지 URI */
    blur?: string;
    /** 썸네일 이미지 URI */
    thumbnail?: string;
    /** 이미지 변형 목록 */
    variants?: Array<{
      /** 크기 이름 */
      size: string;
      /** 이미지 URL */
      url: string;
      /** 이미지 너비 */
      width: number;
    }>;
  };
  /** 이미지 너비 */
  width?: number;
  /** 이미지 높이 */
  height?: number;
  /** 로딩 표시기 표시 여부 */
  showLoading?: boolean;
  /** 블러 효과 활성화 여부 */
  enableBlur?: boolean;
  /** 이미지 품질 */
  quality?: 'low' | 'medium' | 'high' | 'original';
}

const { width: screenWidth } = Dimensions.get('window');

/**
 * 최적화된 이미지 컴포넌트 - 다양한 크기와 품질의 이미지 표시
 * @component
 * @param {OptimizedImageProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 최적화된 이미지 UI
 * @description 화면 크기와 품질 설정에 따라 최적의 이미지 변형을 선택하여 표시
 */
export const OptimizedImage= ({
  source,
  width,
  height,
  showLoading = true,
  enableBlur = true,
  quality = 'medium',
  style,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageUri, setImageUri] = useState<string>('');
  const [blurUri, setBlurUri] = useState<string>('');

  useEffect(() => {
    // Select appropriate image based on quality and screen size
    let selectedUri = source.uri;
    
    if (source.variants && source.variants.length > 0) {
      const targetWidth = width || screenWidth;
      
      // Find the best variant based on target width
      const sortedVariants = [...source.variants].sort((a, b) => a.width - b.width);
      
      for (const variant of sortedVariants) {
        if (variant.width >= targetWidth) {
          selectedUri = variant.url;
          break;
        }
      }
      
      // If no variant is large enough, use the largest one
      if (selectedUri === source.uri && sortedVariants.length > 0) {
        selectedUri = sortedVariants[sortedVariants.length - 1].url;
      }
    }
    
    // Override with quality preference
    if (source.variants) {
      switch (quality) {
        case 'low':
          selectedUri = source.thumbnail || selectedUri;
          break;
        case 'high':
        case 'original':
          const originalVariant = source.variants.find(v => v.size === 'original');
          if (originalVariant) {
            selectedUri = originalVariant.url;
          }
          break;
      }
    }
    
    setImageUri(selectedUri);
    setBlurUri(source.blur || '');
  }, [source, width, quality]);

  /**
   * 이미지 로드 완료 핸들러
   * @returns {void}
   */
  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  /**
   * 이미지 로드 오류 핸들러
   * @returns {void}
   */
  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  /**
   * 이미지 렌더링
   * @returns {JSX.Element} 이미지 UI
   */
  const renderImage = () => {
    if (error) {
      return (
        <View className="placeholder">
          <Image
            source={require('../../assets/images/image-placeholder.png')}
            className="placeholderImage"
            resizeMode="contain"
          />
        </View>
      );
    }

    return (
      <>
        {/* Blur preview while loading */}
        {loading && enableBlur && blurUri && (
          <Image
            source={{ uri: blurUri }}
            className="absolute"
            blurRadius={20}
          />
        )}
        
        {/* Main image */}
        <Image
          {...props}
          source={{ uri: imageUri }}
          style={style}
          onLoad={handleLoad}
          onError={handleError}
        />
        
        {/* Loading indicator */}
        {loading && showLoading && (
          <View className="absolute loadingContainer">
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </>
    );
  };

  return (
    <View className="">
      {renderImage()}
    </View>
  );
};

// Memoized version for lists
export const MemoizedOptimizedImage = React.memo(OptimizedImage);

/**
 * 이미지 미리 로드 훅
 * @param {string[]} urls - 미리 로드할 이미지 URL 목록
 * @returns {void}
 * @description 사용자가 보기 전에 이미지를 미리 로드하여 성능 향상
 */
export const useImagePreload = (urls: string[]) => {
  useEffect(() => {
    urls.forEach(url => {
      if (url) {
        Image.prefetch(url);
      }
    });
  }, [urls]);
};

/**
 * 최적 이미지 URL 가져오기
 * @param {OptimizedImageProps['source']} source - 이미지 소스 객체
 * @param {number} targetWidth - 목표 너비
 * @returns {string} 최적화된 이미지 URL
 * @description 디바이스 해상도와 목표 너비에 따라 최적의 이미지 URL 반환
 */
export const getOptimalImageUrl = (
  source: OptimizedImageProps['source'],
  targetWidth: number
): string => {
  if (!source.variants || source.variants.length === 0) {
    return source.uri;
  }

  const pixelRatio = 2; // Most modern phones have at least 2x pixel density
  const actualWidth = targetWidth * pixelRatio;

  const sortedVariants = [...source.variants].sort((a, b) => a.width - b.width);
  
  for (const variant of sortedVariants) {
    if (variant.width >= actualWidth) {
      return variant.url;
    }
  }
  
  // Return largest if none match
  return sortedVariants[sortedVariants.length - 1].url;
};


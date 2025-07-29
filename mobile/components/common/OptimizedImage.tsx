import React, { useState, useEffect } from 'react';
import {
  Image,
  ImageProps,
  View,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: {
    uri: string;
    blur?: string;
    thumbnail?: string;
    variants?: Array<{
      size: string;
      url: string;
      width: number;
    }>;
  };
  width?: number;
  height?: number;
  showLoading?: boolean;
  enableBlur?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'original';
}

const { width: screenWidth } = Dimensions.get('window');

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
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

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const renderImage = () => {
    if (error) {
      return (
        <View style={[styles.placeholder, style]}>
          <Image
            source={require('../../assets/images/image-placeholder.png')}
            style={styles.placeholderImage}
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
            style={[styles.absolute, style]}
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
          <View style={[styles.absolute, styles.loadingContainer]}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </>
    );
  };

  return (
    <View style={[{ width, height }, style]}>
      {renderImage()}
    </View>
  );
};

// Memoized version for lists
export const MemoizedOptimizedImage = React.memo(OptimizedImage);

// Hook for preloading images
export const useImagePreload = (urls: string[]) => {
  useEffect(() => {
    urls.forEach(url => {
      if (url) {
        Image.prefetch(url);
      }
    });
  }, [urls]);
};

// Utility to get optimal image URL based on device
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

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    width: 50,
    height: 50,
    opacity: 0.5,
  },
});
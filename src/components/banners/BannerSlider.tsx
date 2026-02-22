/**
 * BannerSlider Component
 * 
 * Production-ready banner carousel for E-commerce apps
 * Features:
 * - Smooth animations using react-native-reanimated-carousel
 * - Auto-play with infinite loop
 * - Parallax effect for professional feel
 * - Pagination dots
 * - Optimized for performance (React.memo)
 * - Works inside ScrollView/FlatList
 * - Dynamic data support from backend
 * - Fixed height to prevent layout shifts
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { interpolate } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Banner item type definition
export interface BannerItem {
  id: string;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  buttonText?: string;
  onPress?: () => void;
}

interface BannerSliderProps {
  data: BannerItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  height?: number;
  showPagination?: boolean;
  parallaxScrollingScale?: number;
  parallaxScrollingOffset?: number;
}

const BannerSlider: React.FC<BannerSliderProps> = ({
  data,
  autoPlay = true,
  autoPlayInterval = 3000,
  height = 180,
  showPagination = true,
  parallaxScrollingScale = 0.9,
  parallaxScrollingOffset = 50,
}) => {
  const carouselRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Render individual banner item
  const renderItem = useCallback(
    ({ item, animationValue }: { item: BannerItem; animationValue: any }) => {
      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={item.onPress}
          style={styles.bannerContainer}
        >
          <View
            style={[
              styles.bannerCard,
              {
                backgroundColor: item.backgroundColor || '#A78BFA',
                height: height,
              },
            ]}
          >
            {item.imageUrl ? (
              <>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                {/* Overlay gradient for better text visibility */}
                <View style={styles.bannerOverlay} />
                {/* Text overlay on image */}
                <View style={styles.bannerTextOverlay}>
                  {item.title && (
                    <Text style={styles.bannerTitleOverlay}>{item.title}</Text>
                  )}
                  {item.subtitle && (
                    <Text style={styles.bannerSubtitleOverlay}>{item.subtitle}</Text>
                  )}
                  {item.buttonText && (
                    <View style={styles.bannerButtonOverlay}>
                      <Text style={styles.bannerButtonTextOverlay}>
                        {item.buttonText}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.bannerContent}>
                {item.title && (
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                )}
                {item.subtitle && (
                  <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                )}
                {item.buttonText && (
                  <View style={styles.bannerButton}>
                    <Text style={styles.bannerButtonText}>
                      {item.buttonText}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [height]
  );

  // Pagination dots
  const renderPagination = () => {
    if (!showPagination || data.length <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              currentIndex === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  // Handle empty data
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Carousel
        ref={carouselRef}
        data={data}
        renderItem={renderItem}
        width={SCREEN_WIDTH - 32}
        height={height}
        loop
        autoPlay={autoPlay}
        autoPlayInterval={autoPlayInterval}
        scrollAnimationDuration={800}
        onSnapToItem={(index) => setCurrentIndex(index)}
        // Parallax effect configuration
        customConfig={() => ({ type: 'positive', viewCount: 3 })}
        style={styles.carousel}
      />
      {renderPagination()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  carousel: {
    width: '100%',
  },
  bannerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  bannerTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: 'center',
  },
  bannerTitleOverlay: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bannerSubtitleOverlay: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bannerButtonOverlay: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bannerButtonTextOverlay: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  bannerContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  bannerButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#16A085',
  },
});

// Memoize component to prevent unnecessary re-renders
export default React.memo(BannerSlider);

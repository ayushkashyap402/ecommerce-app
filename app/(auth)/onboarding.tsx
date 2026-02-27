import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';

const slides = [
  {
    id: '1',
    title: 'OutfitGo',
    description: '',
    emoji: '',
    bgColor: '#10B981', // Green
    isLogo: true,
  },
  {
    id: '2',
    title: 'Shop Anytime, Anywhere',
    description: 'Experience seamless shopping 24/7, wherever you are. Your favorite products are just a tap away!',
    illustration: '🛍️',
    bgColor: '#FFFFFF', // White
    textColor: '#1F2937',
    accentColor: '#10B981',
  },
  {
    id: '3',
    title: 'Discover Latest Trends',
    description: 'Browse thousands of trendy outfits and exclusive collections. Find your perfect style today!',
    illustration: '✨',
    bgColor: '#FFFFFF',
    textColor: '#1F2937',
    accentColor: '#10B981',
  },
  {
    id: '4',
    title: 'Fast & Secure Delivery',
    description: 'Safe payments, easy returns, and lightning-fast delivery right to your doorstep. Shop with confidence!',
    illustration: '📦',
    bgColor: '#FFFFFF',
    textColor: '#1F2937',
    accentColor: '#10B981',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Loop back to first slide
      slidesRef.current?.scrollToIndex({ index: 0 });
    }
  };

  const handleGetStarted = async () => {
    // Mark onboarding as completed
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    router.replace('/(auth)/login');
  };

  const handleSkip = async () => {
    // Mark onboarding as completed even when skipped
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    router.replace('/(auth)/login');
  };

  const renderSlide = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.slide, { backgroundColor: item.bgColor }]}
      activeOpacity={1}
      onPress={scrollTo}
    >
      <View style={styles.slideContent}>
        {item.isLogo ? (
          // Logo Slide (First Slide - Splash Screen)
          <>
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Text style={styles.logoText}>Outfit</Text>
                <Text style={[styles.logoText, styles.logoTextAccent]}>Go</Text>
              </View>
            </View>
          </>
        ) : (
          // Fashion Illustration Slides
          <>
            {/* Illustration Area */}
            <View style={styles.illustrationContainer}>
              {/* Decorative Elements */}
              <View style={[styles.decorCircle, styles.decorCircle1, { backgroundColor: item.accentColor + '20' }]} />
              <View style={[styles.decorCircle, styles.decorCircle2, { backgroundColor: item.accentColor + '15' }]} />
              
              {/* Main Illustration */}
              <View style={[styles.illustrationCircle, { borderColor: item.accentColor }]}>
                <Text style={styles.illustrationEmoji}>{item.illustration}</Text>
              </View>

              {/* Fashion Icons */}
              <View style={styles.fashionIcons}>
                <View style={[styles.iconBubble, styles.iconBubble1]}>
                  <Text style={styles.iconText}>👕</Text>
                </View>
                <View style={[styles.iconBubble, styles.iconBubble2]}>
                  <Text style={styles.iconText}>👒</Text>
                </View>
                <View style={[styles.iconBubble, styles.iconBubble3]}>
                  <Text style={styles.iconText}>🛒</Text>
                </View>
              </View>
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: item.textColor }]}>
                {item.title}
              </Text>
              <Text style={[styles.description, { color: item.textColor }]}>
                {item.description}
              </Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  const Paginator = () => {
    const currentSlide = slides[currentIndex];
    const dotColor = currentSlide?.isLogo ? '#FFFFFF' : '#10B981';
    
    return (
      <View style={styles.paginatorContainer}>
        {slides.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 30, 10],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index.toString()}
              style={[
                styles.dot,
                { 
                  width: dotWidth, 
                  opacity,
                  backgroundColor: dotColor,
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  const currentSlide = slides[currentIndex];
  const isLogoSlide = currentSlide?.isLogo;

  return (
    <View style={styles.container}>
      {/* Skip Button - Only show on non-logo slides except last */}
      {!isLogoSlide && currentIndex < slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={slidesRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
      />

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        {/* Paginator */}
        <Paginator />

        {/* Next/Get Started Button */}
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={currentIndex === slides.length - 1 ? handleGetStarted : scrollTo}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? 'Get Started!' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 20,
  },
  skipText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  
  // Logo Slide Styles (First Slide - Splash Screen)
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  logoTextAccent: {
    fontWeight: '300',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  
  // Fashion Illustration Slides
  illustrationContainer: {
    width: width * 0.8,
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  decorCircle1: {
    width: 120,
    height: 120,
    top: 20,
    left: 20,
  },
  decorCircle2: {
    width: 80,
    height: 80,
    bottom: 40,
    right: 30,
  },
  illustrationCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F0FDF4',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  illustrationEmoji: {
    fontSize: 100,
  },
  fashionIcons: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  iconBubble: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconBubble1: {
    top: 30,
    right: 20,
  },
  iconBubble2: {
    top: 120,
    left: 10,
  },
  iconBubble3: {
    bottom: 60,
    right: 40,
  },
  iconText: {
    fontSize: 30,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 140,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#1F2937',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#6B7280',
  },
  
  // Bottom Section
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 50,
    backgroundColor: 'transparent',
  },
  paginatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, StyleSheet, Dimensions, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { addToCart } from '../../src/store/slices/cartSlice';
import { addToWishlist as addToWishlistAction, removeFromWishlist as removeFromWishlistAction, fetchWishlist } from '../../src/store/slices/wishlistSlice';
import { productClient } from '../../src/services/api';
import { Button } from '../../src/components/ui/Button';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { formatCurrency } from '../../src/utils/helpers';
import { useTheme } from '../../src/context/ThemeContext';
import type { Product } from '../../src/types';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { items: wishlistItems } = useAppSelector(state => state.wishlist);
  const theme = useTheme();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Check if product is in wishlist from Redux store
  const isInWishlist = wishlistItems.some(item => item.productId === id);
  
  // Review state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Related products state
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchWishlist(user._id));
    }
  }, [user]);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      const response = await productClient.get(`/${id}`);
      setProduct(response.data);
      if (response.data.sizes && response.data.sizes.length > 0) {
        setSelectedSize(response.data.sizes[0]);
      }
      // Load related products
      loadRelatedProducts(response.data.category);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelatedProducts = async (category: string) => {
    try {
      setIsLoadingRelated(true);
      const response = await productClient.get(`?category=${category}`);
      // Filter out current product and limit to 6 items
      const filtered = response.data
        .filter((p: any) => p._id !== id)
        .slice(0, 6);
      setRelatedProducts(filtered);
    } catch (error) {
      console.error('Error loading related products:', error);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  const handleAddToCart = async () => {
    const userId = (user as any)?.id || user?._id;
    if (!userId) {
      Alert.alert('Login Required', 'Please login to add items to cart');
      return;
    }
    
    if (!product) return;

    try {
      setIsAddingToCart(true);
      await dispatch(addToCart({
        userId,
        productId: product._id,
        quantity,
        size: selectedSize,
      })).unwrap();
      
      Alert.alert(
        'Added to Cart',
        `${product.name} has been added to your cart`,
        [
          { text: 'Continue Shopping', onPress: () => router.back() },
          { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to submit a review');
      return;
    }

    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Comment Required', 'Please write a comment');
      return;
    }

    try {
      setIsSubmittingReview(true);
      await productClient.post(`/${id}/reviews`, {
        rating,
        comment,
        userId: user._id,
        userName: user.name || user.email?.split('@')[0] || 'Anonymous'
      });
      
      Alert.alert('Success', 'Review submitted successfully');
      setRating(0);
      setComment('');
      loadProduct(); // Reload to show new review
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleBuyNow = async () => {
    const userId = (user as any)?.id || user?._id;
    if (!userId) {
      Alert.alert('Login Required', 'Please login to buy products');
      return;
    }
    
    if (!product) return;

    try {
      setIsAddingToCart(true);
      // Add to cart first
      await dispatch(addToCart({
        userId,
        productId: product._id,
        quantity,
        size: selectedSize,
      })).unwrap();
      
      // Navigate to checkout with this product
      router.push(`/checkout?productIds=${product._id}` as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to process order');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    const userId = user?._id || (user as any)?.id;
    
    if (!isAuthenticated || !userId) {
      Alert.alert('Login Required', 'Please login to add items to wishlist');
      return;
    }

    if (!product) return;

    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlistAction({ 
          userId: userId, 
          productId: product._id 
        })).unwrap();
        Alert.alert('Removed from Wishlist', `${product.name} has been removed from your wishlist`);
      } else {
        await dispatch(addToWishlistAction({
          userId: userId,
          productId: product._id,
          productName: product.name,
          productPrice: product.price,
          productImage: product.thumbnailUrl || product.images?.[0] || ''
        })).unwrap();
        Alert.alert('Added to Wishlist', `${product.name} has been added to your wishlist`);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      Alert.alert('Error', 'Failed to update wishlist');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading product..." />;
  }

  if (!product) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Product not found</Text>
      </View>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.thumbnailUrl || 'https://via.placeholder.com/400'];
  const currentImage = images[selectedImageIndex];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* Header */}
      <View style={[
        styles.header, 
        { backgroundColor: theme.isDark ? theme.colors.backgroundSecondary : theme.colors.primary }
      ]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/cart')} 
          style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}
        >
          <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main Product Image */}
        <View style={[styles.imageContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Image
            source={{ uri: currentImage }}
            style={styles.mainImage}
            resizeMode="cover"
          />
        </View>

        {/* Image Thumbnails */}
        {images.length > 1 && (
          <View style={[styles.thumbnailContainer, { backgroundColor: theme.colors.surface }]}>
            <FlatList
              data={images}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => setSelectedImageIndex(index)}
                  style={[
                    styles.thumbnail,
                    selectedImageIndex === index && { borderColor: theme.colors.primary }
                  ]}
                >
                  <Image source={{ uri: item }} style={styles.thumbnailImage} resizeMode="cover" />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.thumbnailList}
            />
          </View>
        )}

        {/* Product Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          {/* Views Count */}
          <View style={[
            styles.viewsContainer,
            { backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }
          ]}>
            <Ionicons name="trending-up" size={16} color="#3B82F6" />
            <Text style={styles.viewsText}>{product.views || 0} people viewed this product</Text>
          </View>

          {/* Product Name */}
          <Text style={[styles.productName, { color: theme.colors.text }]}>{product.name}</Text>

          {/* Rating & Actions */}
          <View style={[styles.ratingRow, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(product.averageRating || 0) ? "star" : "star-outline"}
                  size={18}
                  color="#FCD34D"
                />
              ))}
              <Text style={[styles.reviewText, { color: theme.colors.textSecondary }]}>({product.totalReviews || 0} reviews)</Text>
            </View>
            <View style={styles.actionIcons}>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Ionicons name="location-outline" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Ionicons name="share-social-outline" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Seller Info */}
          <TouchableOpacity 
            style={[
              styles.sellerRow, 
              { backgroundColor: theme.isDark ? theme.colors.backgroundSecondary : '#F9FAFB' }
            ]}
            onPress={() => router.push(`/seller/${product.createdBy}` as any)}
            activeOpacity={0.7}
          >
            <View style={styles.sellerInfo}>
              <Text style={[styles.sellerName, { color: theme.colors.primary }]}>{product.createdByName || 'OutfitGo Store'}</Text>
              <View style={styles.sellerBadge}>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.primary} />
                <Text style={[styles.sellerBadgeText, { color: theme.colors.textSecondary }]}>Verified Seller</Text>
              </View>
            </View>
            <View style={styles.followerInfo}>
              <Text style={[styles.followerCount, { color: theme.colors.text }]}>1.5K</Text>
              <Text style={[styles.followerLabel, { color: theme.colors.textSecondary }]}>Followers</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} style={{ marginTop: 4 }} />
            </View>
          </TouchableOpacity>

          {/* Description */}
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{product.description}</Text>

          {/* Price */}
          <Text style={[styles.price, { color: theme.colors.primary }]}>From {formatCurrency(product.price)}</Text>

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Size</Text>
              <View style={styles.sizesContainer}>
                {product.sizes.map((size: string) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setSelectedSize(size)}
                    style={[
                      styles.sizeButton,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                      selectedSize === size && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                    ]}
                  >
                    <Text
                      style={[
                        styles.sizeText,
                        { color: theme.colors.text },
                        selectedSize === size && { color: '#FFFFFF' }
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quantity</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={[styles.quantityButton, { backgroundColor: theme.colors.primary }]}
              >
                <Ionicons name="remove" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={[styles.quantityText, { color: theme.colors.text }]}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity(quantity + 1)}
                style={[styles.quantityButton, { backgroundColor: theme.colors.primary }]}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <Ionicons 
              name={product.stock > 0 ? "checkmark-circle" : "close-circle"} 
              size={18} 
              color={product.stock > 0 ? theme.colors.primary : "#EF4444"} 
            />
            <Text style={[styles.stockText, product.stock > 0 ? { color: theme.colors.primary } : { color: "#EF4444" }]}>
              {product.stock > 0 ? `${product.stock} items in stock` : 'Out of stock'}
            </Text>
          </View>

          {/* Reviews Section */}
          <View style={[styles.reviewsSection, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.reviewsSectionTitle, { color: theme.colors.text }]}>Customer Reviews</Text>
            
            {/* Average Rating Display */}
            {product.averageRating > 0 && (
              <View style={styles.averageRatingContainer}>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= Math.round(product.averageRating) ? "star" : "star-outline"}
                      size={20}
                      color="#FCD34D"
                    />
                  ))}
                </View>
                <Text style={[styles.averageRatingText, { color: theme.colors.textSecondary }]}>
                  {product.averageRating.toFixed(1)} ({product.totalReviews || 0} reviews)
                </Text>
              </View>
            )}

            {/* Review List */}
            {product.reviews && product.reviews.length > 0 && (
              <View style={styles.reviewsList}>
                {product.reviews.slice(0, 3).map((review: any, index: number) => (
                  <View key={index} style={[styles.reviewItem, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewUserName, { color: theme.colors.text }]}>{review.userName}</Text>
                      <View style={styles.reviewRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= review.rating ? "star" : "star-outline"}
                            size={14}
                            color="#FCD34D"
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={[styles.reviewComment, { color: theme.colors.textSecondary }]}>{review.comment}</Text>
                    <Text style={[styles.reviewDate, { color: theme.colors.textTertiary }]}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Add Review Form */}
            <View style={[styles.addReviewSection, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
              <Text style={[styles.addReviewTitle, { color: theme.colors.text }]}>Write a Review</Text>
              
              {/* Star Rating Input */}
              <View style={styles.ratingInput}>
                <Text style={[styles.ratingInputLabel, { color: theme.colors.textSecondary }]}>Your Rating:</Text>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                      <Ionicons
                        name={star <= rating ? "star" : "star-outline"}
                        size={32}
                        color="#FCD34D"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Comment Input */}
              <TextInput
                style={[styles.commentInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Share your experience with this product..."
                placeholderTextColor={theme.colors.textTertiary}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitReviewButton,
                  { backgroundColor: theme.colors.primary },
                  theme.isDark ? {} : {
                    shadowColor: theme.colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }
                ]}
                onPress={handleSubmitReview}
                disabled={isSubmittingReview}
              >
                <Text style={styles.submitReviewButtonText}>
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <View style={[styles.relatedProductsSection, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.relatedProductsTitle, { color: theme.colors.text }]}>You May Also Like</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedProductsList}
              >
                {relatedProducts.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={[
                      styles.relatedProductCard,
                      { backgroundColor: theme.colors.card },
                      !theme.isDark && {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        elevation: 4,
                      },
                      theme.isDark && {
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }
                    ]}
                    onPress={() => {
                      router.push(`/product/${item._id}`);
                    }}
                  >
                    <Image
                      source={{ uri: item.thumbnailUrl || item.images?.[0] }}
                      style={[styles.relatedProductImage, { backgroundColor: theme.colors.backgroundSecondary }]}
                      resizeMode="cover"
                    />
                    <View style={styles.relatedProductInfo}>
                      <Text style={[styles.relatedProductName, { color: theme.colors.text }]} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={[styles.relatedProductPrice, { color: theme.colors.primary }]}>
                        {formatCurrency(item.price)}
                      </Text>
                      {item.averageRating > 0 && (
                        <View style={styles.relatedProductRating}>
                          <Ionicons name="star" size={12} color="#FCD34D" />
                          <Text style={[styles.relatedProductRatingText, { color: theme.colors.textSecondary }]}>
                            {item.averageRating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[
        styles.footer,
        { 
          backgroundColor: theme.isDark ? '#1F2937' : '#FFFFFF',
          borderTopColor: theme.colors.border 
        },
        theme.isDark ? {} : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }
      ]}>
        <View style={styles.footerButtons}>
          {/* Wishlist Button */}
          <TouchableOpacity 
            style={[
              styles.wishlistButton, 
              { 
                backgroundColor: theme.isDark ? theme.colors.backgroundSecondary : '#FFFFFF',
                borderColor: theme.colors.border 
              }
            ]}
            onPress={handleToggleWishlist}
          >
            <Ionicons 
              name={isInWishlist ? "heart" : "heart-outline"} 
              size={24} 
              color={isInWishlist ? "#EF4444" : theme.colors.text} 
            />
          </TouchableOpacity>

          {/* Add to Cart Button */}
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.addToCartButton, 
              { 
                backgroundColor: theme.isDark ? theme.colors.backgroundSecondary : '#FFFFFF',
                borderColor: theme.colors.primary 
              }
            ]}
            onPress={handleAddToCart}
            disabled={product.stock === 0 || isAddingToCart}
          >
            <Ionicons name="cart-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.addToCartButtonText, { color: theme.colors.primary }]}>Add to Cart</Text>
          </TouchableOpacity>

          {/* Buy Now Button */}
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.buyNowButton,
              { backgroundColor: theme.colors.primary },
              theme.isDark ? {} : {
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }
            ]}
            onPress={handleBuyNow}
            disabled={product.stock === 0 || isAddingToCart}
          >
            <Text style={styles.buyNowButtonText}>
              {isAddingToCart ? 'Processing...' : 'Buy Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#16A085',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  imageContainer: {
    width: width,
    height: width * 1.2,
    backgroundColor: '#F3F4F6',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailContainer: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  thumbnailList: {
    paddingHorizontal: 16,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 24,
    paddingBottom: 100,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  viewsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    marginTop: 4,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A085',
    marginBottom: 6,
  },
  sellerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  followerInfo: {
    alignItems: 'flex-end',
  },
  followerCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  followerLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16A085',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sizesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#16A085',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    minWidth: 40,
    textAlign: 'center',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  wishlistButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addToCartButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#111827',
  },
  addToCartButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  buyNowButton: {
    backgroundColor: '#111827',
  },
  buyNowButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Reviews Section
  reviewsSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reviewsSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  averageRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
  },
  averageRatingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  reviewsList: {
    marginBottom: 24,
  },
  reviewItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  addReviewSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addReviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  ratingInput: {
    marginBottom: 16,
  },
  ratingInputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
    marginBottom: 16,
  },
  submitReviewButton: {
    backgroundColor: '#16A085',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Related Products Section
  relatedProductsSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  relatedProductsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  relatedProductsList: {
    paddingRight: 16,
  },
  relatedProductCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  relatedProductImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  relatedProductInfo: {
    padding: 12,
  },
  relatedProductName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  relatedProductPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A085',
    marginBottom: 4,
  },
  relatedProductRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  relatedProductRatingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Footer Styles
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  wishlistButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  actionButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  addToCartButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#16A085',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addToCartButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16A085',
  },
  buyNowButton: {
    backgroundColor: '#16A085',
  },
  buyNowButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

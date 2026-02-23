import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
}) => {
  const theme = useTheme();
  
  // Use thumbnailUrl or first image from images array
  const imageUrl = product.thumbnailUrl || product.images?.[0] || product.image || 'https://via.placeholder.com/200';
  
  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart();
    }
  };
  
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[
        styles.card,
        { 
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }
      ]} 
      activeOpacity={0.7}
    >
      <View style={[styles.imageContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {product.stock === 0 && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.category, { color: theme.colors.textTertiary }]} numberOfLines={1}>
          {product.category}
        </Text>

        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Rating - Always show */}
        <View style={styles.ratingContainer}>
          <Ionicons 
            name={product.averageRating && product.averageRating > 0 ? "star" : "star-outline"} 
            size={14} 
            color="#FCD34D" 
          />
          <Text style={[styles.ratingText, { color: theme.colors.text }]}>
            {product.averageRating ? product.averageRating.toFixed(1) : '0.0'}
          </Text>
          <Text style={[styles.reviewCount, { color: theme.colors.textTertiary }]}>
            ({product.totalReviews || 0})
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.price, { color: theme.colors.primary }]}>
            {formatCurrency(product.price)}
          </Text>

          {onAddToCart && product.stock > 0 && (
            <TouchableOpacity
              onPress={handleAddToCart}
              style={[
                styles.addButton,
                { backgroundColor: theme.colors.primary }
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  outOfStockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    padding: 12,
    minHeight: 120,
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 18,
    height: 36,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

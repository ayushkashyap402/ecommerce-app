import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { productClient } from '../../src/services/api';
import { useTheme } from '../../src/context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const CATEGORIES = [
  { 
    id: 'Women', 
    name: "Women's", 
    icon: 'woman-outline', 
    color: '#FFE4E6',
    apiCategory: 'womenwear'
  },
  { 
    id: 'Men', 
    name: "Men's", 
    icon: 'man-outline', 
    color: '#DBEAFE',
    apiCategory: 'menswear'
  },
  { 
    id: 'Kids', 
    name: "Kid's", 
    icon: 'balloon-outline', 
    color: '#FEF3C7',
    apiCategory: 'kidswear'
  },
  { 
    id: 'Footwear', 
    name: 'Footwear', 
    icon: 'footsteps-outline', 
    color: '#E0E7FF',
    apiCategory: 'footwear'
  },
  { 
    id: 'Summer', 
    name: 'Summer', 
    icon: 'sunny-outline', 
    color: '#FED7AA',
    apiCategory: 'summerwear'
  },
  { 
    id: 'Winter', 
    name: 'Winter', 
    icon: 'snow-outline', 
    color: '#E0F2FE',
    apiCategory: 'winterwear'
  },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({});
  const theme = useTheme();

  useEffect(() => {
    loadCategoryCounts();
  }, []);

  const loadCategoryCounts = async () => {
    const counts: { [key: string]: number } = {};
    
    for (const category of CATEGORIES) {
      try {
        const response = await productClient.get(`?category=${category.apiCategory}`);
        const products = Array.isArray(response.data) ? response.data : [];
        counts[category.id] = products.length;
      } catch (error) {
        console.error(`Error loading ${category.name} count:`, error);
        counts[category.id] = 0;
      }
    }
    
    setCategoryCounts(counts);
  };

  const getCategoryCount = (categoryId: string) => {
    return categoryCounts[categoryId] || 0;
  };

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/category/${categoryId}`);
  };

  const renderCategory = ({ item, index }: any) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        { marginRight: index % 2 === 0 ? 8 : 0 }
      ]}
      onPress={() => handleCategoryPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={40} color="#374151" />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryCount}>{getCategoryCount(item.id)} items</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Categories</Text>
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={CATEGORIES}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.categoryCard,
              { backgroundColor: theme.colors.card, marginRight: index % 2 === 0 ? 8 : 0 },
              theme.shadows.md
            ]}
            onPress={() => handleCategoryPress(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={40} color="#374151" />
            </View>
            <Text style={[styles.categoryName, { color: theme.colors.textSecondary }]}>{item.name}</Text>
            <Text style={[styles.categoryCount, { color: theme.colors.textTertiary }]}>{getCategoryCount(item.id)} items</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        style={styles.flatList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 20,
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 140,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});

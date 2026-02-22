import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';

const LIVE_SESSIONS = [
  {
    id: '1',
    title: 'Summer Fashion Sale',
    host: 'Fashion Store',
    viewers: 1234,
    isLive: true,
    thumbnail: '👗',
  },
  {
    id: '2',
    title: 'New Sneakers Collection',
    host: 'Shoe Paradise',
    viewers: 856,
    isLive: true,
    thumbnail: '👟',
  },
  {
    id: '3',
    title: 'Jewelry Showcase',
    host: 'Gems & More',
    viewers: 432,
    isLive: false,
    thumbnail: '💎',
  },
];

export default function LiveScreen() {
  const theme = useTheme();
  
  const renderLiveSession = ({ item }: any) => (
    <TouchableOpacity style={[styles.sessionCard, { backgroundColor: theme.colors.card }, theme.shadows.md]}>
      <View style={[styles.thumbnailContainer, { backgroundColor: theme.colors.backgroundTertiary }]}>
        <Text style={styles.thumbnailEmoji}>{item.thumbnail}</Text>
        {item.isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        <View style={styles.viewersBadge}>
          <Text style={styles.viewersText}>👁️ {item.viewers}</Text>
        </View>
      </View>
      <View style={styles.sessionInfo}>
        <Text style={[styles.sessionTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.hostName, { color: theme.colors.textSecondary }]}>{item.host}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {/* Teal Header */}
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Live Shopping</Text>
            <Text style={styles.headerSubtitle}>Watch & Shop in real-time</Text>
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={LIVE_SESSIONS}
        renderItem={renderLiveSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📹</Text>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No live sessions right now</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Check back later for live shopping events</Text>
          </View>
        }
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  listContent: {
    padding: 20,
    paddingBottom: 140,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  sessionCard: {
    width: '48%',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnailEmoji: {
    fontSize: 64,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  viewersBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewersText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sessionInfo: {
    padding: 16,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  hostName: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});

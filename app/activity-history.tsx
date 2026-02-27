import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import BASE_URL from "../services/api"; // Import BASE_URL

interface Activity {
  id: number;
  user_id: number;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export default function ActivityHistoryScreen() {
  const { isDarkMode } = useTheme();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/activities/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      } else {
        Alert.alert('Error', 'Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const getActivityIcon = (action: string): { name: string; color: string } => {
    const icons: Record<string, { name: string; color: string }> = {
      login: { name: 'login', color: '#4CAF50' },
      logout: { name: 'logout', color: '#FF9800' },
      profile_update: { name: 'account-edit', color: '#2196F3' },
      password_change: { name: 'lock-reset', color: '#9C27B0' },
      language_changed: { name: 'translate', color: '#9C27B0' },
      settings_changed: { name: 'cog', color: '#607D8B' },
    };
    
    return icons[action] || { name: 'history', color: '#757575' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.action === filter;
  });

  const getActivityCounts = () => {
    const counts: Record<string, number> = {};
    activities.forEach(activity => {
      counts[activity.action] = (counts[activity.action] || 0) + 1;
    });
    return counts;
  };

  const renderActivityItem = ({ item }: { item: Activity }) => {
    const icon = getActivityIcon(item.action);
    
    return (
      <TouchableOpacity 
        style={[styles.activityItem, isDarkMode && styles.darkActivityItem]}
        onPress={() => {
          Alert.alert(
            'Activity Details',
            `Action: ${item.action}\nDetails: ${item.details}\nIP Address: ${item.ip_address}\nTime: ${new Date(item.created_at).toLocaleString()}`,
            [{ text: 'OK' }]
          );
        }}
      >
        <View style={[styles.activityIcon, { backgroundColor: `${icon.color}15` }]}>
          <MaterialCommunityIcons name={icon.name as any} size={24} color={icon.color} />
        </View>
        
        <View style={styles.activityContent}>
          <Text style={[styles.activityAction, isDarkMode && styles.darkText]}>
            {item.action.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={[styles.activityDetails, isDarkMode && styles.darkSubText]}>
            {item.details}
          </Text>
          <View style={styles.activityMeta}>
            <MaterialCommunityIcons name="clock-outline" size={12} color="#999" />
            <Text style={[styles.activityTime, isDarkMode && styles.darkSubText]}>
              {formatDate(item.created_at)}
            </Text>
            {item.ip_address && (
              <>
                <MaterialCommunityIcons name="ip" size={12} color="#999" style={styles.metaIcon} />
                <Text style={[styles.activityIp, isDarkMode && styles.darkSubText]}>
                  {item.ip_address}
                </Text>
              </>
            )}
          </View>
        </View>
        
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={20} 
          color={isDarkMode ? '#AAA' : '#999'} 
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>
            Loading activities...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const counts = getActivityCounts();

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats Summary */}
      <View style={[styles.statsContainer, isDarkMode && styles.darkStatsContainer]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDarkMode && styles.darkText]}>
            {activities.length}
          </Text>
          <Text style={[styles.statLabel, isDarkMode && styles.darkSubText]}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDarkMode && styles.darkText]}>
            {counts['login'] || 0}
          </Text>
          <Text style={[styles.statLabel, isDarkMode && styles.darkSubText]}>Logins</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isDarkMode && styles.darkText]}>
            {Object.keys(counts).length}
          </Text>
          <Text style={[styles.statLabel, isDarkMode && styles.darkSubText]}>Types</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            filter === 'all' && styles.filterChipActive,
            isDarkMode && styles.darkFilterChip
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterChipText,
            filter === 'all' && styles.filterChipTextActive,
            isDarkMode && styles.darkText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        {['login', 'logout', 'password_change', 'profile_update', 'settings_changed'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              filter === type && styles.filterChipActive,
              isDarkMode && styles.darkFilterChip
            ]}
            onPress={() => setFilter(type)}
          >
            <Text style={[
              styles.filterChipText,
              filter === type && styles.filterChipTextActive,
              isDarkMode && styles.darkText
            ]}>
              {type.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Activities List */}
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderActivityItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2E7D32"]}
            tintColor={isDarkMode ? "#FFF" : "#2E7D32"}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="history" 
              size={60} 
              color={isDarkMode ? "#AAA" : "#999"} 
            />
            <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>
              No activities found
            </Text>
            <Text style={[styles.emptySubText, isDarkMode && styles.darkSubText]}>
              Your activities will appear here
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  header: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  darkHeader: {
    backgroundColor: "#1B5E20",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkStatsContainer: {
    backgroundColor: "#1E1E1E",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#F0F0F0",
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  darkFilterChip: {
    backgroundColor: "#1E1E1E",
  },
  filterChipActive: {
    backgroundColor: "#2E7D32",
  },
  filterChipText: {
    fontSize: 13,
    color: "#666",
  },
  filterChipTextActive: {
    color: "#FFF",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  darkActivityItem: {
    backgroundColor: "#1E1E1E",
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activityTime: {
    fontSize: 11,
    color: "#999",
    marginLeft: 2,
  },
  activityIp: {
    fontSize: 11,
    color: "#999",
  },
  metaIcon: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  darkText: {
    color: "#FFF",
  },
  darkSubText: {
    color: "#AAA",
  },
});
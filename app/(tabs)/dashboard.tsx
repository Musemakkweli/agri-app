import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from '../../context/ThemeContext';
import BASE_URL from "../../services/api";

const { width } = Dimensions.get("window");

// Types
interface RecentComplaint {
  id: number;
  type: string;
  field: string;
  status: string;
  date: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  statusColor: string;
}

interface Field {
  id: number;
  name: string;
  area: string;
  crop_type: string;
  location: string;
}

interface Pest {
  id: number;
  field_id: number;
  pest_type: string;
  severity: string;
  description: string;
  created_at: string;
}

interface WeatherAlert {
  id: number;
  type: string;
  message: string;
  severity: string;
  date: string;
}

interface Complaint {
  id: number;
  title: string;
  type: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: string;
}

// Mini Card Component
const MiniCard = ({ title, value, icon, color = "#2E7D32", onPress, loading, isDarkMode }: any) => {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <TouchableOpacity 
      style={[
        styles.miniCard, 
        isDarkMode && styles.darkMiniCard,
        isPressed && styles.miniCardPressed
      ]} 
      onPress={onPress} 
      disabled={loading}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={1}
    >
      <View style={[styles.miniCardIcon, { backgroundColor: isDarkMode ? '#1B5E20' : '#c2f2c6' }]}>
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <MaterialCommunityIcons name={icon} size={28} color={color} />
        )}
      </View>
      <Text style={[styles.miniCardValue, isDarkMode && styles.darkText]}>{loading ? "..." : value}</Text>
      <Text style={[styles.miniCardTitle, isDarkMode && styles.darkSubText]}>{title}</Text>
    </TouchableOpacity>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ label, icon, onPress, isDarkMode }: any) => {
  const [isPressed, setIsPressed] = useState(false);
  const bgColor = isDarkMode ? '#1B5E20' : '#2E7D32';
  
  return (
    <TouchableOpacity 
      style={[
        styles.quickActionButton, 
        { backgroundColor: bgColor },
        isPressed && styles.quickActionPressed
      ]} 
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={1}
    >
      <View style={styles.quickActionContent}>
        <MaterialCommunityIcons name={icon} size={24} color="#FFF" />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

// Section Title
const SectionTitle = ({ title, notificationCount, isDarkMode }: { title: string; notificationCount?: number; isDarkMode: boolean }) => (
  <View style={styles.sectionTitleContainer}>
    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{title}</Text>
    {notificationCount ? (
      <View style={styles.notificationBadge}>
        <Text style={styles.notificationText}>{notificationCount}</Text>
      </View>
    ) : null}
  </View>
);

// Recent Item Component
const RecentItem = ({ icon, title, subtitle, status, statusColor = "#8B5A2B", onPress, isDarkMode }: any) => {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <TouchableOpacity 
      style={[
        styles.recentItem, 
        isDarkMode && styles.darkRecentItem,
        isPressed && styles.recentItemPressed
      ]} 
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={1}
    >
      <View style={[styles.recentIcon, { backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E9' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={statusColor} />
      </View>
      <View style={styles.recentContent}>
        <Text style={[styles.recentTitle, isDarkMode && styles.darkText]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.recentSubtitle, isDarkMode && styles.darkSubText]} numberOfLines={1}>{subtitle}</Text>
      </View>
      <View style={[styles.recentStatus, { backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E9' }]}>
        <Text style={[styles.recentStatusText, { color: statusColor }]}>{status}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Notification Item Component
const NotificationItem = ({ notification, onPress, isDarkMode }: { notification: Notification; onPress: () => void; isDarkMode: boolean }) => {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        !notification.read && styles.unreadNotification,
        isDarkMode && styles.darkNotificationItem,
        isPressed && styles.notificationItemPressed
      ]} 
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={1}
    >
      <View style={[styles.notificationIcon, { backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E9' }]}>
        <MaterialCommunityIcons 
          name={notification.type === 'alert' ? 'alert' : 'information'} 
          size={24} 
          color={isDarkMode ? '#FFF' : '#2E7D32'} 
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, isDarkMode && styles.darkText]}>{notification.title}</Text>
        <Text style={[styles.notificationMessage, isDarkMode && styles.darkSubText]}>{notification.message}</Text>
        <Text style={[styles.notificationTime, isDarkMode && styles.darkSubText]}>{notification.time}</Text>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

// Form Modal Component
const FormModal = ({ 
  visible, 
  onClose, 
  title, 
  children,
  loading,
  isDarkMode
}: { 
  visible: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  loading?: boolean;
  isDarkMode: boolean;
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.formModalOverlay}>
      <View style={[styles.formModalContent, isDarkMode && styles.darkFormModalContent]}>
        <View style={[styles.formModalHeader, isDarkMode && styles.darkFormModalHeader]}>
          <Text style={[styles.formModalTitle, isDarkMode && styles.darkText]}>{title}</Text>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <MaterialCommunityIcons name="close" size={24} color={loading ? "#ccc" : isDarkMode ? "#FFF" : "#2E7D32"} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.formModalBody} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export default function FarmerDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("Farmer");
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [showNotifications, setShowNotifications] = useState(false);
  const { isDarkMode } = useTheme();
  
  // Dashboard data - initialize as empty arrays
  const [fields, setFields] = useState<Field[]>([]);
  const [harvests, setHarvests] = useState<any[]>([]);
  const [pests, setPests] = useState<Pest[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Form visibility states
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [showHarvestForm, setShowHarvestForm] = useState(false);
  const [showPestForm, setShowPestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data states
  const [fieldForm, setFieldForm] = useState({
    name: "",
    area: "",
    crop_type: "",
    location: ""
  });
  
  const [harvestForm, setHarvestForm] = useState({
    field_id: "",
    crop_type: "",
    harvest_date: new Date().toISOString().split('T')[0]
  });
  
  const [pestForm, setPestForm] = useState({
    field_id: "",
    pest_type: "",
    severity: "",
    description: ""
  });

  // Notifications data
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  // Load dashboard data when userId is available
  useEffect(() => {
    if (userId) {
      loadDashboardData();
      loadNotifications();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.full_name || user.name || "Farmer");
        setUserId(user.id);
      } else {
        Alert.alert("Session Expired", "Please login again");
        router.push("/login");
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      
      if (!token || !userId) {
        throw new Error("No authentication token");
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch fields
      try {
        const fieldsRes = await axios.get(`${BASE_URL}/fields/user/${userId}`, { headers });
        setFields(Array.isArray(fieldsRes.data) ? fieldsRes.data : []);
      } catch (error: any) {
        console.log("Fields endpoint error:", error.message);
        setFields([]);
      }

      // Fetch harvests
      try {
        const harvestsRes = await axios.get(`${BASE_URL}/harvests/user/${userId}`, { headers });
        setHarvests(Array.isArray(harvestsRes.data) ? harvestsRes.data : []);
      } catch (error: any) {
        console.log("Harvests endpoint error:", error.message);
        setHarvests([]);
      }

      // Fetch pests
      try {
        const pestsRes = await axios.get(`${BASE_URL}/pest-alerts/user/${userId}`, { headers });
        setPests(Array.isArray(pestsRes.data) ? pestsRes.data : []);
      } catch (error: any) {
        console.log("Pests endpoint error:", error.message);
        setPests([]);
      }

      // Fetch weather alerts
      try {
        const weatherRes = await axios.get(`${BASE_URL}/weather-alerts`, { headers });
        setWeatherAlerts(Array.isArray(weatherRes.data) ? weatherRes.data : []);
      } catch (error: any) {
        console.log("Weather alerts endpoint error:", error.message);
        setWeatherAlerts([]);
      }

      // Fetch complaints
      try {
        const complaintsRes = await axios.get(`${BASE_URL}/complaints/user/${userId}`, { headers });
        setComplaints(Array.isArray(complaintsRes.data) ? complaintsRes.data : []);
      } catch (error: any) {
        console.log("Complaints endpoint error:", error.message);
        setComplaints([]);
      }

    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      if (!token || !userId) return;

      try {
        const response = await axios.get(`${BASE_URL}/notifications/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const notifs = Array.isArray(response.data) ? response.data : [];
        
        const formattedNotifs: Notification[] = notifs.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: formatTimeAgo(n.created_at),
          read: n.is_read,
          type: n.type?.includes('alert') ? 'alert' : 'info'
        }));

        setNotifications(formattedNotifs);
        setUnreadCount(formattedNotifs.filter(n => !n.read).length);
      } catch (error: any) {
        console.log("Notifications endpoint error:", error.message);
        setNotifications([]);
        setUnreadCount(0);
      }

    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return "Recently";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour ago`;
      if (diffDays === 1) return "Yesterday";
      return `${diffDays} days ago`;
    } catch {
      return "Recently";
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
    loadNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      
      try {
        await axios.patch(`${BASE_URL}/notifications/${notification.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.log("Mark as read endpoint not available");
      }

      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));

      Alert.alert(notification.title, notification.message);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      
      try {
        await axios.post(`${BASE_URL}/notifications/mark-all-read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.log("Mark all read endpoint not available");
      }

      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const submitField = async () => {
    if (!fieldForm.name || !fieldForm.area || !fieldForm.crop_type || !fieldForm.location) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      
      await axios.post(`${BASE_URL}/fields`, {
        user_id: userId,
        name: fieldForm.name,
        area: parseFloat(fieldForm.area),
        crop_type: fieldForm.crop_type,
        location: fieldForm.location
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await loadDashboardData();
      
      Alert.alert("Success", "Field added successfully!");
      setShowFieldForm(false);
      setFieldForm({ name: "", area: "", crop_type: "", location: "" });
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.detail || "Failed to add field");
    } finally {
      setSubmitting(false);
    }
  };

  const submitHarvest = async () => {
    if (!harvestForm.field_id || !harvestForm.crop_type || !harvestForm.harvest_date) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      
      await axios.post(`${BASE_URL}/harvests`, {
        farmer_id: userId,
        field_id: parseInt(harvestForm.field_id),
        crop_type: harvestForm.crop_type,
        harvest_date: harvestForm.harvest_date,
        status: "upcoming"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await loadDashboardData();
      
      Alert.alert("Success", "Harvest scheduled successfully!");
      setShowHarvestForm(false);
      setHarvestForm({ field_id: "", crop_type: "", harvest_date: new Date().toISOString().split('T')[0] });
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.detail || "Failed to schedule harvest");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPest = async () => {
    if (!pestForm.field_id || !pestForm.pest_type || !pestForm.severity || !pestForm.description) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      
      await axios.post(`${BASE_URL}/pest-alerts`, {
        farmer_id: userId,
        field_id: parseInt(pestForm.field_id),
        pest_type: pestForm.pest_type,
        severity: pestForm.severity.toLowerCase(),
        description: pestForm.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await loadDashboardData();
      
      Alert.alert("Success", "Pest reported successfully!");
      setShowPestForm(false);
      setPestForm({ field_id: "", pest_type: "", severity: "", description: "" });
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.detail || "Failed to report pest");
    } finally {
      setSubmitting(false);
    }
  };

  // Format recent complaints
  const recentComplaints: RecentComplaint[] = complaints.slice(0, 3).map(c => {
    const statusColor = "#8B5A2B";
    const icon: any = "alert-circle";
    
    return {
      id: c.id,
      type: c.type,
      field: c.location || "Unknown",
      status: c.status || "Pending",
      date: formatTimeAgo(c.created_at),
      icon,
      statusColor
    };
  });

  const pendingComplaints = complaints.filter(c => c.status?.toLowerCase() === "pending").length;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>Loading your farm data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <StatusBar barStyle="light-content" backgroundColor={isDarkMode ? "#1B5E20" : "#2E7D32"} />
      
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{userName}! 🌱</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.notificationButton} 
            onPress={() => setShowNotifications(true)}
          >
            <MaterialCommunityIcons name="bell" size={24} color="#FFF" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadgeHeader}>
                <Text style={styles.notificationBadgeHeaderText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push("/profile" as any)}>
            <MaterialCommunityIcons name="account-circle" size={40} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={[styles.modalHeader, isDarkMode && styles.darkModalHeader]}>
              <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>Notifications</Text>
              <View style={styles.modalHeaderRight}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllAsRead}>
                    <Text style={[styles.markAllRead, isDarkMode && styles.darkSubText]}>Mark all as read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? "#FFF" : "#2E7D32"} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.notificationList} showsVerticalScrollIndicator={false}>
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification}
                    onPress={() => handleNotificationPress(notification)}
                    isDarkMode={isDarkMode}
                  />
                ))
              ) : (
                <View style={styles.emptyNotifications}>
                  <MaterialCommunityIcons name="bell-off" size={48} color={isDarkMode ? "#555" : "#ccc"} />
                  <Text style={[styles.emptyNotificationsText, isDarkMode && styles.darkSubText]}>No notifications</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, isDarkMode && styles.darkTabContainer]}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === "overview" && styles.activeTab]}
          onPress={() => setSelectedTab("overview")}
        >
          <Text style={[styles.tabText, selectedTab === "overview" && styles.activeTabText, isDarkMode && styles.darkSubText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === "activities" && styles.activeTab]}
          onPress={() => setSelectedTab("activities")}
        >
          <Text style={[styles.tabText, selectedTab === "activities" && styles.activeTabText, isDarkMode && styles.darkSubText]}>
            Activities
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === "alerts" && styles.activeTab]}
          onPress={() => setSelectedTab("alerts")}
        >
          <Text style={[styles.tabText, selectedTab === "alerts" && styles.activeTabText, isDarkMode && styles.darkSubText]}>
            Alerts
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} />
        }
      >
        {/* Mini Cards Grid - 2 per row */}
        <SectionTitle title="Farm Overview" isDarkMode={isDarkMode} />
        <View style={styles.miniCardsGrid}>
          <View style={styles.row}>
            <View style={styles.cardContainer}>
              <MiniCard 
                title="Fields" 
                value={fields.length} 
                icon="terrain" 
                onPress={() => router.push("/fields")}
                isDarkMode={isDarkMode}
              />
            </View>
            <View style={styles.cardContainer}>
              <MiniCard 
                title="Harvests" 
                value={harvests.length} 
                icon="calendar-check" 
                onPress={() => router.push("/harvests")}
                isDarkMode={isDarkMode}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.cardContainer}>
              <MiniCard 
                title="Pests" 
                value={pests.length} 
                icon="bug" 
                onPress={() => router.push("/pests")}
                isDarkMode={isDarkMode}
              />
            </View>
            <View style={styles.cardContainer}>
              <MiniCard 
                title="Complaints" 
                value={complaints.length} 
                icon="alert-circle" 
                onPress={() => router.push("/complaint")}
                isDarkMode={isDarkMode}
              />
            </View>
          </View>
        </View>

        {/* Quick Actions - 2 per row */}
        <SectionTitle title="Quick Actions" isDarkMode={isDarkMode} />
        <View style={styles.quickActionsGrid}>
          <View style={styles.row}>
            <View style={styles.cardContainer}>
              <QuickActionButton 
                label="Add Field" 
                icon="terrain" 
                onPress={() => setShowFieldForm(true)}
                isDarkMode={isDarkMode}
              />
            </View>
            <View style={styles.cardContainer}>
              <QuickActionButton 
                label="Harvest" 
                icon="calendar-plus" 
                onPress={() => setShowHarvestForm(true)}
                isDarkMode={isDarkMode}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.cardContainer}>
              <QuickActionButton 
                label="Report Pest" 
                icon="bug" 
                onPress={() => setShowPestForm(true)}
                isDarkMode={isDarkMode}
              />
            </View>
            <View style={styles.cardContainer}>
              <QuickActionButton 
                label="Complaint" 
                icon="alert" 
                onPress={() => router.push("/complaint")}
                isDarkMode={isDarkMode}
              />
            </View>
          </View>
        </View>

        {/* Recent Complaints */}
        {recentComplaints.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <SectionTitle title="Recent Complaints" notificationCount={pendingComplaints} isDarkMode={isDarkMode} />
              <TouchableOpacity onPress={() => router.push("/complaint")}>
                <Text style={[styles.viewAllLink, isDarkMode && styles.darkText]}>View All</Text>
              </TouchableOpacity>
            </View>
            {recentComplaints.map(item => (
              <RecentItem 
                key={item.id}
                icon={item.icon}
                title={item.type}
                subtitle={`${item.field} • ${item.date}`}
                status={item.status}
                onPress={() => router.push(`/complaint/${item.id}` as any)}
                isDarkMode={isDarkMode}
              />
            ))}
          </View>
        )}

        {/* Weather Alerts */}
        {weatherAlerts.length > 0 && (
          <View style={styles.recentSection}>
            <SectionTitle title="Weather Alerts" isDarkMode={isDarkMode} />
            {weatherAlerts.map(alert => (
              <View key={alert.id} style={[styles.alertCard, isDarkMode && styles.darkAlertCard]}>
                <View style={[styles.alertIcon, { backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E9' }]}>
                  <MaterialCommunityIcons name="weather-lightning-rainy" size={24} color={isDarkMode ? '#FFF' : '#8B5A2B'} />
                </View>
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, isDarkMode && styles.darkText]}>{alert.type}</Text>
                  <Text style={[styles.alertMessage, isDarkMode && styles.darkSubText]}>{alert.message}</Text>
                  <Text style={[styles.alertDate, isDarkMode && styles.darkSubText]}>{alert.date}</Text>
                </View>
                <View style={[styles.alertSeverity, { backgroundColor: isDarkMode ? '#1B5E20' : '#E8F5E9' }]}>
                  <Text style={[styles.alertSeverityText, { color: isDarkMode ? '#FFF' : '#8B5A2B' }]}>
                    {alert.severity}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Field Form Modal */}
      <FormModal
        visible={showFieldForm}
        onClose={() => setShowFieldForm(false)}
        title="Add New Field"
        loading={submitting}
        isDarkMode={isDarkMode}
      >
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Field Name</Text>
          <TextInput
            style={[styles.formInput, isDarkMode && styles.darkFormInput]}
            value={fieldForm.name}
            onChangeText={(text) => setFieldForm({...fieldForm, name: text})}
            placeholder="e.g., Field A"
            placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
            editable={!submitting}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Area (hectares)</Text>
          <TextInput
            style={[styles.formInput, isDarkMode && styles.darkFormInput]}
            value={fieldForm.area}
            onChangeText={(text) => setFieldForm({...fieldForm, area: text})}
            placeholder="e.g., 5"
            keyboardType="numeric"
            placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
            editable={!submitting}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Crop Type</Text>
          <TextInput
            style={[styles.formInput, isDarkMode && styles.darkFormInput]}
            value={fieldForm.crop_type}
            onChangeText={(text) => setFieldForm({...fieldForm, crop_type: text})}
            placeholder="e.g., Maize"
            placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
            editable={!submitting}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Location</Text>
          <TextInput
            style={[styles.formInput, isDarkMode && styles.darkFormInput]}
            value={fieldForm.location}
            onChangeText={(text) => setFieldForm({...fieldForm, location: text})}
            placeholder="e.g., North Section"
            placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
            editable={!submitting}
          />
        </View>
        
        <View style={styles.formButtonContainer}>
          <TouchableOpacity 
            style={[styles.formCancelButton, isDarkMode && styles.darkFormCancelButton]} 
            onPress={() => setShowFieldForm(false)}
            disabled={submitting}
          >
            <Text style={[styles.formCancelButtonText, isDarkMode && styles.darkText]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.formSubmitButton, submitting && styles.formSubmitButtonDisabled]} 
            onPress={submitField}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.formSubmitButtonText}>Add Field</Text>
            )}
          </TouchableOpacity>
        </View>
      </FormModal>

      {/* Schedule Harvest Form Modal */}
      <FormModal
        visible={showHarvestForm}
        onClose={() => setShowHarvestForm(false)}
        title="Schedule Harvest"
        loading={submitting}
        isDarkMode={isDarkMode}
      >
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Select Field</Text>
          <View style={styles.pickerContainer}>
            {fields.map((field) => (
              <TouchableOpacity
                key={field.id}
                style={[
                  styles.pickerOption,
                  harvestForm.field_id === field.id.toString() && styles.pickerOptionSelected,
                  isDarkMode && styles.darkPickerOption
                ]}
                onPress={() => setHarvestForm({...harvestForm, field_id: field.id.toString()})}
                disabled={submitting}
              >
                <Text style={[
                  styles.pickerOptionText,
                  harvestForm.field_id === field.id.toString() && styles.pickerOptionTextSelected,
                  isDarkMode && styles.darkText
                ]}>
                  {field.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Crop Type</Text>
          <TextInput
            style={[styles.formInput, isDarkMode && styles.darkFormInput]}
            value={harvestForm.crop_type}
            onChangeText={(text) => setHarvestForm({...harvestForm, crop_type: text})}
            placeholder="e.g., Maize"
            placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
            editable={!submitting}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Harvest Date</Text>
          <TextInput
            style={[styles.formInput, isDarkMode && styles.darkFormInput]}
            value={harvestForm.harvest_date}
            onChangeText={(text) => setHarvestForm({...harvestForm, harvest_date: text})}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
            editable={!submitting}
          />
        </View>
        
        <View style={styles.formButtonContainer}>
          <TouchableOpacity 
            style={[styles.formCancelButton, isDarkMode && styles.darkFormCancelButton]} 
            onPress={() => setShowHarvestForm(false)}
            disabled={submitting}
          >
            <Text style={[styles.formCancelButtonText, isDarkMode && styles.darkText]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.formSubmitButton, submitting && styles.formSubmitButtonDisabled]} 
            onPress={submitHarvest}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.formSubmitButtonText}>Schedule</Text>
            )}
          </TouchableOpacity>
        </View>
      </FormModal>

      {/* Report Pest Form Modal */}
      <FormModal
        visible={showPestForm}
        onClose={() => setShowPestForm(false)}
        title="Report Pest"
        loading={submitting}
        isDarkMode={isDarkMode}
      >
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Select Field</Text>
          <View style={styles.pickerContainer}>
            {fields.map((field) => (
              <TouchableOpacity
                key={field.id}
                style={[
                  styles.pickerOption,
                  pestForm.field_id === field.id.toString() && styles.pickerOptionSelected,
                  isDarkMode && styles.darkPickerOption
                ]}
                onPress={() => setPestForm({...pestForm, field_id: field.id.toString()})}
                disabled={submitting}
              >
                <Text style={[
                  styles.pickerOptionText,
                  pestForm.field_id === field.id.toString() && styles.pickerOptionTextSelected,
                  isDarkMode && styles.darkText
                ]}>
                  {field.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Pest Type</Text>
          <TextInput
            style={[styles.formInput, isDarkMode && styles.darkFormInput]}
            value={pestForm.pest_type}
            onChangeText={(text) => setPestForm({...pestForm, pest_type: text})}
            placeholder="e.g., Aphids, Armyworms"
            placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
            editable={!submitting}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Severity</Text>
          <View style={styles.pickerContainer}>
            {["Low", "Medium", "High"].map((severity) => (
              <TouchableOpacity
                key={severity}
                style={[
                  styles.pickerOption,
                  pestForm.severity === severity && styles.pickerOptionSelected,
                  isDarkMode && styles.darkPickerOption
                ]}
                onPress={() => setPestForm({...pestForm, severity})}
                disabled={submitting}
              >
                <Text style={[
                  styles.pickerOptionText,
                  pestForm.severity === severity && styles.pickerOptionTextSelected,
                  isDarkMode && styles.darkText
                ]}>
                  {severity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Description</Text>
          <TextInput
            style={[styles.formInput, styles.textArea, isDarkMode && styles.darkFormInput]}
            value={pestForm.description}
            onChangeText={(text) => setPestForm({...pestForm, description: text})}
            placeholder="Describe the pest issue in detail..."
            placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!submitting}
          />
        </View>
        
        <View style={styles.formButtonContainer}>
          <TouchableOpacity 
            style={[styles.formCancelButton, isDarkMode && styles.darkFormCancelButton]} 
            onPress={() => setShowPestForm(false)}
            disabled={submitting}
          >
            <Text style={[styles.formCancelButtonText, isDarkMode && styles.darkText]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.formSubmitButton, submitting && styles.formSubmitButtonDisabled]} 
            onPress={submitPest}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.formSubmitButtonText}>Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d8f0d5", // Nude/beige background
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  header: {
    backgroundColor: "#2E7D32", // Green header
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  darkHeader: {
    backgroundColor: "#1B5E20",
  },
  greeting: {
    fontSize: 14,
    color: "#E8F5E9",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  notificationButton: {
    position: "relative",
    padding: 5,
  },
  notificationBadgeHeader: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2E7D32",
  },
  notificationBadgeHeaderText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  profileButton: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 30,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  darkTabContainer: {
    backgroundColor: "#1E1E1E",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 25,
  },
  activeTab: {
    backgroundColor: "#2E7D32",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#FFF",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5DC",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#2E7D32",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginRight: 8,
  },
  notificationBadge: {
    backgroundColor: "#8B5A2B",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  notificationText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Grid layout for cards
  miniCardsGrid: {
    marginBottom: 10,
  },
  quickActionsGrid: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  cardContainer: {
    flex: 1,
  },
  miniCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E8E0D5",
    width: "100%",
  },
  darkMiniCard: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
  },
  miniCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  miniCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  miniCardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  miniCardTitle: {
    fontSize: 14,
    color: "#8B5A2B",
    textAlign: "center",
  },
  quickActionButton: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: "100%",
  },
  quickActionPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  quickActionContent: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 13,
    color: "#FFF",
    fontWeight: "600",
    textAlign: "center",
  },
  recentSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E8E0D5",
  },
  darkRecentItem: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
  },
  recentItemPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.9,
  },
  recentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 2,
  },
  recentSubtitle: {
    fontSize: 12,
    color: "#8B5A2B",
  },
  recentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  recentStatusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E8E0D5",
  },
  darkAlertCard: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  alertDate: {
    fontSize: 11,
    color: "#999",
  },
  alertSeverity: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  alertSeverityText: {
    fontSize: 11,
    fontWeight: "500",
  },
  bottomPadding: {
    height: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: "50%",
    maxHeight: "80%",
  },
  darkModalContent: {
    backgroundColor: "#1E1E1E",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E0D5",
  },
  darkModalHeader: {
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  modalHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  markAllRead: {
    color: "#8B5A2B",
    fontSize: 14,
    fontWeight: "500",
  },
  notificationList: {
    padding: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E8E0D5",
    position: "relative",
  },
  darkNotificationItem: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
  },
  notificationItemPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.9,
  },
  unreadNotification: {
    backgroundColor: "#F0F7F0",
    borderColor: "#2E7D32",
  },
  notificationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2E7D32",
    position: "absolute",
    top: 15,
    right: 15,
  },
  emptyNotifications: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyNotificationsText: {
    fontSize: 16,
    color: "#999",
    marginTop: 10,
  },
  // Form Modal Styles
  formModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  formModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  darkFormModalContent: {
    backgroundColor: "#1E1E1E",
  },
  formModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E0D5",
  },
  darkFormModalHeader: {
    borderBottomColor: "#333",
  },
  formModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  formModalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  darkFormInput: {
    backgroundColor: "#2A2A2A",
    color: "#FFF",
    borderColor: "#444",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  formButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },
  formCancelButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  darkFormCancelButton: {
    backgroundColor: "#2A2A2A",
    borderColor: "#444",
  },
  formCancelButtonText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  formSubmitButton: {
    flex: 1,
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  formSubmitButtonDisabled: {
    backgroundColor: "#81C784",
    opacity: 0.7,
  },
  formSubmitButtonText: {
    fontSize: 15,
    color: "#FFF",
    fontWeight: "600",
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2E7D32",
    backgroundColor: "#FFF",
  },
  darkPickerOption: {
    backgroundColor: "#2A2A2A",
  },
  pickerOptionSelected: {
    backgroundColor: "#2E7D32",
  },
  pickerOptionText: {
    fontSize: 14,
    color: "#2E7D32",
  },
  pickerOptionTextSelected: {
    color: "#FFF",
  },
  darkText: {
    color: "#FFF",
  },
  darkSubText: {
    color: "#AAA",
  },
});
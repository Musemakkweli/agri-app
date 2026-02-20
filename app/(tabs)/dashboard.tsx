import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

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

interface RecentHarvest {
  id: number;
  crop: string;
  field: string;
  amount: string;
  date: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  statusColor: string;
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
const MiniCard = ({ title, value, icon, color, onPress }: any) => (
  <TouchableOpacity style={styles.miniCard} onPress={onPress}>
    <View style={[styles.miniCardIcon, { backgroundColor: color + "15" }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.miniCardValue}>{value}</Text>
    <Text style={styles.miniCardTitle}>{title}</Text>
  </TouchableOpacity>
);

// Quick Action Button Component
const QuickActionButton = ({ label, icon, color, onPress }: any) => (
  <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: color }]} onPress={onPress}>
    <View style={styles.quickActionContent}>
      <MaterialCommunityIcons name="plus" size={16} color="#FFF" style={styles.plusIcon} />
      <MaterialCommunityIcons name={icon} size={20} color="#FFF" />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

// Section Title with Notification Badge
const SectionTitle = ({ title, notificationCount }: { title: string; notificationCount?: number }) => (
  <View style={styles.sectionTitleContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {notificationCount ? (
      <View style={styles.notificationBadge}>
        <Text style={styles.notificationText}>{notificationCount}</Text>
      </View>
    ) : null}
  </View>
);

// Recent Item Component
const RecentItem = ({ icon, title, subtitle, status, statusColor }: any) => (
  <View style={styles.recentItem}>
    <View style={[styles.recentIcon, { backgroundColor: statusColor + "15" }]}>
      <MaterialCommunityIcons name={icon} size={20} color={statusColor} />
    </View>
    <View style={styles.recentContent}>
      <Text style={styles.recentTitle}>{title}</Text>
      <Text style={styles.recentSubtitle}>{subtitle}</Text>
    </View>
    <View style={[styles.recentStatus, { backgroundColor: statusColor + "15" }]}>
      <Text style={[styles.recentStatusText, { color: statusColor }]}>{status}</Text>
    </View>
  </View>
);

// Notification Item Component
const NotificationItem = ({ notification, onPress }: { notification: Notification; onPress: () => void }) => (
  <TouchableOpacity 
    style={[styles.notificationItem, !notification.read && styles.unreadNotification]} 
    onPress={onPress}
  >
    <View style={[styles.notificationIcon, { backgroundColor: notification.type === 'alert' ? '#8B5A2B15' : '#2E7D3215' }]}>
      <MaterialCommunityIcons 
        name={notification.type === 'alert' ? 'alert' : 'information'} 
        size={24} 
        color={notification.type === 'alert' ? '#8B5A2B' : '#2E7D32'} 
      />
    </View>
    <View style={styles.notificationContent}>
      <Text style={styles.notificationTitle}>{notification.title}</Text>
      <Text style={styles.notificationMessage}>{notification.message}</Text>
      <Text style={styles.notificationTime}>{notification.time}</Text>
    </View>
    {!notification.read && <View style={styles.unreadDot} />}
  </TouchableOpacity>
);

export default function FarmerDashboard() {
  const [userName, setUserName] = useState<string>("Farmer");
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  
  // Sample data states
  const [fields] = useState<number>(3);
  const [harvests] = useState<number>(5);
  const [pests] = useState<number>(2);
  const [complaints] = useState<number>(2);

  // Notification counts
  const [pendingComplaints] = useState<number>(2);
  const [upcomingHarvests] = useState<number>(3);
  const [newPests] = useState<number>(1);
  
  // Notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "New Pest Detected",
      message: "Aphids detected in Field B. Take action immediately.",
      time: "5 minutes ago",
      read: false,
      type: "alert"
    },
    {
      id: 2,
      title: "Harvest Reminder",
      message: "Maize in Field A is ready for harvest.",
      time: "1 hour ago",
      read: false,
      type: "info"
    },
    {
      id: 3,
      title: "Weather Alert",
      message: "Heavy rain expected tomorrow. Plan accordingly.",
      time: "3 hours ago",
      read: true,
      type: "alert"
    },
    {
      id: 4,
      title: "Complaint Update",
      message: "Your equipment complaint has been resolved.",
      time: "1 day ago",
      read: true,
      type: "info"
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Sample recent data
  const recentComplaints: RecentComplaint[] = [
    { id: 1, type: "Equipment Failure", field: "Field A", status: "Pending", date: "2h ago", icon: "tools", statusColor: "#8B5A2B" },
    { id: 2, type: "Pest Infestation", field: "Field B", status: "In Progress", date: "1d ago", icon: "bug", statusColor: "#2E7D32" },
    { id: 3, type: "Irrigation Issue", field: "Field C", status: "Resolved", date: "2d ago", icon: "water", statusColor: "#4CAF50" },
  ];

  const recentHarvests: RecentHarvest[] = [
    { id: 1, crop: "Maize", field: "Field A", amount: "500 kg", date: "Today", icon: "corn", statusColor: "#2E7D32" },
    { id: 2, crop: "Beans", field: "Field B", amount: "300 kg", date: "Yesterday", icon: "food", statusColor: "#8B5A2B" },
  ];

  // Get user from storage
  useEffect(() => {
    // In a real app, you'd get this from AsyncStorage
    setUserName("John");
  }, []);

  const onRefresh = (): void => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleCardPress = (title: string): void => {
    Alert.alert(`${title}`, `View all ${title.toLowerCase()}`);
  };

  const handleQuickAction = (action: string): void => {
    Alert.alert("Quick Action", `Open ${action} form`);
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ));
    Alert.alert(notification.title, notification.message);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Header with Notification Bell */}
      <View style={styles.header}>
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
          <TouchableOpacity style={styles.profileButton}>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <View style={styles.modalHeaderRight}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllAsRead}>
                    <Text style={styles.markAllRead}>Mark all as read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#2E7D32" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.notificationList}>
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification}
                    onPress={() => handleNotificationPress(notification)}
                  />
                ))
              ) : (
                <View style={styles.emptyNotifications}>
                  <MaterialCommunityIcons name="bell-off" size={48} color="#ccc" />
                  <Text style={styles.emptyNotificationsText}>No notifications</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === "overview" && styles.activeTab]}
          onPress={() => setSelectedTab("overview")}
        >
          <Text style={[styles.tabText, selectedTab === "overview" && styles.activeTabText]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === "activities" && styles.activeTab]}
          onPress={() => setSelectedTab("activities")}
        >
          <Text style={[styles.tabText, selectedTab === "activities" && styles.activeTabText]}>Activities</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === "alerts" && styles.activeTab]}
          onPress={() => setSelectedTab("alerts")}
        >
          <Text style={[styles.tabText, selectedTab === "alerts" && styles.activeTabText]}>Alerts</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} />
        }
      >
        {/* Mini Cards Grid */}
        <SectionTitle title="Farm Overview" />
        <View style={styles.miniCardsGrid}>
          <MiniCard 
            title="Fields" 
            value={fields} 
            icon="terrain" 
            color="#2E7D32"
            onPress={() => handleCardPress("Fields")}
          />
          <MiniCard 
            title="Harvests" 
            value={harvests} 
            icon="calendar-check" 
            color="#8B5A2B"
            onPress={() => handleCardPress("Harvests")}
          />
          <MiniCard 
            title="Pests" 
            value={pests} 
            icon="bug" 
            color="#8B5A2B"
            onPress={() => handleCardPress("Pests")}
          />
          <MiniCard 
            title="Complaints" 
            value={complaints} 
            icon="alert-circle" 
            color="#2E7D32"
            onPress={() => handleCardPress("Complaints")}
          />
        </View>

        {/* Quick Actions */}
        <SectionTitle title="Quick Actions" />
        <View style={styles.quickActionsGrid}>
          <QuickActionButton 
            label="Add Field" 
            icon="terrain" 
            color="#2E7D32"
            onPress={() => handleQuickAction("Add Field")}
          />
          <QuickActionButton 
            label="Schedule Harvest" 
            icon="calendar-plus" 
            color="#8B5A2B"
            onPress={() => handleQuickAction("Schedule Harvest")}
          />
          <QuickActionButton 
            label="Report Pest" 
            icon="bug" 
            color="#2E7D32"
            onPress={() => handleQuickAction("Report Pest")}
          />
          <QuickActionButton 
            label="New Complaint" 
            icon="alert" 
            color="#8B5A2B"
            onPress={() => handleQuickAction("New Complaint")}
          />
        </View>

        {/* Recent Complaints with notification */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <SectionTitle title="Recent Complaints" notificationCount={pendingComplaints} />
            <TouchableOpacity>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentComplaints.map(item => (
            <RecentItem 
              key={item.id}
              icon={item.icon}
              title={item.type}
              subtitle={`${item.field} • ${item.date}`}
              status={item.status}
              statusColor={item.statusColor}
            />
          ))}
        </View>

        {/* Recent Harvests with notification */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <SectionTitle title="Recent Harvests" notificationCount={upcomingHarvests} />
            <TouchableOpacity>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentHarvests.map(item => (
            <RecentItem 
              key={item.id}
              icon={item.icon}
              title={item.crop}
              subtitle={`${item.field} • ${item.amount}`}
              status={item.date}
              statusColor={item.statusColor}
            />
          ))}
        </View>

        {/* Alerts Section with notification */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <SectionTitle title="Active Alerts" notificationCount={newPests} />
            <TouchableOpacity>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.alertCard}>
            <View style={styles.alertContent}>
              <MaterialCommunityIcons name="bug" size={24} color="#8B5A2B" />
              <View style={styles.alertTextContainer}>
                <Text style={styles.alertTitle}>New Pest Detected</Text>
                <Text style={styles.alertSubtitle}>Field B • 2 hours ago</Text>
              </View>
            </View>
            <View style={[styles.alertBadge, { backgroundColor: "#8B5A2B" }]}>
              <Text style={styles.alertBadgeText}>New</Text>
            </View>
          </View>
          <View style={styles.alertCard}>
            <View style={styles.alertContent}>
              <MaterialCommunityIcons name="weather-cloudy" size={24} color="#2E7D32" />
              <View style={styles.alertTextContainer}>
                <Text style={styles.alertTitle}>Weather Alert</Text>
                <Text style={styles.alertSubtitle}>Heavy rain expected • Tomorrow</Text>
              </View>
            </View>
            <View style={[styles.alertBadge, { backgroundColor: "#2E7D32" }]}>
              <Text style={styles.alertBadgeText}>2</Text>
            </View>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F5F0",
  },
  header: {
    backgroundColor: "#2E7D32",
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
    paddingHorizontal: 20,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
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
  miniCardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  miniCard: {
    width: (width - 60) / 2,
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    shadowColor: "#8B5A2B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E8E0D5",
  },
  miniCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  miniCardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  miniCardTitle: {
    fontSize: 14,
    color: "#8B5A2B",
    marginTop: 5,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  quickActionButton: {
    width: (width - 60) / 2,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10,
  },
  quickActionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  plusIcon: {
    marginRight: 4,
  },
  quickActionLabel: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
    marginTop: 2,
  },
  recentSection: {
    marginTop: 20,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
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
    shadowColor: "#8B5A2B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E8E0D5",
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  recentSubtitle: {
    fontSize: 12,
    color: "#8B5A2B",
    marginTop: 2,
  },
  recentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentStatusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E8E0D5",
    shadowColor: "#8B5A2B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  alertContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  alertTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2E7D32",
  },
  alertSubtitle: {
    fontSize: 12,
    color: "#8B5A2B",
    marginTop: 2,
  },
  alertBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  alertBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E0D5",
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
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import BASE_URL from "../../services/api"; // Import BASE_URL from services

interface SettingSection {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>("english");
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Load user data from AsyncStorage
  const [userData, setUserData] = useState({
    id: null as number | null,
    fullname: "John Farmer",
    email: "john.farmer@example.com",
    phone: ""
  });

  useEffect(() => {
    loadUserData();
  }, []);

  // Navigation helper to handle router paths
  const navigateTo = (screen: string, params?: any) => {
    // List of valid screens in your app
    const validScreens = [
      '/profile',
      '/activity-history',
      '/privacy-security',
      '/change-password',
      '/faq',
      '/contact-support',
      '/terms',
      '/privacy-policy',
      '/trusted-devices',
      '/recent-logins',
      '/delete-account',
      '/setup-2fa',
      '/cookie-policy',
      '/licenses'
    ];
    
    if (validScreens.includes(screen)) {
      if (params) {
        // Navigate with params
        router.push({
          pathname: screen as any,
          params: params
        });
      } else {
        // Navigate without params
        router.push(screen as any);
      }
    } else {
      Alert.alert('Coming Soon', 'This feature will be available soon.');
    }
  };

  const loadUserData = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("token");
      
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserData({
          id: user.id || null,
          fullname: user.fullname || "John Farmer",
          email: user.email || "john.farmer@example.com",
          phone: user.phone || ""
        });
        setUserId(user.id);
        
        // Load user preferences from backend
        if (user.id && token) {
          await loadNotificationSettings(user.id, token);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadNotificationSettings = async (userId: number, token: string) => {
    try {
      const response = await fetch(`${BASE_URL}/notifications/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const notifications: Notification[] = await response.json();
        // Check if there are any unread notifications
        const unread = notifications.filter(n => !n.is_read).length;
        setUnreadCount(unread);
        
        // You can also set a global notification preference
        setNotifications(true);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setLoading(true);
    try {
      // Log the logout activity
      if (userId) {
        await logActivity(userId, "logout", "User logged out");
      }
      
      // Clear user data from AsyncStorage
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("token");
      
      // Navigate to login
      router.replace("/login" as any);
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    } finally {
      setLoading(false);
      setShowLogoutModal(false);
    }
  };

  const logActivity = async (userId: number, action: string, details: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      // Using the activities endpoint from your backend
      await fetch(`${BASE_URL}/activities/user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          action: action,
          details: details
        })
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const handleDeleteAccount = (): void => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const token = await AsyncStorage.getItem("token");
              
              // Call account deletion endpoint
              const response = await fetch(`${BASE_URL}/user/delete/${userId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.ok) {
                await AsyncStorage.removeItem("user");
                await AsyncStorage.removeItem("token");
                Alert.alert("Account Deleted", "Your account has been successfully deleted.");
                router.replace("/register" as any);
              } else {
                throw new Error("Failed to delete account");
              }
            } catch (error) {
              console.error("Delete account error:", error);
              Alert.alert("Error", "Failed to delete account. Please try again.");
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);
    setShowLanguageModal(false);
    
    // Log language change activity
    if (userId) {
      await logActivity(userId, "language_changed", `Language changed to ${newLanguage}`);
    }
    
    // Here you would also save to backend if you have a preferences endpoint
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotifications(value);
    
    // Log notification preference change
    if (userId) {
      await logActivity(userId, "settings_changed", `Notifications ${value ? 'enabled' : 'disabled'}`);
    }
    
    // Here you would save to backend if you have a preferences endpoint
  };

  const navigateToActivityHistory = () => {
    if (userId) {
      navigateTo('/activity-history', { userId: userId.toString() });
    } else {
      Alert.alert('Error', 'User ID not found');
    }
  };

  const LanguageModal = () => (
    <Modal visible={showLanguageModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>Select Language</Text>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? "#FFF" : "#666"} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.languageOption, 
              language === "english" && styles.languageOptionActive,
              isDarkMode && styles.darkLanguageOption
            ]}
            onPress={() => handleLanguageChange("english")}
          >
            <Text style={[
              styles.languageText, 
              language === "english" && styles.languageTextActive,
              isDarkMode && styles.darkText
            ]}>
              🇬🇧 English
            </Text>
            {language === "english" && (
              <MaterialCommunityIcons name="check" size={20} color="#2E7D32" />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.languageOption, 
              language === "kinyarwanda" && styles.languageOptionActive,
              isDarkMode && styles.darkLanguageOption
            ]}
            onPress={() => handleLanguageChange("kinyarwanda")}
          >
            <Text style={[
              styles.languageText, 
              language === "kinyarwanda" && styles.languageTextActive,
              isDarkMode && styles.darkText
            ]}>
              🇷🇼 Kinyarwanda
            </Text>
            {language === "kinyarwanda" && (
              <MaterialCommunityIcons name="check" size={20} color="#2E7D32" />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.languageOption, 
              language === "french" && styles.languageOptionActive,
              isDarkMode && styles.darkLanguageOption
            ]}
            onPress={() => handleLanguageChange("french")}
          >
            <Text style={[
              styles.languageText, 
              language === "french" && styles.languageTextActive,
              isDarkMode && styles.darkText
            ]}>
              🇫🇷 Français
            </Text>
            {language === "french" && (
              <MaterialCommunityIcons name="check" size={20} color="#2E7D32" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const LogoutModal = () => (
    <Modal visible={showLogoutModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.logoutModal, isDarkMode && styles.darkModalContent]}>
          <View style={styles.logoutIconContainer}>
            <MaterialCommunityIcons name="logout" size={50} color="#D32F2F" />
          </View>
          <Text style={[styles.logoutTitle, isDarkMode && styles.darkText]}>Logout</Text>
          <Text style={[styles.logoutMessage, isDarkMode && styles.darkSubText]}>Are you sure you want to logout?</Text>
          
          <View style={styles.logoutButtons}>
            <TouchableOpacity 
              style={[styles.logoutCancelButton, isDarkMode && styles.darkCancelButton]} 
              onPress={() => setShowLogoutModal(false)}
              disabled={loading}
            >
              <Text style={[styles.logoutCancelText, isDarkMode && styles.darkText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.logoutConfirmButton, loading && styles.disabledButton]} 
              onPress={handleLogout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.logoutConfirmText}>Logout</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const SettingItem = ({ 
    icon, 
    label, 
    rightElement,
    onPress,
    color = "#2E7D32",
    badge
  }: { 
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
    color?: string;
    badge?: number;
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, isDarkMode && styles.darkSettingItem]} 
      onPress={onPress} 
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{label}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {rightElement || (
        <MaterialCommunityIcons name="chevron-right" size={22} color={isDarkMode ? "#AAA" : "#999"} />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title, icon, color }: SettingSection) => (
    <View style={[styles.sectionHeader, isDarkMode && styles.darkSectionHeader]}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Summary Card */}
        <TouchableOpacity 
          style={[styles.profileCard, isDarkMode && styles.darkProfileCard]}
          onPress={() => navigateTo("/profile")}
        >
          <View style={styles.profileInfo}>
            <View style={styles.profileAvatar}>
              <MaterialCommunityIcons name="account" size={30} color="#FFF" />
            </View>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, isDarkMode && styles.darkText]}>{userData.fullname}</Text>
              <Text style={[styles.profileEmail, isDarkMode && styles.darkSubText]}>{userData.email}</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={isDarkMode ? "#AAA" : "#999"} />
        </TouchableOpacity>

        {/* Preferences Section */}
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <SectionHeader title="Preferences" icon="tune" color="#2E7D32" />
          
          <SettingItem 
            icon="bell"
            label="Notifications"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: "#E0E0E0", true: "#2E7D32" }}
                thumbColor="#FFF"
              />
            }
            badge={unreadCount > 0 ? unreadCount : undefined}
          />

          <SettingItem 
            icon="theme-light-dark"
            label="Dark Mode"
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: "#E0E0E0", true: "#2E7D32" }}
                thumbColor="#FFF"
              />
            }
          />

          <SettingItem 
            icon="translate"
            label="Language"
            onPress={() => setShowLanguageModal(true)}
            rightElement={
              <View style={styles.languageDisplay}>
                <Text style={[styles.languageDisplayText, isDarkMode && styles.darkSubText]}>
                  {language === "english" ? "English" : 
                   language === "kinyarwanda" ? "Kinyarwanda" : "Français"}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color={isDarkMode ? "#AAA" : "#999"} />
              </View>
            }
          />
        </View>

        {/* Account Section */}
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <SectionHeader title="Account" icon="account-cog" color="#2E7D32" />
          
          <SettingItem 
            icon="account"
            label="Personal Information"
            onPress={() => navigateTo("/profile")}
          />

          <SettingItem 
            icon="lock"
            label="Change Password"
            onPress={() => navigateTo("/change-password")}
          />

          <SettingItem 
            icon="history"
            label="Activity History"
            onPress={navigateToActivityHistory}
          />

          <SettingItem 
            icon="security"
            label="Privacy & Security"
            onPress={() => navigateTo("/privacy-security")}
          />
        </View>

        {/* Support Section */}
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <SectionHeader title="Support" icon="help-circle" color="#2E7D32" />
          
          <SettingItem 
            icon="frequently-asked-questions"
            label="FAQ"
            onPress={() => navigateTo("/faq")}
          />

          <SettingItem 
            icon="chat"
            label="Contact Support"
            onPress={() => navigateTo("/contact-support")}
          />

          <SettingItem 
            icon="file-document"
            label="Terms & Conditions"
            onPress={() => navigateTo("/terms")}
          />

          <SettingItem 
            icon="shield"
            label="Privacy Policy"
            onPress={() => navigateTo("/privacy-policy")}
          />

          <SettingItem 
            icon="information"
            label="About"
            onPress={() => Alert.alert(
              "About AgroCare",
              "Version 1.0.0\n\nAgroCare helps farmers manage their farms efficiently with tools for tracking harvests, pests, and complaints.\n\nFor support, contact: support@agrocare.com"
            )}
          />
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <SectionHeader title="Danger Zone" icon="alert" color="#D32F2F" />
          
          <TouchableOpacity 
            style={[styles.dangerButton, isDarkMode && styles.darkDangerButton]}
            onPress={() => setShowLogoutModal(true)}
            disabled={loading}
          >
            <MaterialCommunityIcons name="logout" size={22} color="#D32F2F" />
            <Text style={styles.dangerButtonText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.dangerButton, isDarkMode && styles.darkDangerButton]}
            onPress={handleDeleteAccount}
            disabled={loading}
          >
            <MaterialCommunityIcons name="delete" size={22} color="#D32F2F" />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, isDarkMode && styles.darkSubText]}>Version 1.0.0</Text>
          <Text style={[styles.copyrightText, isDarkMode && styles.darkSubText]}>© 2024 AgroCare. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <LanguageModal />
      <LogoutModal />
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  darkProfileCard: {
    backgroundColor: "#1E1E1E",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
  },
  profileDetails: {
    gap: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  profileEmail: {
    fontSize: 13,
    color: "#666",
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  darkSection: {
    backgroundColor: "#1E1E1E",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  darkSectionHeader: {
    borderBottomColor: "#333",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  darkSettingItem: {
    borderBottomColor: "#333",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 15,
    color: "#333",
  },
  badge: {
    backgroundColor: "#D32F2F",
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  languageDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  languageDisplayText: {
    fontSize: 14,
    color: "#666",
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  darkDangerButton: {
    borderBottomColor: "#333",
  },
  dangerButtonText: {
    fontSize: 15,
    color: "#D32F2F",
    fontWeight: "500",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 11,
    color: "#CCC",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    maxWidth: 320,
  },
  darkModalContent: {
    backgroundColor: "#1E1E1E",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  darkLanguageOption: {
    backgroundColor: "#2A2A2A",
  },
  languageOptionActive: {
    backgroundColor: "#E8F5E9",
  },
  languageText: {
    fontSize: 16,
    color: "#333",
  },
  languageTextActive: {
    color: "#2E7D32",
    fontWeight: "500",
  },
  darkText: {
    color: "#FFF",
  },
  darkSubText: {
    color: "#AAA",
  },
  logoutModal: {
    alignItems: "center",
  },
  logoutIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoutTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  logoutMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  logoutButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  logoutCancelButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  darkCancelButton: {
    backgroundColor: "#2A2A2A",
  },
  logoutCancelText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  logoutConfirmButton: {
    flex: 1,
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutConfirmText: {
    fontSize: 15,
    color: "#FFF",
    fontWeight: "500",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
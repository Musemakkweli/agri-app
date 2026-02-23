import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

interface SettingSection {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("english");
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);

  const handleLogout = async (): Promise<void> => {
    try {
      // Clear user data from AsyncStorage
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("token");
      
      // Navigate to login
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  const handleDeleteAccount = (): void => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            // Handle account deletion
            Alert.alert("Account Deleted", "Your account has been deleted.");
            router.replace("/register");
          }
        },
      ]
    );
  };

  const LanguageModal = () => (
    <Modal visible={showLanguageModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.languageOption, language === "english" && styles.languageOptionActive]}
            onPress={() => {
              setLanguage("english");
              setShowLanguageModal(false);
            }}
          >
            <Text style={[styles.languageText, language === "english" && styles.languageTextActive]}>
              🇬🇧 English
            </Text>
            {language === "english" && (
              <MaterialCommunityIcons name="check" size={20} color="#2E7D32" />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.languageOption, language === "kinyarwanda" && styles.languageOptionActive]}
            onPress={() => {
              setLanguage("kinyarwanda");
              setShowLanguageModal(false);
            }}
          >
            <Text style={[styles.languageText, language === "kinyarwanda" && styles.languageTextActive]}>
              🇷🇼 Kinyarwanda
            </Text>
            {language === "kinyarwanda" && (
              <MaterialCommunityIcons name="check" size={20} color="#2E7D32" />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.languageOption, language === "french" && styles.languageOptionActive]}
            onPress={() => {
              setLanguage("french");
              setShowLanguageModal(false);
            }}
          >
            <Text style={[styles.languageText, language === "french" && styles.languageTextActive]}>
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
        <View style={[styles.modalContent, styles.logoutModal]}>
          <View style={styles.logoutIconContainer}>
            <MaterialCommunityIcons name="logout" size={50} color="#D32F2F" />
          </View>
          <Text style={styles.logoutTitle}>Logout</Text>
          <Text style={styles.logoutMessage}>Are you sure you want to logout?</Text>
          
          <View style={styles.logoutButtons}>
            <TouchableOpacity 
              style={styles.logoutCancelButton} 
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.logoutCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutConfirmButton} 
              onPress={handleLogout}
            >
              <Text style={styles.logoutConfirmText}>Logout</Text>
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
    color = "#2E7D32"
  }: { 
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {rightElement || (
        <MaterialCommunityIcons name="chevron-right" size={22} color="#999" />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title, icon, color }: SettingSection) => (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Summary Card */}
        <TouchableOpacity 
          style={styles.profileCard}
          onPress={() => router.push("/profile")}
        >
          <View style={styles.profileInfo}>
            <View style={styles.profileAvatar}>
              <MaterialCommunityIcons name="account" size={30} color="#FFF" />
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>John Farmer</Text>
              <Text style={styles.profileEmail}>john.farmer@example.com</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        {/* Preferences Section */}
        <View style={styles.section}>
          <SectionHeader title="Preferences" icon="tune" color="#2E7D32" />
          
          <SettingItem 
            icon="bell"
            label="Notifications"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "#E0E0E0", true: "#2E7D32" }}
                thumbColor="#FFF"
              />
            }
          />

          <SettingItem 
            icon="theme-light-dark"
            label="Dark Mode"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
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
                <Text style={styles.languageDisplayText}>
                  {language === "english" ? "English" : 
                   language === "kinyarwanda" ? "Kinyarwanda" : "Français"}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#999" />
              </View>
            }
          />
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <SectionHeader title="Account" icon="account-cog" color="#2E7D32" />
          
          <SettingItem 
            icon="account"
            label="Personal Information"
            onPress={() => router.push("/profile")}
          />

          <SettingItem 
            icon="lock"
            label="Change Password"
            onPress={() => Alert.alert("Coming Soon", "This feature will be available soon.")}
          />

          <SettingItem 
            icon="history"
            label="Activity History"
            onPress={() => Alert.alert("Coming Soon", "This feature will be available soon.")}
          />

          <SettingItem 
            icon="security"
            label="Privacy & Security"
            onPress={() => Alert.alert("Coming Soon", "This feature will be available soon.")}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <SectionHeader title="Support" icon="help-circle" color="#2E7D32" />
          
          <SettingItem 
            icon="frequently-asked-questions"
            label="FAQ"
            onPress={() => Alert.alert("Coming Soon", "FAQ will be available soon.")}
          />

          <SettingItem 
            icon="chat"
            label="Contact Support"
            onPress={() => Alert.alert("Coming Soon", "Support chat will be available soon.")}
          />

          <SettingItem 
            icon="file-document"
            label="Terms & Conditions"
            onPress={() => Alert.alert("Coming Soon", "Terms will be available soon.")}
          />

          <SettingItem 
            icon="shield"
            label="Privacy Policy"
            onPress={() => Alert.alert("Coming Soon", "Privacy policy will be available soon.")}
          />

          <SettingItem 
            icon="information"
            label="About"
            onPress={() => Alert.alert(
              "About AgroCare",
              "Version 1.0.0\n\nAgroCare helps farmers manage their farms efficiently with tools for tracking harvests, pests, and complaints."
            )}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <SectionHeader title="Danger Zone" icon="alert" color="#D32F2F" />
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={() => setShowLogoutModal(true)}
          >
            <MaterialCommunityIcons name="logout" size={22} color="#D32F2F" />
            <Text style={styles.dangerButtonText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleDeleteAccount}
          >
            <MaterialCommunityIcons name="delete" size={22} color="#D32F2F" />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 AgroCare. All rights reserved.</Text>
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
  header: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
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
});
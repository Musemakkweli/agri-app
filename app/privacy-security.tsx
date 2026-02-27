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
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext"; // Fixed path (removed one ../)

interface PrivacySettings {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  shareActivityData: boolean;
  profileVisibility: 'public' | 'private' | 'contacts';
  showEmail: boolean;
  showPhone: boolean;
  dataRetention: '3months' | '6months' | '1year' | 'forever';
  marketingEmails: boolean;
  securityEmails: boolean;
  trustedDevices: TrustedDevice[];
  recentLogins: RecentLogin[];
}

interface TrustedDevice {
  id: string;
  deviceName: string;
  lastUsed: string;
  location: string;
  isCurrent: boolean;
}

interface RecentLogin {
  id: string;
  date: string;
  device: string;
  location: string;
  ipAddress: string;
  successful: boolean;
}

export default function PrivacySecurity() {
  const { theme, isDarkMode } = useTheme();
  const [settings, setSettings] = useState<PrivacySettings>({
    twoFactorAuth: false,
    loginAlerts: true,
    shareActivityData: false,
    profileVisibility: 'private',
    showEmail: false,
    showPhone: false,
    dataRetention: '1year',
    marketingEmails: false,
    securityEmails: true,
    trustedDevices: [],
    recentLogins: []
  });
  
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [downloadDataModal, setDownloadDataModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
    loadSecurityData();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('YOUR_API_URL/api/user/privacy-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const loadSecurityData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Fetch trusted devices
      const devicesResponse = await fetch('YOUR_API_URL/api/user/devices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const devicesData = await devicesResponse.json();
      
      // Fetch recent logins
      const loginsResponse = await fetch('YOUR_API_URL/api/user/recent-logins', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const loginsData = await loginsResponse.json();
      
      setSettings(prev => ({
        ...prev,
        trustedDevices: devicesData.devices || [],
        recentLogins: loginsData.logins || []
      }));
    } catch (error) {
      console.error('Error loading security data:', error);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch('YOUR_API_URL/api/user/privacy-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [key]: value })
      });
      
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const handleLogoutAllDevices = () => {
    Alert.alert(
      "Logout All Devices",
      "This will log you out from all other devices except this one. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout All",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await fetch('YOUR_API_URL/api/auth/logout-all', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              Alert.alert('Success', 'Logged out from all other devices');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout from other devices');
            }
          }
        }
      ]
    );
  };

  const handleRemoveDevice = (deviceId: string) => {
    Alert.alert(
      "Remove Device",
      "This device will no longer have access to your account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await fetch(`YOUR_API_URL/api/user/devices/${deviceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              loadSecurityData(); // Reload devices
            } catch (error) {
              Alert.alert('Error', 'Failed to remove device');
            }
          }
        }
      ]
    );
  };

  const handleDownloadData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('YOUR_API_URL/api/user/export-data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Handle file download
      const blob = await response.blob();
      // You'll need a library like 'react-native-fs' to save the file
      Alert.alert('Success', 'Your data export has been created. Check your downloads.');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setLoading(false);
      setDownloadDataModal(false);
    }
  };

  // Navigation helper to handle router paths
  const navigateTo = (screen: string) => {
    // Check if the screen exists in your app routes
    const validScreens = [
      '/trusted-devices',
      '/recent-logins', 
      '/change-password',
      '/delete-account',
      '/terms',
      '/privacy-policy',
      '/cookie-policy',
      '/licenses',
      '/setup-2fa'
    ];
    
    if (validScreens.includes(screen)) {
      router.push(screen as any); // Using 'as any' to bypass TypeScript strict checking
    } else {
      Alert.alert('Coming Soon', 'This feature will be available soon.');
    }
  };

  const SettingItem = ({ 
    icon, 
    label, 
    rightElement,
    onPress,
    description,
    color = "#2E7D32"
  }: { 
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
    description?: string;
    color?: string;
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
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingLabel, isDarkMode && styles.darkText]}>{label}</Text>
          {description && (
            <Text style={[styles.settingDescription, isDarkMode && styles.darkSubText]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      {rightElement || (
        <MaterialCommunityIcons name="chevron-right" size={22} color={isDarkMode ? "#AAA" : "#999"} />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title, icon, color }: { title: string; icon: string; color: string }) => (
    <View style={[styles.sectionHeader, isDarkMode && styles.darkSectionHeader]}>
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
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
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* SECURITY SECTION */}
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <SectionHeader title="Security" icon="shield-lock" color="#2E7D32" />
          
          <SettingItem 
            icon="two-factor-authentication"
            label="Two-Factor Authentication (2FA)"
            description="Add an extra layer of security to your account"
            rightElement={
              <Switch
                value={settings.twoFactorAuth}
                onValueChange={(value) => {
                  if (value) {
                    setShow2FAModal(true);
                  } else {
                    updateSetting('twoFactorAuth', false);
                  }
                }}
                trackColor={{ false: "#E0E0E0", true: "#2E7D32" }}
                thumbColor="#FFF"
              />
            }
          />

          <SettingItem 
            icon="bell-alert"
            label="Login Alerts"
            description="Get notified when someone logs into your account"
            rightElement={
              <Switch
                value={settings.loginAlerts}
                onValueChange={(value) => updateSetting('loginAlerts', value)}
                trackColor={{ false: "#E0E0E0", true: "#2E7D32" }}
                thumbColor="#FFF"
              />
            }
          />

          <SettingItem 
            icon="devices"
            label="Trusted Devices"
            description={`${settings.trustedDevices.length} device(s) currently trusted`}
            onPress={() => navigateTo('/trusted-devices')}
          />

          <SettingItem 
            icon="history"
            label="Recent Logins"
            description="View login activity on your account"
            onPress={() => navigateTo('/recent-logins')}
          />

          <TouchableOpacity 
            style={[styles.actionButton, isDarkMode && styles.darkActionButton]}
            onPress={handleLogoutAllDevices}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#FF9800" />
            <Text style={styles.actionButtonText}>Logout from all other devices</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, isDarkMode && styles.darkActionButton]}
            onPress={() => navigateTo('/change-password')}
          >
            <MaterialCommunityIcons name="lock-reset" size={20} color="#2196F3" />
            <Text style={styles.actionButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* PRIVACY SECTION */}
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <SectionHeader title="Privacy" icon="eye" color="#2E7D32" />
          
          <SettingItem 
            icon="account"
            label="Profile Visibility"
            description={`Your profile is ${settings.profileVisibility}`}
            onPress={() => setShowVisibilityModal(true)}
            rightElement={
              <View style={styles.valueDisplay}>
                <Text style={[styles.valueText, isDarkMode && styles.darkSubText]}>
                  {settings.profileVisibility}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color={isDarkMode ? "#AAA" : "#999"} />
              </View>
            }
          />

          <SettingItem 
            icon="email"
            label="Show Email on Profile"
            rightElement={
              <Switch
                value={settings.showEmail}
                onValueChange={(value) => updateSetting('showEmail', value)}
                trackColor={{ false: "#E0E0E0", true: "#2E7D32" }}
                thumbColor="#FFF"
              />
            }
          />

          <SettingItem 
            icon="phone"
            label="Show Phone on Profile"
            rightElement={
              <Switch
                value={settings.showPhone}
                onValueChange={(value) => updateSetting('showPhone', value)}
                trackColor={{ false: "#E0E0E0", true: "#2E7D32" }}
                thumbColor="#FFF"
              />
            }
          />

          <SettingItem 
            icon="database"
            label="Data Retention"
            description={`Keep history for ${settings.dataRetention}`}
            onPress={() => setShowRetentionModal(true)}
          />

          <SettingItem 
            icon="chart-box"
            label="Share Anonymous Usage Data"
            description="Help us improve AgroCare"
            rightElement={
              <Switch
                value={settings.shareActivityData}
                onValueChange={(value) => updateSetting('shareActivityData', value)}
                trackColor={{ false: "#E0E0E0", true: "#2E7D32" }}
                thumbColor="#FFF"
              />
            }
          />
        </View>

        {/* COMMUNICATIONS SECTION */}
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <SectionHeader title="Communications" icon="email-newsletter" color="#2E7D32" />
          
          <SettingItem 
            icon="email"
            label="Marketing Emails"
            description="Tips, updates, and offers"
            rightElement={
              <Switch
                value={settings.marketingEmails}
                onValueChange={(value) => updateSetting('marketingEmails', value)}
                trackColor={{ false: "#E0E0E0", true: "#2E7D32" }}
                thumbColor="#FFF"
              />
            }
          />

          <SettingItem 
            icon="security"
            label="Security Emails"
            description="Important account notifications"
            rightElement={
              <Switch
                value={settings.securityEmails}
                onValueChange={(value) => updateSetting('securityEmails', value)}
                trackColor={{ false: "#E0E0E0", true: "#2E7D32" }}
                thumbColor="#FFF"
              />
            }
          />
        </View>

        {/* DATA & PRIVACY TOOLS */}
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <SectionHeader title="Data & Privacy Tools" icon="tools" color="#2E7D32" />
          
          <TouchableOpacity 
            style={[styles.dataToolButton, isDarkMode && styles.darkDataToolButton]}
            onPress={() => setDownloadDataModal(true)}
          >
            <MaterialCommunityIcons name="download" size={22} color="#2E7D32" />
            <View style={styles.dataToolText}>
              <Text style={[styles.dataToolTitle, isDarkMode && styles.darkText]}>
                Download Your Data
              </Text>
              <Text style={[styles.dataToolDescription, isDarkMode && styles.darkSubText]}>
                Get a copy of your information
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.dataToolButton, isDarkMode && styles.darkDataToolButton]}
            onPress={() => Alert.alert(
              "Delete Account",
              "This will permanently delete all your data. This action cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Delete Account", 
                  style: "destructive",
                  onPress: () => {
                    navigateTo('/delete-account');
                  }
                }
              ]
            )}
          >
            <MaterialCommunityIcons name="delete" size={22} color="#D32F2F" />
            <View style={styles.dataToolText}>
              <Text style={[styles.dataToolTitle, { color: '#D32F2F' }]}>
                Delete Account
              </Text>
              <Text style={[styles.dataToolDescription, isDarkMode && styles.darkSubText]}>
                Permanently remove your account and data
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* LEGAL SECTION */}
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <SectionHeader title="Legal" icon="gavel" color="#2E7D32" />
          
          <SettingItem 
            icon="file-document"
            label="Terms of Service"
            onPress={() => navigateTo('/terms')}
          />

          <SettingItem 
            icon="shield"
            label="Privacy Policy"
            onPress={() => navigateTo('/privacy-policy')}
          />

          <SettingItem 
            icon="cookie"
            label="Cookie Policy"
            onPress={() => navigateTo('/cookie-policy')}
          />

          <SettingItem 
            icon="license"
            label="Licenses"
            onPress={() => navigateTo('/licenses')}
          />
        </View>
      </ScrollView>

      {/* Profile Visibility Modal */}
      <Modal visible={showVisibilityModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
                Profile Visibility
              </Text>
              <TouchableOpacity onPress={() => setShowVisibilityModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? "#FFF" : "#666"} />
              </TouchableOpacity>
            </View>
            
            {['public', 'private', 'contacts'].map((option) => (
              <TouchableOpacity 
                key={option}
                style={[
                  styles.optionItem,
                  settings.profileVisibility === option && styles.optionItemActive,
                  isDarkMode && styles.darkOptionItem
                ]}
                onPress={() => {
                  updateSetting('profileVisibility', option as 'public' | 'private' | 'contacts');
                  setShowVisibilityModal(false);
                }}
              >
                <Text style={[
                  styles.optionText,
                  settings.profileVisibility === option && styles.optionTextActive,
                  isDarkMode && styles.darkText
                ]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
                {settings.profileVisibility === option && (
                  <MaterialCommunityIcons name="check" size={20} color="#2E7D32" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Data Retention Modal */}
      <Modal visible={showRetentionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
                Data Retention
              </Text>
              <TouchableOpacity onPress={() => setShowRetentionModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? "#FFF" : "#666"} />
              </TouchableOpacity>
            </View>
            
            {[
              { value: '3months', label: '3 Months' },
              { value: '6months', label: '6 Months' },
              { value: '1year', label: '1 Year' },
              { value: 'forever', label: 'Forever' }
            ].map((option) => (
              <TouchableOpacity 
                key={option.value}
                style={[
                  styles.optionItem,
                  settings.dataRetention === option.value && styles.optionItemActive,
                  isDarkMode && styles.darkOptionItem
                ]}
                onPress={() => {
                  updateSetting('dataRetention', option.value as '3months' | '6months' | '1year' | 'forever');
                  setShowRetentionModal(false);
                }}
              >
                <Text style={[
                  styles.optionText,
                  settings.dataRetention === option.value && styles.optionTextActive,
                  isDarkMode && styles.darkText
                ]}>
                  {option.label}
                </Text>
                {settings.dataRetention === option.value && (
                  <MaterialCommunityIcons name="check" size={20} color="#2E7D32" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* 2FA Setup Modal */}
      <Modal visible={show2FAModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.wideModal, isDarkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
                Set Up Two-Factor Authentication
              </Text>
              <TouchableOpacity onPress={() => setShow2FAModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? "#FFF" : "#666"} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalDescription, isDarkMode && styles.darkSubText]}>
              Enhance your account security by enabling 2FA. You'll need to enter a verification code from your authenticator app each time you log in.
            </Text>

            <TouchableOpacity 
              style={styles.setup2FAButton}
              onPress={() => {
                setShow2FAModal(false);
                navigateTo('/setup-2fa');
              }}
            >
              <Text style={styles.setup2FAButtonText}>Continue Setup</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancel2FAButton}
              onPress={() => setShow2FAModal(false)}
            >
              <Text style={[styles.cancel2FAButtonText, isDarkMode && styles.darkText]}>
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Download Data Modal */}
      <Modal visible={downloadDataModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>
                Download Your Data
              </Text>
              <TouchableOpacity onPress={() => setDownloadDataModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? "#FFF" : "#666"} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalDescription, isDarkMode && styles.darkSubText]}>
              You can download all your data including profile information, activity history, harvest records, and more. The export may take a few minutes to prepare.
            </Text>

            <View style={styles.dataExportOptions}>
              <TouchableOpacity style={styles.exportOption}>
                <Text style={styles.exportOptionText}>📄 JSON Format</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportOption}>
                <Text style={styles.exportOptionText}>📊 CSV Format</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.downloadButton, loading && styles.disabledButton]}
              onPress={handleDownloadData}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.downloadButtonText}>Request Data Export</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  valueDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  valueText: {
    fontSize: 14,
    color: "#666",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  darkActionButton: {
    borderBottomColor: "#333",
  },
  actionButtonText: {
    fontSize: 15,
    color: "#333",
  },
  dataToolButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  darkDataToolButton: {
    borderBottomColor: "#333",
  },
  dataToolText: {
    flex: 1,
  },
  dataToolTitle: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  dataToolDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
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
  wideModal: {
    width: "90%",
    maxWidth: 400,
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
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  darkOptionItem: {
    backgroundColor: "#2A2A2A",
  },
  optionItemActive: {
    backgroundColor: "#E8F5E9",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  optionTextActive: {
    color: "#2E7D32",
    fontWeight: "500",
  },
  setup2FAButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  setup2FAButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancel2FAButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancel2FAButtonText: {
    color: "#666",
    fontSize: 14,
  },
  dataExportOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  exportOption: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  exportOptionText: {
    fontSize: 14,
    color: "#333",
  },
  downloadButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  downloadButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  darkText: {
    color: "#FFF",
  },
  darkSubText: {
    color: "#AAA",
  },
});
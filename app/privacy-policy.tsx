import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

export default function PrivacyPolicyScreen() {
  const { isDarkMode } = useTheme();
  const [lastUpdated] = useState('January 15, 2024');

  const sections = [
    {
      id: 1,
      title: "1. Information We Collect",
      icon: "database",
      content: "We collect information you provide directly to us, such as when you create an account, update your profile, use our features, or communicate with us. This may include your name, email address, phone number, farm location, and agricultural data.",
      subsections: [
        "Account Information: Name, email, password, profile picture",
        "Agricultural Data: Harvest records, pest reports, farm locations",
        "Usage Data: How you interact with our app, features you use",
        "Device Information: IP address, device type, operating system"
      ]
    },
    {
      id: 2,
      title: "2. How We Use Your Information",
      icon: "cog",
      content: "We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to personalize your experience.",
      subsections: [
        "To provide and maintain our services",
        "To notify you about changes to our services",
        "To allow you to participate in interactive features",
        "To provide customer support",
        "To gather analysis or valuable information to improve our services",
        "To monitor the usage of our services"
      ]
    },
    {
      id: 3,
      title: "3. Sharing Your Information",
      icon: "share",
      content: "We do not sell your personal information. We may share your information in the following circumstances:",
      subsections: [
        "With your consent",
        "With service providers who perform services on our behalf",
        "To comply with legal obligations",
        "To protect and defend our rights and property",
        "In connection with a business transfer"
      ]
    },
    {
      id: 4,
      title: "4. Data Security",
      icon: "shield-lock",
      content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
      subsections: [
        "Encryption of data in transit and at rest",
        "Regular security assessments",
        "Access controls and authentication",
        "Secure data centers"
      ]
    },
    {
      id: 5,
      title: "5. Your Rights",
      icon: "account-check",
      content: "Depending on your location, you may have certain rights regarding your personal information:",
      subsections: [
        "Access your personal information",
        "Correct inaccurate information",
        "Delete your information",
        "Export your data",
        "Opt-out of marketing communications"
      ]
    },
    {
      id: 6,
      title: "6. Data Retention",
      icon: "calendar-clock",
      content: "We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. You can request deletion of your account at any time."
    },
    {
      id: 7,
      title: "7. Cookies and Tracking",
      icon: "cookie",
      content: "We use cookies and similar tracking technologies to track activity on our services and hold certain information to improve and analyze our services."
    },
    {
      id: 8,
      title: "8. Children's Privacy",
      icon: "account-child",
      content: "Our services are not intended for use by children under 13. We do not knowingly collect personal information from children under 13."
    },
    {
      id: 9,
      title: "9. International Data Transfers",
      icon: "earth",
      content: "Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers."
    },
    {
      id: 10,
      title: "10. Changes to This Policy",
      icon: "update",
      content: "We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the 'last updated' date."
    },
    {
      id: 11,
      title: "11. Contact Us",
      icon: "email",
      content: "If you have questions about this privacy policy, please contact us at:\nEmail: privacy@agrocare.com\nAddress: KG 123 St, Kigali, Rwanda\nPhone: +250 788 123 456"
    }
  ];

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Last Updated */}
      <View style={[styles.lastUpdated, isDarkMode && styles.darkLastUpdated]}>
        <MaterialCommunityIcons name="clock-outline" size={16} color="#2E7D32" />
        <Text style={[styles.lastUpdatedText, isDarkMode && styles.darkSubText]}>
          Effective Date: {lastUpdated}
        </Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Introduction */}
        <View style={[styles.introCard, isDarkMode && styles.darkIntroCard]}>
          <MaterialCommunityIcons name="shield-account" size={50} color="#2E7D32" />
          <Text style={[styles.introTitle, isDarkMode && styles.darkText]}>
            Your Privacy Matters
          </Text>
          <Text style={[styles.introText, isDarkMode && styles.darkSubText]}>
            At AgroCare, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.
          </Text>
        </View>

        {/* Quick Summary */}
        <View style={[styles.summaryCard, isDarkMode && styles.darkSummaryCard]}>
          <Text style={[styles.summaryTitle, isDarkMode && styles.darkText]}>Quick Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={[styles.summaryText, isDarkMode && styles.darkSubText]}>We don't sell your data</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={[styles.summaryText, isDarkMode && styles.darkSubText]}>You own your data</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={[styles.summaryText, isDarkMode && styles.darkSubText]}>We use encryption</Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={[styles.summaryText, isDarkMode && styles.darkSubText]}>You can export anytime</Text>
            </View>
          </View>
        </View>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.id} style={[styles.sectionCard, isDarkMode && styles.darkSectionCard]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: `${getIconColor(section.icon)}15` }]}>
                <MaterialCommunityIcons name={section.icon as any} size={22} color={getIconColor(section.icon)} />
              </View>
              <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
                {section.title}
              </Text>
            </View>
            
            <Text style={[styles.sectionContent, isDarkMode && styles.darkSubText]}>
              {section.content}
            </Text>

            {section.subsections && (
              <View style={styles.subsectionList}>
                {section.subsections.map((item, index) => (
                  <View key={index} style={styles.subsectionItem}>
                    <MaterialCommunityIcons name="circle-small" size={16} color="#2E7D32" />
                    <Text style={[styles.subsectionText, isDarkMode && styles.darkSubText]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Consent */}
        <View style={[styles.consentCard, isDarkMode && styles.darkConsentCard]}>
          <MaterialCommunityIcons name="thumb-up" size={30} color="#2E7D32" />
          <Text style={[styles.consentText, isDarkMode && styles.darkText]}>
            By using AgroCare, you consent to our Privacy Policy and agree to its terms.
          </Text>
        </View>

        {/* Download Options */}
        <View style={styles.downloadOptions}>
          <TouchableOpacity style={[styles.downloadButton, isDarkMode && styles.darkDownloadButton]}>
            <MaterialCommunityIcons name="file-pdf-box" size={20} color="#D32F2F" />
            <Text style={[styles.downloadButtonText, isDarkMode && styles.darkText]}>
              Download PDF
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.downloadButton, isDarkMode && styles.darkDownloadButton]}>
            <MaterialCommunityIcons name="email" size={20} color="#2E7D32" />
            <Text style={[styles.downloadButtonText, isDarkMode && styles.darkText]}>
              Email Copy
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getIconColor = (icon: string) => {
  const colors: Record<string, string> = {
    database: '#2196F3',
    cog: '#FF9800',
    share: '#9C27B0',
    'shield-lock': '#4CAF50',
    'account-check': '#2E7D32',
    'calendar-clock': '#FF5722',
    cookie: '#795548',
    'account-child': '#00BCD4',
    earth: '#3F51B5',
    update: '#607D8B',
    email: '#E91E63'
  };
  return colors[icon] || '#2E7D32';
};

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
  lastUpdated: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: "#E8F5E9",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  darkLastUpdated: {
    backgroundColor: "#1B5E20",
  },
  lastUpdatedText: {
    fontSize: 13,
    color: "#2E7D32",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  introCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  darkIntroCard: {
    backgroundColor: "#1E1E1E",
  },
  introTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  darkSummaryCard: {
    backgroundColor: "#1B5E20",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "45%",
  },
  summaryText: {
    fontSize: 13,
    color: "#333",
    flex: 1,
  },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  darkSectionCard: {
    backgroundColor: "#1E1E1E",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  sectionContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  subsectionList: {
    marginTop: 8,
    gap: 8,
  },
  subsectionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subsectionText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  consentCard: {
    flexDirection: "row",
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    gap: 12,
    alignItems: "center",
  },
  darkConsentCard: {
    backgroundColor: "#1B5E20",
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  downloadOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  downloadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF",
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  darkDownloadButton: {
    backgroundColor: "#1E1E1E",
  },
  downloadButtonText: {
    fontSize: 13,
    color: "#333",
  },
  footer: {
    height: 30,
  },
  darkText: {
    color: "#FFF",
  },
  darkSubText: {
    color: "#AAA",
  },
});
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

export default function TermsScreen() {
  const { isDarkMode } = useTheme();
  const [lastUpdated] = useState('January 15, 2024');

  const sections = [
    {
      id: 1,
      title: "1. Acceptance of Terms",
      content: "By accessing or using AgroCare, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access or use our services."
    },
    {
      id: 2,
      title: "2. Description of Service",
      content: "AgroCare provides a mobile application that helps farmers manage their agricultural activities including harvest tracking, pest reporting, and complaint management. We reserve the right to modify or discontinue any part of our service without prior notice."
    },
    {
      id: 3,
      title: "3. User Accounts",
      content: "You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. We are not liable for any loss or damage arising from your failure to protect your account information."
    },
    {
      id: 4,
      title: "4. User Content",
      content: "You retain ownership of any content you submit through AgroCare. By submitting content, you grant us a worldwide, royalty-free license to use, store, and display your content solely for providing and improving our services."
    },
    {
      id: 5,
      title: "5. Privacy",
      content: "Your use of AgroCare is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding your personal information."
    },
    {
      id: 6,
      title: "6. Prohibited Conduct",
      content: "You agree not to: (a) use our service for any illegal purpose; (b) harass, abuse, or harm others; (c) interfere with the security of our service; (d) attempt to gain unauthorized access to other user accounts; (e) transmit any viruses or malicious code."
    },
    {
      id: 7,
      title: "7. Intellectual Property",
      content: "The AgroCare name, logo, and all related content are trademarks of AgroCare. You may not use our trademarks without our prior written permission."
    },
    {
      id: 8,
      title: "8. Third-Party Links",
      content: "Our service may contain links to third-party websites. We are not responsible for the content or practices of these websites. Your use of third-party websites is at your own risk."
    },
    {
      id: 9,
      title: "9. Termination",
      content: "We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users or our business interests."
    },
    {
      id: 10,
      title: "10. Disclaimer of Warranties",
      content: "Our service is provided 'as is' without any warranties, express or implied. We do not guarantee that our service will be uninterrupted, secure, or error-free."
    },
    {
      id: 11,
      title: "11. Limitation of Liability",
      content: "To the maximum extent permitted by law, AgroCare shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of our service."
    },
    {
      id: 12,
      title: "12. Changes to Terms",
      content: "We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the app. Your continued use of AgroCare after such modifications constitutes your acceptance of the updated terms."
    },
    {
      id: 13,
      title: "13. Governing Law",
      content: "These Terms shall be governed by the laws of Rwanda. Any disputes arising under these Terms shall be resolved in the courts of Rwanda."
    },
    {
      id: 14,
      title: "14. Contact Information",
      content: "If you have any questions about these Terms, please contact us at:\nEmail: legal@agrocare.com\nAddress: KG 123 St, Kigali, Rwanda"
    }
  ];

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Last Updated */}
      <View style={[styles.lastUpdated, isDarkMode && styles.darkLastUpdated]}>
        <MaterialCommunityIcons name="clock-outline" size={16} color="#2E7D32" />
        <Text style={[styles.lastUpdatedText, isDarkMode && styles.darkSubText]}>
          Last Updated: {lastUpdated}
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
          <MaterialCommunityIcons name="handshake" size={40} color="#2E7D32" />
          <Text style={[styles.introTitle, isDarkMode && styles.darkText]}>
            Welcome to AgroCare
          </Text>
          <Text style={[styles.introText, isDarkMode && styles.darkSubText]}>
            Please read these terms carefully before using our application. By using AgroCare, you agree to be bound by these terms.
          </Text>
        </View>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.id} style={[styles.sectionCard, isDarkMode && styles.darkSectionCard]}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, isDarkMode && styles.darkSubText]}>
              {section.content}
            </Text>
          </View>
        ))}

        {/* Agreement */}
        <View style={[styles.agreementCard, isDarkMode && styles.darkAgreementCard]}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#2E7D32" />
          <Text style={[styles.agreementText, isDarkMode && styles.darkText]}>
            By continuing to use AgroCare, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </Text>
        </View>

        {/* Download Options */}
        <View style={styles.downloadOptions}>
          <TouchableOpacity style={[styles.downloadButton, isDarkMode && styles.darkDownloadButton]}>
            <MaterialCommunityIcons name="file-pdf-box" size={20} color="#D32F2F" />
            <Text style={[styles.downloadButtonText, isDarkMode && styles.darkText]}>
              Download as PDF
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.downloadButton, isDarkMode && styles.darkDownloadButton]}>
            <MaterialCommunityIcons name="printer" size={20} color="#2E7D32" />
            <Text style={[styles.downloadButtonText, isDarkMode && styles.darkText]}>
              Print
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer} />
      </ScrollView>
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
    padding: 20,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  agreementCard: {
    flexDirection: "row",
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    gap: 12,
    alignItems: "center",
  },
  darkAgreementCard: {
    backgroundColor: "#1B5E20",
  },
  agreementText: {
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
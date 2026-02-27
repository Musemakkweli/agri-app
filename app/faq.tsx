import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'account' | 'harvest' | 'pest' | 'payment' | 'technical';
}

export default function FAQScreen() {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All', icon: 'view-grid' },
    { id: 'general', label: 'General', icon: 'help-circle' },
    { id: 'account', label: 'Account', icon: 'account' },
    { id: 'harvest', label: 'Harvest', icon: 'sprout' },
    { id: 'pest', label: 'Pest Control', icon: 'bug' },
    { id: 'technical', label: 'Technical', icon: 'cog' },
  ];

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: 'How do I create an account?',
      answer: 'To create an account, click on the "Sign Up" button on the login screen. Fill in your details including name, email, and password. You\'ll receive a verification email to confirm your account.',
      category: 'account'
    },
    {
      id: '2',
      question: 'How do I reset my password?',
      answer: 'Go to the login screen and click "Forgot Password". Enter your email address and we\'ll send you a password reset link. Follow the instructions in the email to set a new password.',
      category: 'account'
    },
    {
      id: '3',
      question: 'How do I add a new harvest record?',
      answer: 'Navigate to the Harvests tab and tap the "+" button. Fill in the details like crop type, quantity, date, and any notes. You can also add photos of your harvest. Tap "Save" to record it.',
      category: 'harvest'
    },
    {
      id: '4',
      question: 'Can I export my harvest data?',
      answer: 'Yes! Go to Settings > Privacy & Security > Download Your Data. You can export your data in JSON or CSV format. The export will include all your harvest records, pest reports, and activity history.',
      category: 'harvest'
    },
    {
      id: '5',
      question: 'How do I report a pest issue?',
      answer: 'Go to the Pest Control section and tap "Report Pest". Take a photo of the affected crop, describe the problem, and select the severity. Our experts will review and provide recommendations.',
      category: 'pest'
    },
    {
      id: '6',
      question: 'Is my data secure?',
      answer: 'Absolutely! We use industry-standard encryption to protect your data. Your personal information is never shared with third parties without your consent. You can enable two-factor authentication for extra security.',
      category: 'technical'
    },
    {
      id: '7',
      question: 'How do I change my notification settings?',
      answer: 'Go to Settings > Preferences. You can toggle notifications on/off, choose which types of alerts you receive, and set quiet hours when you don\'t want to be disturbed.',
      category: 'general'
    },
    {
      id: '8',
      question: 'Can I use the app offline?',
      answer: 'Yes! The app works offline. Your data is stored locally on your device and syncs automatically when you\'re back online. You can view past records and add new ones even without internet.',
      category: 'technical'
    },
    {
      id: '9',
      question: 'How do I delete my account?',
      answer: 'Go to Settings > Privacy & Security > Delete Account. Please note that this action is permanent and cannot be undone. All your data will be permanently removed from our servers.',
      category: 'account'
    },
    {
      id: '10',
      question: 'How do I contact support?',
      answer: 'You can reach us through the Contact Support section in Settings. We offer live chat during business hours, email support, and you can schedule a call with our team.',
      category: 'general'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, isDarkMode && styles.darkSearchContainer]}>
        <MaterialCommunityIcons name="magnify" size={20} color={isDarkMode ? "#AAA" : "#999"} />
        <TextInput
          style={[styles.searchInput, isDarkMode && styles.darkText]}
          placeholder="Search FAQs..."
          placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close" size={20} color={isDarkMode ? "#AAA" : "#999"} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
              isDarkMode && styles.darkCategoryChip
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <MaterialCommunityIcons 
              name={cat.icon as any} 
              size={18} 
              color={selectedCategory === cat.id ? "#FFF" : (isDarkMode ? "#AAA" : "#666")} 
            />
            <Text style={[
              styles.categoryChipText,
              selectedCategory === cat.id && styles.categoryChipTextActive,
              isDarkMode && styles.darkText
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAQs List */}
      <ScrollView style={styles.faqList} showsVerticalScrollIndicator={false}>
        {filteredFaqs.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="help-circle-outline" size={60} color={isDarkMode ? "#AAA" : "#999"} />
            <Text style={[styles.emptyStateText, isDarkMode && styles.darkText]}>
              No FAQs found
            </Text>
            <Text style={[styles.emptyStateSubText, isDarkMode && styles.darkSubText]}>
              Try adjusting your search or category
            </Text>
          </View>
        ) : (
          filteredFaqs.map((faq) => (
            <View key={faq.id} style={[styles.faqItem, isDarkMode && styles.darkFaqItem]}>
              <TouchableOpacity 
                style={styles.faqQuestion}
                onPress={() => toggleExpand(faq.id)}
                activeOpacity={0.7}
              >
                <View style={styles.faqQuestionLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(faq.category) }]} />
                  <Text style={[styles.questionText, isDarkMode && styles.darkText]}>
                    {faq.question}
                  </Text>
                </View>
                <MaterialCommunityIcons 
                  name={expandedId === faq.id ? "chevron-up" : "chevron-down"} 
                  size={22} 
                  color={isDarkMode ? "#AAA" : "#999"} 
                />
              </TouchableOpacity>
              
              {expandedId === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={[styles.answerText, isDarkMode && styles.darkSubText]}>
                    {faq.answer}
                  </Text>
                  <View style={styles.answerFooter}>
                    <Text style={styles.helpfulText}>Was this helpful?</Text>
                    <View style={styles.helpfulButtons}>
                      <TouchableOpacity style={styles.helpfulButton}>
                        <MaterialCommunityIcons name="thumb-up" size={18} color="#2E7D32" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.helpfulButton}>
                        <MaterialCommunityIcons name="thumb-down" size={18} color="#D32F2F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))
        )}

        {/* Still Need Help Section */}
        <View style={[styles.helpSection, isDarkMode && styles.darkHelpSection]}>
          <MaterialCommunityIcons name="help-circle" size={40} color="#2E7D32" />
          <Text style={[styles.helpTitle, isDarkMode && styles.darkText]}>Still need help?</Text>
          <Text style={[styles.helpDescription, isDarkMode && styles.darkSubText]}>
            Can't find what you're looking for? Contact our support team.
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => router.push('/contact-support')}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getCategoryColor = (category: string) => {
  const colors = {
    general: '#2E7D32',
    account: '#2196F3',
    harvest: '#FF9800',
    pest: '#D32F2F',
    technical: '#9C27B0'
  };
  return colors[category as keyof typeof colors] || '#757575';
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkSearchContainer: {
    backgroundColor: "#1E1E1E",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  darkCategoryChip: {
    backgroundColor: "#1E1E1E",
  },
  categoryChipActive: {
    backgroundColor: "#2E7D32",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#666",
  },
  categoryChipTextActive: {
    color: "#FFF",
  },
  faqList: {
    flex: 1,
    padding: 16,
  },
  faqItem: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkFaqItem: {
    backgroundColor: "#1E1E1E",
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  faqAnswer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  answerText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  answerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  helpfulText: {
    fontSize: 13,
    color: "#999",
  },
  helpfulButtons: {
    flexDirection: "row",
    gap: 12,
  },
  helpfulButton: {
    padding: 6,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  helpSection: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 24,
    marginTop: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkHelpSection: {
    backgroundColor: "#1E1E1E",
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 12,
    marginBottom: 8,
  },
  helpDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  darkText: {
    color: "#FFF",
  },
  darkSubText: {
    color: "#AAA",
  },
});
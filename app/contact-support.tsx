import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

type SupportTicket = {
  subject: string;
  category: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  attachments?: any[];
};

export default function ContactSupportScreen() {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'chat' | 'email' | 'faq'>('email');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<SupportTicket>({
    subject: '',
    category: 'general',
    message: '',
    priority: 'medium'
  });
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{text: string, sender: 'user' | 'bot', time: string}>>([
    {
      text: "Hello! How can I help you today?",
      sender: 'bot',
      time: new Date().toLocaleTimeString()
    }
  ]);

  const categories = [
    { id: 'general', label: 'General Inquiry', icon: 'help-circle' },
    { id: 'technical', label: 'Technical Issue', icon: 'cog' },
    { id: 'account', label: 'Account Problem', icon: 'account' },
    { id: 'billing', label: 'Billing Question', icon: 'currency-usd' },
    { id: 'feature', label: 'Feature Request', icon: 'lightbulb' },
    { id: 'bug', label: 'Report a Bug', icon: 'bug' },
  ];

  const quickReplies = [
    "I forgot my password",
    "App is crashing",
    "How to add harvest?",
    "Payment issue",
  ];

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    // Add user message
    setChatMessages(prev => [...prev, {
      text: chatMessage,
      sender: 'user',
      time: new Date().toLocaleTimeString()
    }]);

    // Simulate bot response
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        text: "Thanks for your message. Our support team will get back to you shortly. For urgent issues, please use the email support option.",
        sender: 'bot',
        time: new Date().toLocaleTimeString()
      }]);
    }, 1000);

    setChatMessage('');
  };

  const handleSubmitTicket = async () => {
    if (!ticket.subject.trim() || !ticket.message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('YOUR_API_URL/api/support/ticket', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticket)
      });

      if (response.ok) {
        Alert.alert(
          'Ticket Submitted',
          'Your support ticket has been submitted. We\'ll get back to you within 24 hours.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+250788123456');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@agrocare.com?subject=Support%20Request');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/250788123456');
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Quick Contact Options */}
      <View style={[styles.quickContactContainer, isDarkMode && styles.darkQuickContact]}>
        <TouchableOpacity style={styles.quickContactItem} onPress={handleCallSupport}>
          <View style={[styles.quickContactIcon, { backgroundColor: '#4CAF50' }]}>
            <MaterialCommunityIcons name="phone" size={24} color="#FFF" />
          </View>
          <Text style={[styles.quickContactLabel, isDarkMode && styles.darkText]}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickContactItem} onPress={handleEmailSupport}>
          <View style={[styles.quickContactIcon, { backgroundColor: '#2196F3' }]}>
            <MaterialCommunityIcons name="email" size={24} color="#FFF" />
          </View>
          <Text style={[styles.quickContactLabel, isDarkMode && styles.darkText]}>Email</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickContactItem} onPress={handleWhatsApp}>
          <View style={[styles.quickContactIcon, { backgroundColor: '#25D366' }]}>
            <MaterialCommunityIcons name="whatsapp" size={24} color="#FFF" />
          </View>
          <Text style={[styles.quickContactLabel, isDarkMode && styles.darkText]}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickContactItem}>
          <View style={[styles.quickContactIcon, { backgroundColor: '#FF9800' }]}>
            <MaterialCommunityIcons name="chat" size={24} color="#FFF" />
          </View>
          <Text style={[styles.quickContactLabel, isDarkMode && styles.darkText]}>Live Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, isDarkMode && styles.darkTabContainer]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'email' && styles.activeTab]}
          onPress={() => setActiveTab('email')}
        >
          <MaterialCommunityIcons 
            name="email" 
            size={20} 
            color={activeTab === 'email' ? '#2E7D32' : (isDarkMode ? '#AAA' : '#999')} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'email' && styles.activeTabText,
            isDarkMode && styles.darkText
          ]}>
            Email Ticket
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <MaterialCommunityIcons 
            name="chat" 
            size={20} 
            color={activeTab === 'chat' ? '#2E7D32' : (isDarkMode ? '#AAA' : '#999')} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'chat' && styles.activeTabText,
            isDarkMode && styles.darkText
          ]}>
            Live Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'faq' && styles.activeTab]}
          onPress={() => {
            setActiveTab('faq');
            router.push('/faq');
          }}
        >
          <MaterialCommunityIcons 
            name="frequently-asked-questions" 
            size={20} 
            color={activeTab === 'faq' ? '#2E7D32' : (isDarkMode ? '#AAA' : '#999')} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'faq' && styles.activeTabText,
            isDarkMode && styles.darkText
          ]}>
            FAQ
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'email' && (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          {/* Subject Input */}
          <View style={[styles.inputGroup, isDarkMode && styles.darkInputGroup]}>
            <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>Subject *</Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.darkInput]}
              placeholder="Brief summary of your issue"
              placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
              value={ticket.subject}
              onChangeText={(text) => setTicket({...ticket, subject: text})}
            />
          </View>

          {/* Category Selection */}
          <View style={[styles.inputGroup, isDarkMode && styles.darkInputGroup]}>
            <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    ticket.category === cat.id && styles.categoryChipActive,
                    isDarkMode && styles.darkCategoryChip
                  ]}
                  onPress={() => setTicket({...ticket, category: cat.id})}
                >
                  <MaterialCommunityIcons 
                    name={cat.icon as any} 
                    size={16} 
                    color={ticket.category === cat.id ? "#FFF" : (isDarkMode ? "#AAA" : "#666")} 
                  />
                  <Text style={[
                    styles.categoryChipText,
                    ticket.category === cat.id && styles.categoryChipTextActive,
                    isDarkMode && styles.darkText
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Priority Selection */}
          <View style={[styles.inputGroup, isDarkMode && styles.darkInputGroup]}>
            <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>Priority</Text>
            <View style={styles.priorityContainer}>
              {['low', 'medium', 'high'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityOption,
                    ticket.priority === priority && styles.priorityOptionActive,
                    ticket.priority === priority && { 
                      backgroundColor: priority === 'high' ? '#D32F2F' : 
                                     priority === 'medium' ? '#FF9800' : '#4CAF50' 
                    },
                    isDarkMode && styles.darkPriorityOption
                  ]}
                  onPress={() => setTicket({...ticket, priority: priority as 'low' | 'medium' | 'high'})}
                >
                  <Text style={[
                    styles.priorityText,
                    ticket.priority === priority && styles.priorityTextActive,
                    isDarkMode && styles.darkText
                  ]}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Message Input */}
          <View style={[styles.inputGroup, isDarkMode && styles.darkInputGroup]}>
            <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>Message *</Text>
            <TextInput
              style={[styles.textArea, isDarkMode && styles.darkInput]}
              placeholder="Describe your issue in detail..."
              placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              value={ticket.message}
              onChangeText={(text) => setTicket({...ticket, message: text})}
            />
          </View>

          {/* Attachment Option */}
          <TouchableOpacity style={[styles.attachmentButton, isDarkMode && styles.darkAttachmentButton]}>
            <MaterialCommunityIcons name="attachment" size={20} color="#2E7D32" />
            <Text style={[styles.attachmentText, isDarkMode && styles.darkText]}>
              Add Screenshots or Files (Optional)
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmitTicket}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>Submit Ticket</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Response Time Note */}
          <View style={styles.responseNote}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#999" />
            <Text style={[styles.responseNoteText, isDarkMode && styles.darkSubText]}>
              Average response time: 24 hours
            </Text>
          </View>
        </ScrollView>
      )}

      {activeTab === 'chat' && (
        <View style={styles.chatContainer}>
          {/* Chat Messages */}
          <ScrollView style={styles.chatMessages} contentContainerStyle={styles.chatMessagesContent}>
            {chatMessages.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.messageWrapper,
                  msg.sender === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper
                ]}
              >
                {msg.sender === 'bot' && (
                  <View style={styles.botAvatar}>
                    <MaterialCommunityIcons name="robot" size={20} color="#2E7D32" />
                  </View>
                )}
                <View style={[
                  styles.messageBubble,
                  msg.sender === 'user' ? styles.userMessage : styles.botMessage,
                  isDarkMode && (msg.sender === 'user' ? styles.darkUserMessage : styles.darkBotMessage)
                ]}>
                  <Text style={[
                    styles.messageText,
                    msg.sender === 'user' ? styles.userMessageText : styles.botMessageText,
                    isDarkMode && styles.darkText
                  ]}>
                    {msg.text}
                  </Text>
                  <Text style={styles.messageTime}>{msg.time}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Quick Replies */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickReplies}>
            {quickReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickReplyChip, isDarkMode && styles.darkQuickReplyChip]}
                onPress={() => setChatMessage(reply)}
              >
                <Text style={[styles.quickReplyText, isDarkMode && styles.darkText]}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chat Input */}
          <View style={[styles.chatInputContainer, isDarkMode && styles.darkChatInputContainer]}>
            <TextInput
              style={[styles.chatInput, isDarkMode && styles.darkInput]}
              placeholder="Type your message..."
              placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
              value={chatMessage}
              onChangeText={setChatMessage}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, !chatMessage.trim() && styles.disabledSendButton]}
              onPress={handleSendMessage}
              disabled={!chatMessage.trim()}
            >
              <MaterialCommunityIcons name="send" size={22} color={chatMessage.trim() ? "#2E7D32" : "#999"} />
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  quickContactContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFF",
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkQuickContact: {
    backgroundColor: "#1E1E1E",
  },
  quickContactItem: {
    alignItems: "center",
  },
  quickContactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickContactLabel: {
    fontSize: 12,
    color: "#333",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkTabContainer: {
    backgroundColor: "#1E1E1E",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#E8F5E9",
  },
  tabText: {
    fontSize: 13,
    color: "#666",
  },
  activeTabText: {
    color: "#2E7D32",
    fontWeight: "500",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  darkInputGroup: {
    // Dark mode styles
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#333",
  },
  darkInput: {
    backgroundColor: "#1E1E1E",
    borderColor: "#333",
    color: "#FFF",
  },
  textArea: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#333",
    minHeight: 150,
  },
  categoryList: {
    flexDirection: "row",
    marginBottom: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  darkCategoryChip: {
    backgroundColor: "#2A2A2A",
  },
  categoryChipActive: {
    backgroundColor: "#2E7D32",
  },
  categoryChipText: {
    fontSize: 13,
    color: "#666",
  },
  categoryChipTextActive: {
    color: "#FFF",
  },
  priorityContainer: {
    flexDirection: "row",
    gap: 10,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "transparent",
  },
  darkPriorityOption: {
    backgroundColor: "#2A2A2A",
  },
  priorityOptionActive: {
    borderColor: "transparent",
  },
  priorityText: {
    fontSize: 14,
    color: "#666",
  },
  priorityTextActive: {
    color: "#FFF",
    fontWeight: "500",
  },
  attachmentButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 20,
  },
  darkAttachmentButton: {
    // Dark mode styles
  },
  attachmentText: {
    fontSize: 14,
    color: "#2E7D32",
  },
  submitButton: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  responseNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 30,
  },
  responseNoteText: {
    fontSize: 12,
    color: "#999",
  },
  chatContainer: {
    flex: 1,
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatMessagesContent: {
    paddingVertical: 16,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 16,
  },
  userMessageWrapper: {
    justifyContent: "flex-end",
  },
  botMessageWrapper: {
    justifyContent: "flex-start",
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    alignSelf: "flex-end",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: "#2E7D32",
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: "#F5F5F5",
    borderBottomLeftRadius: 4,
  },
  darkUserMessage: {
    backgroundColor: "#1B5E20",
  },
  darkBotMessage: {
    backgroundColor: "#2A2A2A",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  userMessageText: {
    color: "#FFF",
  },
  botMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 10,
    color: "#999",
    alignSelf: "flex-end",
  },
  quickReplies: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  quickReplyChip: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  darkQuickReplyChip: {
    backgroundColor: "#2A2A2A",
  },
  quickReplyText: {
    fontSize: 13,
    color: "#333",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  darkChatInputContainer: {
    backgroundColor: "#1E1E1E",
    borderTopColor: "#333",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledSendButton: {
    opacity: 0.5,
  },
  darkText: {
    color: "#FFF",
  },
  darkSubText: {
    color: "#AAA",
  },
});
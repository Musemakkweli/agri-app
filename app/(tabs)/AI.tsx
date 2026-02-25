import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '../../context/ThemeContext';
import BASE_URL from "../../services/api";

// Define types
interface User {
  id: number;
  fullname: string;
  email: string;
}

interface ChatMessage {
  id?: string;
  sender: "user" | "ai";
  text: string;
  image_url?: string | null;
  timestamp: string;
}

interface ChatHistory {
  id: number;
  title: string;
  messages: ChatMessage[];
  created_at: string;
}

interface AnalyzeResponse {
  disease?: string | null;
  confidence?: number | null;
  description?: string | null;
  treatment?: string[] | null;
  recommendations?: string[] | null;
  message?: string;
  is_plant?: boolean;
  affected_parts?: string | null;
  severity?: string | null;
}

// Add interface for history response based on your schema
interface AIChatHistoryOut {
  id: number;
  user_id: number;
  user_message: string;
  ai_response: string;
  image_url: string | null;
  created_at: string;
}

// Storage keys
const CHAT_HISTORY_STORAGE_KEY = '@ai_chat_history';

export default function AIChatScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatHistory | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const { isDarkMode } = useTheme();

  const API_URL = "https://menya-leaf-ai-api.onrender.com/analyze";

  // Check network connectivity using NetInfo
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      console.log("Network state:", state);
    });

    // Check initial connection
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Get auth token
  const getToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
  };

  // Load chat history from AsyncStorage
  const loadLocalHistory = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (!userStr) return;
      
      const userData = JSON.parse(userStr);
      const historyKey = `${CHAT_HISTORY_STORAGE_KEY}_${userData.id}`;
      const savedHistory = await AsyncStorage.getItem(historyKey);
      
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        console.log("Loaded history from local storage:", parsedHistory.length, "chats");
      }
    } catch (error) {
      console.error("Error loading local history:", error);
    }
  };

  // Save chat history to AsyncStorage
  const saveLocalHistory = async (newHistory: ChatHistory[]) => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (!userStr) return;
      
      const userData = JSON.parse(userStr);
      const historyKey = `${CHAT_HISTORY_STORAGE_KEY}_${userData.id}`;
      await AsyncStorage.setItem(historyKey, JSON.stringify(newHistory));
      console.log("Saved history to local storage");
    } catch (error) {
      console.error("Error saving local history:", error);
    }
  };

  // Load user from storage
  const loadUser = async () => {
    try {
      setLoading(true);
      
      const token = await getToken();
      const userStr = await AsyncStorage.getItem("user");
      
      if (!token || !userStr) {
        Alert.alert("Error", "Please login again", [
          { text: "OK", onPress: () => router.push("/login") }
        ]);
        return;
      }

      const userData = JSON.parse(userStr);
      setUser({
        id: userData.id,
        fullname: userData.fullname,
        email: userData.email,
      });

      // Load history from local storage first
      await loadLocalHistory();
      
      // Then try to fetch from server
      await fetchChatHistory(userData.id);
    } catch (error) {
      console.error("Error loading user:", error);
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Fetch chat history from server - FIXED URL
  const fetchChatHistory = async (userId: number) => {
    try {
      const token = await getToken();
      // CORRECT URL: /ai/chat/{user_id}
      const HISTORY_GET_URL = `${BASE_URL}/ai/chat/${userId}`;
      console.log("Fetching history from:", HISTORY_GET_URL);
      
      const response = await axios.get<AIChatHistoryOut[]>(HISTORY_GET_URL, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      console.log("History response:", response.data);

      if (response.data && Array.isArray(response.data)) {
        const formatted: ChatHistory[] = response.data.map((item) => ({
          id: item.id,
          title: item.user_message?.slice(0, 30) || "New Chat",
          messages: [
            {
              sender: "user" as const,
              text: item.user_message || "Analyzing plant image...",
              image_url: item.image_url,
              timestamp: item.created_at
            },
            {
              sender: "ai" as const,
              text: item.ai_response || "Analysis complete",
              timestamp: item.created_at
            }
          ],
          created_at: item.created_at
        }));
        
        // Update history with server data
        setHistory(formatted);
        await saveLocalHistory(formatted);
      }
    } catch (error: any) {
      console.log("Server history fetch failed:", error.message);
      // Don't show alert, just use local history
    }
  };

  // Load specific chat
  const loadChat = (chat: ChatHistory) => {
    setMessages(chat.messages);
    setSelectedChat(chat);
    setShowHistory(false);
    setImagePreview(null);
    setImageFile(null);
  };

  // Start new chat
  const startNewChat = () => {
    setMessages([]);
    setInputText("");
    setImagePreview(null);
    setImageFile(null);
    setSelectedChat(null);
    setShowHistory(false);
  };

  // Pick image from library
  const pickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required", 
          "Please grant camera roll permissions to upload images.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "OK" }
          ]
        );
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImagePreview(asset.uri);
        setImageFile(asset);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  // Take photo with camera - OPENS CAMERA DIRECTLY
  const takePhoto = async () => {
    try {
      console.log("Opening camera...");
      
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required", 
          "Please grant camera permissions to take photos.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "OK" }
          ]
        );
        return;
      }

      // Launch camera directly
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      console.log("Camera result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log("Photo taken:", asset.uri);
        setImagePreview(asset.uri);
        setImageFile(asset);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      
      // Check if it's a simulator/emulator error
      if (Platform.OS === 'ios') {
        Alert.alert(
          "Camera Not Available", 
          "Camera is not available on iOS simulator. Please test on a real device or use the gallery option."
        );
      } else if (Platform.OS === 'android') {
        Alert.alert(
          "Camera Error", 
          "Failed to open camera. Please make sure your emulator has camera support or test on a real device."
        );
      } else {
        Alert.alert(
          "Camera Error", 
          "Failed to take photo. Please use the gallery option instead."
        );
      }
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  // Format the analysis response into a readable message
  const formatAnalysisResponse = (data: AnalyzeResponse): string => {
    if (data.message) {
      return `🌱 ${data.message}`;
    }

    if (data.is_plant === false) {
      return "🌱 This doesn't appear to be a plant. Please upload a clear photo of a plant leaf.";
    }

    if (data.disease) {
      let response = `🌱 **Disease detected:** ${data.disease}\n\n`;
      
      if (data.confidence) {
        response += `**Confidence:** ${data.confidence}%\n\n`;
      }
      
      if (data.severity) {
        response += `**Severity:** ${data.severity}\n\n`;
      }
      
      if (data.affected_parts) {
        response += `**Affected parts:** ${data.affected_parts}\n\n`;
      }
      
      if (data.description) {
        response += `**Description:** ${data.description}\n\n`;
      }
      
      if (data.treatment || data.recommendations) {
        response += `**Recommendations:**\n`;
        const treatments = data.treatment || data.recommendations || [];
        if (Array.isArray(treatments) && treatments.length > 0) {
          response += treatments.map(t => `• ${t}`).join("\n");
        } else if (treatments) {
          response += `• ${treatments}`;
        }
      }
      
      return response;
    }

    return "🌱 No disease detected. Your plant looks healthy!";
  };

  // Send message for analysis
  const handleSend = async () => {
    if (!user) {
      Alert.alert("Error", "Please login first");
      router.push("/login");
      return;
    }

    if (!imageFile) {
      Alert.alert("Info", "Please upload an image of the plant leaf first.");
      return;
    }

    // Check network first using NetInfo
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      Alert.alert(
        "Network Error", 
        "No internet connection. Please check your connection and try again."
      );
      return;
    }

    try {
      setSending(true);

      // Add user message
      const userMessage: ChatMessage = {
        sender: "user",
        text: inputText || "Analyzing plant image...",
        image_url: imagePreview,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);

      // Add analyzing message
      const analyzingMessage: ChatMessage = {
        sender: "ai",
        text: "⏳ Analyzing your image... This may take up to 60 seconds. Please wait.",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, analyzingMessage]);

      // Scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

      const formData = new FormData();

      // Append user_id as a simple text field
      formData.append("user_id", String(user.id));
      
      // Append the file with the correct field name 'file'
      if (Platform.OS === 'web') {
        const response = await fetch(imageFile.uri);
        const blob = await response.blob();
        const file = new File([blob], `plant_${Date.now()}.jpg`, { type: 'image/jpeg' });
        formData.append('file', file);
      } else {
        // For React Native
        formData.append('file', {
          uri: imageFile.uri,
          type: 'image/jpeg',
          name: `plant_${Date.now()}.jpg`,
        } as any);
      }

      console.log("Sending to API:", API_URL);
      console.log("User ID:", user.id);

      const response = await axios.post<AnalyzeResponse>(
        API_URL,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        }
      );

      console.log("Analysis response:", response.data);

      // Remove analyzing message
      setMessages(prev => prev.filter(msg => msg.text !== analyzingMessage.text));

      // Format AI response using the new formatter
      const answerText = formatAnalysisResponse(response.data);

      const aiMessage: ChatMessage = {
        sender: "ai",
        text: answerText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Create new chat entry
      const newChat: ChatHistory = {
        id: Date.now(), // Use timestamp as ID for local storage
        title: (inputText || "Plant Analysis").slice(0, 30),
        messages: [userMessage, aiMessage],
        created_at: new Date().toISOString()
      };

      // Update history state
      const updatedHistory = [newChat, ...history];
      setHistory(updatedHistory);
      setSelectedChat(newChat);

      // Save to local storage immediately
      await saveLocalHistory(updatedHistory);

      // Try to save to server - FIXED URL
      try {
        const token = await getToken();
        if (token) {
          // CORRECT URL: /ai-chat (from your warmup endpoint)
          const HISTORY_POST_URL = `${BASE_URL}/ai-chat`;
          console.log("Saving to server:", HISTORY_POST_URL);
          
          // Fire and forget - don't await
          axios.post<{id: number}>(
            HISTORY_POST_URL,
            {
              user_id: user.id,
              user_message: inputText || "Analyzing plant image...",
              ai_response: answerText,
              image_url: imagePreview,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000,
            }
          ).then(response => {
            // If server save succeeds, update the ID
            if (response.data && response.data.id) {
              const updatedWithServerId = updatedHistory.map(chat => 
                chat.id === newChat.id ? { ...chat, id: response.data.id } : chat
              );
              setHistory(updatedWithServerId);
              saveLocalHistory(updatedWithServerId);
              console.log("Successfully saved to server with ID:", response.data.id);
            }
          }).catch(err => {
            console.log("Server save failed (this is okay):", err.message);
          });
        }
      } catch (saveErr) {
        // Ignore server save errors
        console.log("Server save error (ignored)");
      }

      // Show success for the analysis
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);

      // Clear input and image
      setInputText("");
      setImagePreview(null);
      setImageFile(null);

    } catch (error: any) {
      console.error("Analysis error details:", {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Remove analyzing message
      setMessages(prev => prev.filter(msg => !msg.text.includes("⏳")));

      let errorMessage = "🌱 Sorry, an error occurred while analyzing the image.";
      let errorTitle = "Error";

      if (error.code === 'ECONNABORTED') {
        errorTitle = "Timeout";
        errorMessage = "🌱 The analysis is taking too long. Please try again with a smaller image.";
      } else if (error.message === 'Network Error') {
        errorTitle = "Network Error";
        errorMessage = "🌱 Cannot connect to the server. Please check your internet connection.";
      } else if (error.response?.status === 422) {
        errorTitle = "Invalid Image";
        errorMessage = "🌱 Invalid image format. Please upload a clear photo of a plant leaf.";
      } else if (error.response?.data?.message) {
        errorMessage = `🌱 ${error.response.data.message}`;
      }

      // Show alert with error details
      Alert.alert(errorTitle, errorMessage, [
        { text: "OK" },
        { 
          text: "Retry", 
          onPress: () => handleSend() 
        }
      ]);

      const errorAiMessage: ChatMessage = {
        sender: "ai",
        text: errorMessage,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [
        ...prev,
        errorAiMessage
      ]);
    } finally {
      setSending(false);
    }
  };

  // Format message text with bold
  const renderMessageText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={{ fontWeight: 'bold' }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Plant Doctor</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.loadingContainer, isDarkMode && styles.darkContainer]}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Plant Doctor</Text>
        <TouchableOpacity onPress={() => setShowHistory(true)}>
          <MaterialCommunityIcons name="history" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Network Status Indicator */}
      {isConnected === false && (
        <View style={[styles.networkWarning, isDarkMode && styles.darkNetworkWarning]}>
          <MaterialCommunityIcons name="wifi-off" size={16} color="#FF4444" />
          <Text style={styles.networkWarningText}>No internet connection</Text>
        </View>
      )}

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.historyModal, isDarkMode && styles.darkHistoryModal]}>
            <View style={[styles.modalHeader, isDarkMode && styles.darkModalHeader]}>
              <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>Chat History</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? "#FFF" : "#333"} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={history}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.historyItem,
                    selectedChat?.id === item.id && styles.selectedHistoryItem,
                    isDarkMode && styles.darkHistoryItem,
                  ]}
                  onPress={() => loadChat(item)}
                >
                  <MaterialCommunityIcons 
                    name="chat" 
                    size={20} 
                    color={selectedChat?.id === item.id ? "#2E7D32" : isDarkMode ? "#AAA" : "#666"} 
                  />
                  <View style={styles.historyItemContent}>
                    <Text style={[styles.historyItemTitle, isDarkMode && styles.darkText]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.historyItemDate, isDarkMode && styles.darkSubText]}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyHistory}>
                  <MaterialCommunityIcons name="chat-outline" size={50} color={isDarkMode ? "#555" : "#CCC"} />
                  <Text style={[styles.emptyHistoryText, isDarkMode && styles.darkSubText]}>No chats yet</Text>
                </View>
              }
            />

            <TouchableOpacity style={styles.newChatButton} onPress={startNewChat}>
              <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
              <Text style={styles.newChatButtonText}>New Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Chat Area */}
      <KeyboardAvoidingView 
        style={[styles.chatContainer, isDarkMode && styles.darkContainer]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Input Area - MOVED TO TOP */}
        <View style={[styles.inputWrapper, isDarkMode && styles.darkInputWrapper]}>
          {/* Image buttons row */}
          <View style={[styles.imageButtonsContainer, isDarkMode && styles.darkImageButtonsContainer]}>
            <TouchableOpacity 
              style={[styles.imageButton, (!user || sending) && styles.disabledButton, isDarkMode && styles.darkImageButton]}
              onPress={pickImage}
              disabled={sending || !user}
            >
              <MaterialCommunityIcons 
                name="image" 
                size={22} 
                color={!user || sending ? "#CCC" : "#2E7D32"} 
              />
              <Text style={[styles.imageButtonText, (!user || sending) && styles.disabledText, isDarkMode && styles.darkText]}>
                Gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.imageButton, (!user || sending) && styles.disabledButton, isDarkMode && styles.darkImageButton]}
              onPress={takePhoto}
              disabled={sending || !user}
            >
              <MaterialCommunityIcons 
                name="camera" 
                size={22} 
                color={!user || sending ? "#CCC" : "#2E7D32"} 
              />
              <Text style={[styles.imageButtonText, (!user || sending) && styles.disabledText, isDarkMode && styles.darkText]}>
                Camera
              </Text>
            </TouchableOpacity>

            {imageFile && (
              <View style={[styles.imageSelectedBadge, isDarkMode && styles.darkImageSelectedBadge]}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#2E7D32" />
                <Text style={[styles.imageSelectedText, isDarkMode && styles.darkText]}>Image ready</Text>
              </View>
            )}
          </View>

          {/* Text input and send button row */}
          <View style={[styles.inputRow, isDarkMode && styles.darkInputRow]}>
            <TextInput
              style={[styles.input, isDarkMode && styles.darkInput]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={user ? "Add notes (optional)..." : "Login to continue..."}
              placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
              multiline
              editable={!!user && !sending}
            />

            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!imageFile || sending || !user) && styles.sendButtonDisabled,
                isDarkMode && styles.darkSendButton
              ]}
              onPress={handleSend}
              disabled={!imageFile || sending || !user}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Preview - Now between input and messages */}
        {imagePreview && (
          <View style={[styles.imagePreviewContainer, isDarkMode && styles.darkImagePreviewContainer]}>
            <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
              <MaterialCommunityIcons name="close-circle" size={24} color="#FF4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={[styles.messagesList, isDarkMode && styles.darkMessagesList]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item }) => (
            <View style={[
              styles.messageRow,
              item.sender === "user" ? styles.userRow : styles.aiRow
            ]}>
              {item.sender === "ai" && (
                <View style={[styles.aiAvatar, isDarkMode && styles.darkAiAvatar]}>
                  <MaterialCommunityIcons name="leaf" size={16} color={isDarkMode ? "#FFF" : "#2E7D32"} />
                </View>
              )}
              
              <View style={[
                styles.messageBubble,
                item.sender === "user" ? styles.userBubble : styles.aiBubble,
                isDarkMode && item.sender === "ai" && styles.darkAiBubble
              ]}>
                {item.image_url && (
                  <Image 
                    source={{ uri: item.image_url }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                )}
                <Text style={[
                  styles.messageText,
                  item.sender === "user" ? styles.userMessageText : styles.aiMessageText,
                  isDarkMode && item.sender === "ai" && styles.darkText
                ]}>
                  {renderMessageText(item.text)}
                </Text>
                <Text style={[styles.messageTime, isDarkMode && styles.darkSubText]}>
                  {new Date(item.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>

              {item.sender === "user" && (
                <View style={styles.userAvatar}>
                  <MaterialCommunityIcons name="account" size={16} color="#FFF" />
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={[styles.emptyChat, isDarkMode && styles.darkEmptyChat]}>
              <MaterialCommunityIcons name="leaf" size={80} color={isDarkMode ? "#555" : "#2E7D32"} />
              <Text style={[styles.emptyChatTitle, isDarkMode && styles.darkText]}>Plant Disease Detector</Text>
              <Text style={[styles.emptyChatText, isDarkMode && styles.darkSubText]}>
                Upload a photo of a plant leaf to detect diseases and get treatment recommendations.
              </Text>
              {!user && (
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={() => router.push("/login")}
                >
                  <Text style={styles.loginButtonText}>Login to Continue</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <MaterialCommunityIcons name="check-circle" size={50} color="#2E7D32" />
            <Text style={[styles.modalText, isDarkMode && styles.darkText]}>Analysis saved!</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5DC", // Nude background
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  darkMessagesList: {
    backgroundColor: "#121212",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  aiRow: {
    justifyContent: "flex-start",
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  darkAiAvatar: {
    backgroundColor: "#1B5E20",
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: "#2E7D32",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkAiBubble: {
    backgroundColor: "#1E1E1E",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#FFF",
  },
  aiMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  emptyChat: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  darkEmptyChat: {
    backgroundColor: "#121212",
  },
  emptyChatTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyChatText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: "#2E7D32",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  imagePreviewContainer: {
    padding: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    position: "relative",
    alignItems: "center",
  },
  darkImagePreviewContainer: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#333",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  // Styles for input area at the top
  inputWrapper: {
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingTop: 8,
  },
  darkInputWrapper: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#333",
  },
  imageButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 4,
    backgroundColor: "#FFF",
  },
  darkImageButtonsContainer: {
    backgroundColor: "#1E1E1E",
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    gap: 6,
  },
  darkImageButton: {
    backgroundColor: "#2A2A2A",
  },
  imageButtonText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
  },
  disabledButton: {
    backgroundColor: "#F0F0F0",
    opacity: 0.6,
  },
  disabledText: {
    color: "#CCC",
  },
  imageSelectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    backgroundColor: "#E8F5E9",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 4,
  },
  darkImageSelectedBadge: {
    backgroundColor: "#1B5E20",
  },
  imageSelectedText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFF",
  },
  darkInputRow: {
    backgroundColor: "#1E1E1E",
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    marginRight: 8,
  },
  darkInput: {
    backgroundColor: "#2A2A2A",
    color: "#FFF",
  },
  sendButton: {
    backgroundColor: "#2E7D32",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  darkSendButton: {
    backgroundColor: "#1B5E20",
  },
  sendButtonDisabled: {
    backgroundColor: "#CCC",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
  },
  darkModalContent: {
    backgroundColor: "#1E1E1E",
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    marginTop: 10,
  },
  historyModal: {
    backgroundColor: "#FFF",
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    padding: 20,
  },
  darkHistoryModal: {
    backgroundColor: "#1E1E1E",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  darkModalHeader: {
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    marginBottom: 8,
  },
  darkHistoryItem: {
    borderColor: "#333",
    backgroundColor: "#1E1E1E",
  },
  selectedHistoryItem: {
    borderColor: "#2E7D32",
    backgroundColor: "#E8F5E9",
  },
  historyItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  historyItemDate: {
    fontSize: 11,
    color: "#999",
  },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: "#999",
    marginTop: 12,
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  newChatButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  networkWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE5E5",
    padding: 8,
    gap: 8,
  },
  darkNetworkWarning: {
    backgroundColor: "#2A1A1A",
  },
  networkWarningText: {
    color: "#FF4444",
    fontSize: 12,
    fontWeight: "500",
  },
  darkText: {
    color: "#FFF",
  },
  darkSubText: {
    color: "#AAA",
  },
});
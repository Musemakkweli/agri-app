import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import BASE_URL from "../services/api";

// Define types
interface FarmerProfile {
  farmLocation: string;
  cropType: string;
  phone: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  is_approved: boolean;
  is_profile_completed: boolean;
  farm_location?: string;
  crop_type?: string;
}

// Input Field Component
const InputField = ({ 
  label, 
  icon, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = "default",
  error,
  multiline = false
}: any) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputContainer, error && styles.inputError]}>
      <MaterialCommunityIcons name={icon} size={20} color="#2E7D32" style={styles.inputIcon} />
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default function ProfileCompletion() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FarmerProfile>({
    farmLocation: "",
    cropType: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<FarmerProfile>>({});
  const [message, setMessage] = useState({ text: "", type: "" });

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Try to get from multiple sources
      let userData = null;
      
      // First try temp data from registration
      const tempUserStr = await AsyncStorage.getItem("temp_user_data");
      if (tempUserStr) {
        userData = JSON.parse(tempUserStr);
      } else {
        // Then try main user data
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          userData = JSON.parse(userStr);
        }
      }

      if (!userData) {
        Alert.alert("Error", "No user data found. Please register first.");
        router.push("/register");
        return;
      }

      // Check if profile is already completed
      if (userData.is_profile_completed) {
        Alert.alert(
          "Profile Already Completed",
          "Your profile is already complete. Please login to continue.",
          [
            {
              text: "Go to Login",
              onPress: () => router.push("/login")
            }
          ]
        );
        return;
      }

      setUser(userData);
      
      // Initialize form with any existing data
      setFormData({
        farmLocation: userData.farm_location || "",
        cropType: userData.crop_type || "",
        phone: userData.phone || "",
      });
      
    } catch (error) {
      console.error("Error loading user:", error);
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FarmerProfile> = {};

    if (!formData.farmLocation.trim()) {
      newErrors.farmLocation = "Farm location is required";
    }

    if (!formData.cropType.trim()) {
      newErrors.cropType = "Crop type is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Phone must be at least 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setMessage({ text: "Please fix the errors above", type: "error" });
      return;
    }

    if (!user) {
      Alert.alert("Error", "User not found");
      return;
    }

    setSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Prepare payload for backend (snake_case)
      const payload = {
        farm_location: formData.farmLocation,
        crop_type: formData.cropType,
        phone: formData.phone,
      };

      console.log("Submitting profile:", payload);

      const response = await axios.put(
        `${BASE_URL}/profile/farmer/${user.id}`,
        payload,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Profile update response:", response.data);

      // Create updated user object with profile completed
      const updatedUser = {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_approved: user.is_approved, // Keep original approval status
        is_profile_completed: true,
        farm_location: formData.farmLocation,
        crop_type: formData.cropType,
        phone: formData.phone,
      };

      // Save updated user data
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      await AsyncStorage.removeItem("temp_user_data"); // Clean up temp data

      setMessage({ 
        text: "Profile completed successfully! You will be redirected to login.", 
        type: "success" 
      });

      // Clear any existing tokens
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user_token");

      // Show approval message
      Alert.alert(
        "Profile Completed!",
        "Your profile has been submitted for admin approval. You will be able to login once approved.",
        [
          {
            text: "OK",
            onPress: () => router.push("/login")
          }
        ]
      );

    } catch (error: any) {
      console.error("Profile completion error:", error);
      
      let errorMessage = "Failed to complete profile. Please try again.";
      
      if (error.response) {
        console.log("Error response:", error.response.data);
        if (error.response.data?.detail) {
          if (Array.isArray(error.response.data.detail)) {
            errorMessage = error.response.data.detail.map((d: any) => d.msg).join(", ");
          } else {
            errorMessage = error.response.data.detail;
          }
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      
      setMessage({ text: errorMessage, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="leaf" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Complete Profile</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <MaterialCommunityIcons name="account-check" size={60} color="#2E7D32" />
          <Text style={styles.welcomeTitle}>
            Welcome, {user?.full_name?.split(' ')[0] || 'Farmer'}! 🌱
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Tell us about your farm to get started
          </Text>
          <View style={styles.approvalNotice}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#8B5A2B" />
            <Text style={styles.approvalText}>
              After completion, your account will need admin approval
            </Text>
          </View>
        </View>

        {/* Message Display */}
        {message.text ? (
          <View style={[
            styles.messageContainer,
            message.type === "success" ? styles.successMessage : styles.errorMessage
          ]}>
            <MaterialCommunityIcons 
              name={message.type === "success" ? "check-circle" : "alert-circle"} 
              size={20} 
              color={message.type === "success" ? "#2E7D32" : "#c62828"} 
            />
            <Text style={[
              styles.messageText,
              message.type === "success" ? styles.successMessageText : styles.errorMessageText
            ]}>
              {message.text}
            </Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Farm Location */}
          <InputField
            label="Farm Location"
            icon="map-marker"
            value={formData.farmLocation}
            onChangeText={(text: string) => {
              setFormData({ ...formData, farmLocation: text });
              if (errors.farmLocation) setErrors({ ...errors, farmLocation: undefined });
            }}
            placeholder="e.g., Northern Province, Musanze"
            error={errors.farmLocation}
          />

          {/* Crop Type */}
          <InputField
            label="Main Crop Type"
            icon="sprout"
            value={formData.cropType}
            onChangeText={(text: string) => {
              setFormData({ ...formData, cropType: text });
              if (errors.cropType) setErrors({ ...errors, cropType: undefined });
            }}
            placeholder="e.g., Maize, Beans, Coffee"
            error={errors.cropType}
          />

          {/* Phone Number */}
          <InputField
            label="Phone Number"
            icon="phone"
            value={formData.phone}
            onChangeText={(text: string) => {
              // Allow only digits
              const digits = text.replace(/\D/g, '');
              setFormData({ ...formData, phone: digits });
              if (errors.phone) setErrors({ ...errors, phone: undefined });
            }}
            placeholder="0788123456"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={24} color="#2E7D32" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>What happens next?</Text>
              <Text style={styles.infoText}>
                1. Complete your profile below{'\n'}
                2. Admin will review your information{'\n'}
                3. You'll receive a notification when approved{'\n'}
                4. Then you can login to your dashboard
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.submitButtonText}>Submitting...</Text>
              </>
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit for Approval</Text>
                <MaterialCommunityIcons name="send" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          Your information is secure and only used for farm management
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fff4",
  },
  header: {
    backgroundColor: "#2E7D32",
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 5,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 34,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0fff4",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#2E7D32",
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 10,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    marginBottom: 10,
  },
  approvalNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginTop: 5,
  },
  approvalText: {
    fontSize: 12,
    color: "#8B5A2B",
    fontWeight: "500",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  successMessage: {
    backgroundColor: "#e8f5e9",
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  errorMessage: {
    backgroundColor: "#ffebee",
    borderWidth: 1,
    borderColor: "#c62828",
  },
  messageText: {
    fontSize: 13,
    flex: 1,
  },
  successMessageText: {
    color: "#2E7D32",
  },
  errorMessageText: {
    color: "#c62828",
  },
  formContainer: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: "#c62828",
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#c62828",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 12,
    color: "#2E7D32",
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    gap: 10,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
    backgroundColor: "#81C784",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginText: {
    fontSize: 14,
    color: "#666",
  },
  loginLink: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "bold",
  },
  footerText: {
    textAlign: "center",
    color: "#999",
    fontSize: 11,
    marginTop: 20,
    marginBottom: 10,
  },
});
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
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

// Define types for InputField props
interface InputFieldProps {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
}

// InputField component with proper typing
const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  icon, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  keyboardType = "default",
  placeholder
}) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputContainer}>
      <MaterialCommunityIcons name={icon} size={20} color="#2E7D32" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholderTextColor="#999"
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      />
    </View>
  </View>
);

// Define type for form data
interface FormData {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

interface RegisterResponse {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  is_approved: boolean;
  is_profile_completed: boolean;
  message?: string;
}

export default function RegisterScreen() {
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Role is fixed to farmer
  const role = "farmer";

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errorMessage) setErrorMessage("");
  };

  const validateForm = (): boolean => {
    // Check all fields
    if (!formData.full_name.trim()) {
      Alert.alert("Validation Error", "Please enter your full name");
      return false;
    }
    
    if (!formData.email.trim()) {
      Alert.alert("Validation Error", "Please enter your email");
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }
    
    if (!formData.password) {
      Alert.alert("Validation Error", "Please enter a password");
      return false;
    }
    
    if (formData.password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return false;
    }
    
    if (!formData.phone.trim()) {
      Alert.alert("Validation Error", "Please enter your phone number");
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage("");

    try {
      // Prepare data for API - remove confirmPassword
      const { confirmPassword, ...apiData } = formData;
      
      const response = await axios.post<RegisterResponse>(`${BASE_URL}/register`, {
        ...apiData,
        role: "farmer", // Force role to be farmer
      });

      const { id, full_name, email, phone, message } = response.data;

      // Store user data in AsyncStorage
      await AsyncStorage.setItem("temp_user_id", id.toString());
      await AsyncStorage.setItem("temp_user_data", JSON.stringify({
        id,
        full_name,
        email,
        phone,
        role: "farmer"
      }));

      // Show success message
      Alert.alert(
        "Registration Successful", 
        message || "Account created successfully! Please complete your profile.",
        [
          {
            text: "Continue",
            onPress: () => router.push("/completion")
          }
        ]
      );
      
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Handle different error types
      if (error.response) {
        // Server responded with error
        const errorMsg = error.response.data?.detail || 
                        error.response.data?.message || 
                        "Registration failed. Please try again.";
        setErrorMessage(errorMsg);
        Alert.alert("Registration Failed", errorMsg);
      } else if (error.request) {
        // Request made but no response
        Alert.alert("Network Error", "Unable to connect to server. Please check your internet connection.");
      } else {
        // Something else happened
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f0fff4" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="leaf" size={30} color="#FFF" />
          <Text style={styles.headerTitle}>AgroCare</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="account-plus" size={50} color="#2E7D32" />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join as a farmer</Text>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#c62828" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.formContainer}>
          <InputField
            label="Full Name"
            icon="account"
            value={formData.full_name}
            onChangeText={(value) => handleChange("full_name", value)}
            placeholder="John Doe"
          />

          <InputField
            label="Email"
            icon="email"
            value={formData.email}
            onChangeText={(value) => handleChange("email", value)}
            keyboardType="email-address"
            placeholder="farmer@example.com"
          />

          <InputField
            label="Password"
            icon="lock"
            value={formData.password}
            onChangeText={(value) => handleChange("password", value)}
            secureTextEntry={true}
            placeholder="••••••••"
          />

          <InputField
            label="Confirm Password"
            icon="lock-check"
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange("confirmPassword", value)}
            secureTextEntry={true}
            placeholder="••••••••"
          />

          <InputField
            label="Phone Number"
            icon="phone"
            value={formData.phone}
            onChangeText={(value) => handleChange("phone", value)}
            keyboardType="phone-pad"
            placeholder="+250 788 123 456"
          />

          {/* Role Selection - Fixed to Farmer only */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.roleContainer}>
              <View style={[styles.roleButton, styles.roleButtonActive]}>
                <MaterialCommunityIcons name="tractor" size={16} color="#FFF" />
                <Text style={[styles.roleText, styles.roleTextActive]}>Farmer</Text>
              </View>
              <View style={styles.disabledRole}>
                <MaterialCommunityIcons name="account" size={16} color="#999" />
                <Text style={styles.disabledRoleText}>Agronomist</Text>
              </View>
              <View style={styles.disabledRole}>
                <MaterialCommunityIcons name="hand-heart" size={16} color="#999" />
                <Text style={styles.disabledRoleText}>Donor</Text>
              </View>
              <View style={styles.disabledRole}>
                <MaterialCommunityIcons name="account-tie" size={16} color="#999" />
                <Text style={styles.disabledRoleText}>Leader</Text>
              </View>
            </View>
          </View>

          {/* Info about profile completion */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information" size={20} color="#2E7D32" />
            <Text style={styles.infoText}>
              After registration, you'll complete your farm profile
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.registerButtonText}>Creating Account...</Text>
            ) : (
              <>
                <Text style={styles.registerButtonText}>Create Account</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
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
          Join 500+ farmers managing their farms with AgroCare
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
  titleContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "#c62828",
  },
  errorText: {
    fontSize: 13,
    color: "#c62828",
    flex: 1,
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2E7D32",
    backgroundColor: "#2E7D32",
  },
  roleButtonActive: {
    backgroundColor: "#2E7D32",
  },
  roleText: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "500",
  },
  roleTextActive: {
    color: "#FFF",
  },
  disabledRole: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
    opacity: 0.6,
  },
  disabledRoleText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  infoText: {
    fontSize: 13,
    color: "#2E7D32",
    flex: 1,
  },
  registerButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  registerButtonDisabled: {
    opacity: 0.7,
    backgroundColor: "#81C784",
  },
  registerButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 12,
    marginTop: 30,
    marginBottom: 10,
  },
});
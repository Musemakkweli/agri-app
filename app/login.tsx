import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

// Define types for API response
interface LoginResponse {
  user: User;
  access_token: string;
  message: string;
}

interface User {
  id: number;
  role: string;
  is_approved: boolean;
  is_profile_completed: boolean;
  email?: string;
  phone?: string;
  full_name?: string;
}

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  // ==============================
  // Redirect Logic - FARMER ONLY
  // ==============================
  const redirectUser = (user: User) => {
    if (!user.is_approved) {
      Alert.alert("Account Not Approved", "Your account is not approved yet. Please wait for admin approval.");
      return;
    }

    if (!user.is_profile_completed) {
      router.push("/(tabs)/dashboard");
      return;
    }

    // ONLY FARMERS CAN LOGIN HERE
    if (user.role === "farmer") {
      router.push("/(tabs)/dashboard");
    } else {
      Alert.alert(
        "Access Denied", 
        "This app is for farmers only. Please use the web version for other roles."
      );
      AsyncStorage.multiRemove(["token", "user_token", "user_data", "user", "user_id", "user_role"]);
    }
  };

  // ==============================
  // Fetch latest profile after login - FIXED VERSION
  // ==============================
  const fetchLatestUser = async (user: User, token: string): Promise<User> => {
    try {
      // Only fetch for farmers
      if (user.role === "farmer") {
        const endpoint = `${BASE_URL}/profile/farmer/${user.id}`;
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Create base user object
        const updatedUser: User = {
          id: user.id,
          role: user.role,
          is_approved: user.is_approved,
          is_profile_completed: user.is_profile_completed,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
        };
        
        // If response.data exists and is an object, merge it manually
        if (response.data && typeof response.data === 'object') {
          const data = response.data as any;
          
          if (data.email) updatedUser.email = data.email;
          if (data.phone) updatedUser.phone = data.phone;
          if (data.full_name) updatedUser.full_name = data.full_name;
          if (data.is_approved !== undefined) updatedUser.is_approved = data.is_approved;
          if (data.is_profile_completed !== undefined) updatedUser.is_profile_completed = data.is_profile_completed;
        }
        
        return updatedUser;
      }
      return user;
    } catch (err) {
      console.error("Failed to fetch latest user profile:", err);
      return user;
    }
  };

  // ==============================
  // Handle login submit
  // ==============================
  const handleLogin = async () => {
    // Basic validation
    if (!identifier || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setMessage("");
    setError(false);
    setLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/login`, {
        identifier,
        password,
      });
      
      const { user, access_token, message: backendMessage } = response.data as LoginResponse;

      // CHECK IF USER IS FARMER
      if (user.role !== "farmer") {
        setError(true);
        setMessage("Access denied. This app is for farmers only.");
        Alert.alert(
          "Access Denied", 
          `You are registered as a ${user.role}. Please use the web version for your role.`
        );
        setLoading(false);
        return;
      }

      // Save token
      await AsyncStorage.setItem("token", access_token);
      await AsyncStorage.setItem("user_token", access_token);
      await AsyncStorage.setItem("user_id", user.id.toString());
      await AsyncStorage.setItem("user_role", user.role);

      // Fetch latest user data
      const latestUser = await fetchLatestUser(user, access_token);
      
      // Save user data
      await AsyncStorage.setItem("user_data", JSON.stringify(latestUser));
      await AsyncStorage.setItem("user", JSON.stringify(latestUser));

      setMessage(backendMessage || "Login successful!");
      
      // Redirect farmer to dashboard
      redirectUser(latestUser);
      
    } catch (err: any) {
      console.error(err);
      
      // Handle error
      const errorMsg = err.response?.data?.detail || "Login failed. Check your credentials.";
      
      setError(true);
      setMessage(errorMsg);
      Alert.alert("Login Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    router.push("/register");
  };

  const goBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f0fff4" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2E7D32" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="leaf" size={80} color="#2E7D32" />
          <Text style={styles.title}>Farmer Login</Text>
          <Text style={styles.subtitle}>Access your farm dashboard</Text>
        </View>

        {/* Message Display */}
        {message ? (
          <Text style={[styles.message, error ? styles.errorMessage : styles.successMessage]}>
            {message}
          </Text>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          {/* Email/Phone Input */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color="#2E7D32"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email or Phone"
              placeholderTextColor="#999"
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={20}
              color="#2E7D32"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <MaterialCommunityIcons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#2E7D32"
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.loginButtonText}>Logging in...</Text>
            ) : (
              <>
                <Text style={styles.loginButtonText}>Login as Farmer</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color="#FFF"
                />
              </>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>New farmer? </Text>
            <TouchableOpacity onPress={goToRegister}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          By logging in, you agree to our Terms and Privacy Policy
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 20,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  message: {
    textAlign: "center",
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
  },
  successMessage: {
    backgroundColor: "#e8f5e9",
    color: "#2E7D32",
  },
  errorMessage: {
    backgroundColor: "#ffebee",
    color: "#c62828",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#2E7D32",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  registerText: {
    color: "#666",
    fontSize: 16,
  },
  registerLink: {
    color: "#2E7D32",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerText: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    marginTop: 20,
  },
});
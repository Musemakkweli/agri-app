import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import BASE_URL from "../services/api"; // Import BASE_URL

export default function ChangePasswordScreen() {
  const { isDarkMode } = useTheme();
  
  // State for password change flow
  const [step, setStep] = useState<'identifier' | 'otp' | 'newPassword'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Start countdown for OTP resend
  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 1: Request OTP
  const handleRequestOTP = async () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Please enter your email or phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/request-password-otp?identifier=${encodeURIComponent(identifier)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'OTP Sent', 
          `A verification code has been sent to ${identifier}. For testing: ${data.otp_for_testing}`
        );
        setStep('otp');
        startCountdown();
      } else {
        Alert.alert('Error', data.detail || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP request error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and change password
  const handleChangePassword = async () => {
    // Validation
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier,
          otp_code: otp,
          new_password: newPassword,
          confirm_password: confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success', 
          'Password changed successfully! You can now login with your new password.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', data.detail || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (countdown === 0) {
      handleRequestOTP();
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.step, step === 'identifier' && styles.activeStep]}>
              <Text style={[styles.stepNumber, step === 'identifier' && styles.activeStepText]}>1</Text>
              <Text style={[styles.stepLabel, isDarkMode && styles.darkText]}>Verify</Text>
            </View>
            <View style={[styles.stepLine, step !== 'identifier' && styles.activeStepLine]} />
            <View style={[styles.step, step === 'otp' && styles.activeStep]}>
              <Text style={[styles.stepNumber, step === 'otp' && styles.activeStepText]}>2</Text>
              <Text style={[styles.stepLabel, isDarkMode && styles.darkText]}>OTP</Text>
            </View>
            <View style={[styles.stepLine, step === 'newPassword' && styles.activeStepLine]} />
            <View style={[styles.step, step === 'newPassword' && styles.activeStep]}>
              <Text style={[styles.stepNumber, step === 'newPassword' && styles.activeStepText]}>3</Text>
              <Text style={[styles.stepLabel, isDarkMode && styles.darkText]}>New</Text>
            </View>
          </View>

          {/* Identifier Step */}
          {step === 'identifier' && (
            <View style={[styles.card, isDarkMode && styles.darkCard]}>
              <MaterialCommunityIcons name="shield-lock" size={50} color="#2E7D32" style={styles.cardIcon} />
              <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>Verify Your Identity</Text>
              <Text style={[styles.cardDescription, isDarkMode && styles.darkSubText]}>
                Enter your email or phone number to receive a verification code
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>Email or Phone</Text>
                <View style={[styles.inputContainer, isDarkMode && styles.darkInputContainer]}>
                  <MaterialCommunityIcons name="account" size={20} color="#2E7D32" />
                  <TextInput
                    style={[styles.input, isDarkMode && styles.darkText]}
                    placeholder="e.g., user@example.com or +250..."
                    placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleRequestOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Send Verification Code</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* OTP and New Password Step */}
          {step === 'otp' && (
            <View style={[styles.card, isDarkMode && styles.darkCard]}>
              <MaterialCommunityIcons name="form-textbox-password" size={50} color="#2E7D32" style={styles.cardIcon} />
              <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>Enter Verification Code</Text>
              <Text style={[styles.cardDescription, isDarkMode && styles.darkSubText]}>
                We've sent a 6-digit code to {identifier}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>Verification Code</Text>
                <View style={[styles.inputContainer, isDarkMode && styles.darkInputContainer]}>
                  <MaterialCommunityIcons name="lock" size={20} color="#2E7D32" />
                  <TextInput
                    style={[styles.input, isDarkMode && styles.darkText]}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>New Password</Text>
                <View style={[styles.inputContainer, isDarkMode && styles.darkInputContainer]}>
                  <MaterialCommunityIcons name="lock" size={20} color="#2E7D32" />
                  <TextInput
                    style={[styles.input, isDarkMode && styles.darkText]}
                    placeholder="Enter new password"
                    placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>Confirm Password</Text>
                <View style={[styles.inputContainer, isDarkMode && styles.darkInputContainer]}>
                  <MaterialCommunityIcons name="lock-check" size={20} color="#2E7D32" />
                  <TextInput
                    style={[styles.input, isDarkMode && styles.darkText]}
                    placeholder="Confirm new password"
                    placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Change Password</Text>
                    <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                <Text style={[styles.resendText, isDarkMode && styles.darkSubText]}>
                  Didn't receive the code?
                </Text>
                <TouchableOpacity 
                  onPress={handleResendOTP}
                  disabled={countdown > 0}
                >
                  <Text style={[
                    styles.resendLink,
                    countdown > 0 && styles.resendDisabled
                  ]}>
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Password Requirements */}
          <View style={[styles.requirementsCard, isDarkMode && styles.darkCard]}>
            <Text style={[styles.requirementsTitle, isDarkMode && styles.darkText]}>Password Requirements:</Text>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons 
                name={newPassword.length >= 6 ? "check-circle" : "circle-outline"} 
                size={18} 
                color={newPassword.length >= 6 ? "#4CAF50" : "#999"} 
              />
              <Text style={[styles.requirementText, isDarkMode && styles.darkSubText]}>
                At least 6 characters
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons 
                name={/[A-Z]/.test(newPassword) ? "check-circle" : "circle-outline"} 
                size={18} 
                color={/[A-Z]/.test(newPassword) ? "#4CAF50" : "#999"} 
              />
              <Text style={[styles.requirementText, isDarkMode && styles.darkSubText]}>
                At least one uppercase letter
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <MaterialCommunityIcons 
                name={/[0-9]/.test(newPassword) ? "check-circle" : "circle-outline"} 
                size={18} 
                color={/[0-9]/.test(newPassword) ? "#4CAF50" : "#999"} 
              />
              <Text style={[styles.requirementText, isDarkMode && styles.darkSubText]}>
                At least one number
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  step: {
    alignItems: "center",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    textAlign: "center",
    lineHeight: 32,
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  activeStep: {
    backgroundColor: "#2E7D32",
  },
  activeStepText: {
    color: "#FFF",
  },
  stepLabel: {
    fontSize: 11,
    marginTop: 4,
    color: "#666",
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 8,
  },
  activeStepLine: {
    backgroundColor: "#2E7D32",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  darkCard: {
    backgroundColor: "#1E1E1E",
  },
  cardIcon: {
    alignSelf: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F9F9F9",
  },
  darkInputContainer: {
    borderColor: "#333",
    backgroundColor: "#2A2A2A",
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 15,
    color: "#333",
  },
  primaryButton: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  resendText: {
    fontSize: 13,
    color: "#666",
  },
  resendLink: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "600",
  },
  resendDisabled: {
    color: "#999",
  },
  requirementsCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    color: "#666",
  },
  darkText: {
    color: "#FFF",
  },
  darkSubText: {
    color: "#AAA",
  },
});
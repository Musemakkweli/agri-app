import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LandingScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Bounce animation for arrow
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 10,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const startApp = () => {
    router.push("/login");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fff4" />
      
      {/* Main Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="sprout" size={100} color="#2E7D32" />
        </View>

        {/* Title */}
        <Text style={styles.title}>AgroCare</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Smart Farming Assistant
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          Manage your farm efficiently with real-time insights and smart recommendations
        </Text>
      </Animated.View>

      {/* Start Button with Arrow */}
      <Animated.View 
        style={[
          styles.buttonContainer,
          { transform: [{ translateY: bounceAnim }] }
        ]}
      >
        <TouchableOpacity
          style={styles.startButton}
          onPress={startApp}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-right" size={40} color="#2E7D32" />
        </TouchableOpacity>
        <Text style={styles.tapText}>Tap to start</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fff4", // Light green background
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 80,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 20,
    backgroundColor: "#e8f5e9",
    padding: 20,
    borderRadius: 100,
    shadowColor: "#2E7D32",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 20,
    color: "#388E3C",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  buttonContainer: {
    alignItems: "center",
  },
  startButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#2E7D32",
  },
  tapText: {
    marginTop: 10,
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
  },
});
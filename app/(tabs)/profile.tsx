import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Define User type
interface User {
  id: number;
  fullname: string;
  email: string;
  phone: string;
  district: string;
  farm_location: string;
  crop_type: string;
  farm_size: number;
  profileImage: string | null;
  is_profile_completed: boolean;
  is_approved: boolean;
}

// Mock data for preview
const MOCK_USER: User = {
  id: 1,
  fullname: "John Farmer",
  email: "john.farmer@example.com",
  phone: "+250 788 123 456",
  district: "Huye",
  farm_location: "Tumba Sector",
  crop_type: "Maize, Beans, Coffee",
  farm_size: 5.2,
  profileImage: null,
  is_profile_completed: true,
  is_approved: true,
};

export default function FarmerProfilePage() {
  const [user, setUser] = useState<User>(MOCK_USER);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);

  const handleChange = (field: keyof User, value: string): void => {
    setUser({ ...user, [field]: value });
  };

  const pickImage = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to upload image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setProfileImage(result.assets[0].uri);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    }
  };

  const handleSave = (): void => {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      setIsEditing(false);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    }, 1500);
  };

  const handleCancel = (): void => {
    setIsEditing(false);
    setProfileImage(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmer Profile</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
            <MaterialCommunityIcons name="pencil" size={24} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: profileImage || 
                      user.profileImage || 
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}&background=2E7D32&color=fff&size=150`,
              }}
              style={styles.profileImage}
            />
            {isEditing && (
              <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Role Badge */}
          <View style={styles.roleBadge}>
            <MaterialCommunityIcons name="tractor" size={16} color="#2E7D32" />
            <Text style={styles.roleText}>Farmer</Text>
          </View>
          
          {/* Profile Status */}
          <View style={styles.statusContainer}>
            <MaterialCommunityIcons 
              name={user.is_profile_completed ? "check-circle" : "alert-circle"} 
              size={16} 
              color={user.is_profile_completed ? "#2E7D32" : "#FF9800"} 
            />
            <Text style={[
              styles.statusText,
              { color: user.is_profile_completed ? "#2E7D32" : "#FF9800" }
            ]}>
              {user.is_profile_completed ? "Profile Complete" : "Profile Incomplete"}
            </Text>
          </View>
        </View>

        {/* Profile Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          {/* Full Name */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="account" size={22} color="#2E7D32" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={user.fullname}
                  onChangeText={(text) => handleChange("fullname", text)}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={styles.infoValue}>{user.fullname}</Text>
              )}
            </View>
          </View>

          {/* Email */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="email" size={22} color="#2E7D32" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>

          {/* Phone */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="phone" size={22} color="#2E7D32" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={user.phone}
                  onChangeText={(text) => handleChange("phone", text)}
                  placeholder="Phone Number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{user.phone}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Farm Information Card */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Farm Information</Text>
          
          {/* District */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="map-marker" size={22} color="#2E7D32" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>District</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={user.district}
                  onChangeText={(text) => handleChange("district", text)}
                  placeholder="e.g., Huye"
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={styles.infoValue}>{user.district}</Text>
              )}
            </View>
          </View>

          {/* Farm Location */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="terrain" size={22} color="#2E7D32" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Farm Location</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={user.farm_location}
                  onChangeText={(text) => handleChange("farm_location", text)}
                  placeholder="e.g., Tumba Sector"
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={styles.infoValue}>{user.farm_location}</Text>
              )}
            </View>
          </View>

          {/* Main Crops */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="sprout" size={22} color="#2E7D32" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Main Crops</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={user.crop_type}
                  onChangeText={(text) => handleChange("crop_type", text)}
                  placeholder="e.g., Maize, Beans"
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={styles.infoValue}>{user.crop_type}</Text>
              )}
            </View>
          </View>

          {/* Farm Size */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="ruler" size={22} color="#2E7D32" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Farm Size (hectares)</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={user.farm_size?.toString()}
                  onChangeText={(text) => handleChange("farm_size", text)}
                  placeholder="e.g., 5.2"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.infoValue}>{user.farm_size} ha</Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {isEditing ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <MaterialCommunityIcons name="close" size={20} color="#666" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Approval Status */}
        {!user.is_approved && (
          <View style={styles.approvalContainer}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#FF9800" />
            <Text style={styles.approvalText}>
              Your account is pending approval. Some features may be limited.
            </Text>
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-check" size={24} color="#2E7D32" />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Harvests</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="bug" size={24} color="#2E7D32" />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Pests</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="alert-circle" size={24} color="#2E7D32" />
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Complaints</Text>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="check-circle" size={50} color="#2E7D32" />
            <Text style={styles.modalText}>Profile updated successfully!</Text>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showErrorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="alert-circle" size={50} color="#D32F2F" />
            <Text style={styles.modalText}>Something went wrong. Please try again.</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  editButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#2E7D32",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2E7D32",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  roleText: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  iconContainer: {
    width: 36,
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
    marginLeft: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  infoInput: {
    fontSize: 15,
    color: "#333",
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#2E7D32",
    paddingVertical: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  approvalContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  approvalText: {
    flex: 1,
    color: "#FF9800",
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
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
    maxWidth: "80%",
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginTop: 10,
  },
});
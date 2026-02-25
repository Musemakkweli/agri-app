import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '../../context/ThemeContext';
import BASE_URL from "../../services/api";

// Define types
interface FarmerProfile {
  id: number;
  fullname: string;
  email: string;
  phone: string;
  farm_location: string;
  crop_type: string;
  district: string;
  profile_picture?: string | null;
}

interface ProfileResponse {
  id: number;
  fullname: string;
  email: string;
  phone: string;
  farm_location: string;
  crop_type: string;
  district: string;
  profile_picture?: string | null;
}

interface UploadResponse {
  message: string;
  imageUrl: string;
}

interface UpdateProfileRequest {
  fullname?: string;
  phone?: string;
  farm_location?: string;
  crop_type?: string;
  district?: string;
}

interface UpdateProfileResponse {
  message: string;
  is_profile_completed: boolean;
}

export default function FarmerProfilePage() {
  const [user, setUser] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { isDarkMode } = useTheme();
  
  // Form state for editing
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    farm_location: "",
    crop_type: "",
    district: "",
  });

  // Get auth token
  const getToken = async () => {
    return await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
  };

  // Load user profile from backend
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const userStr = await AsyncStorage.getItem("user");
      
      if (!token || !userStr) {
        Alert.alert("Error", "Please login again");
        router.push("/login");
        return;
      }

      const userData = JSON.parse(userStr);
      
      const response = await axios.get<ProfileResponse>(
        `${BASE_URL}/users/profile/${userData.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log("Profile data:", response.data);
      
      const profileData: FarmerProfile = {
        id: response.data.id,
        fullname: response.data.fullname,
        email: response.data.email,
        phone: response.data.phone || "",
        farm_location: response.data.farm_location || "",
        crop_type: response.data.crop_type || "",
        district: response.data.district || "",
        profile_picture: response.data.profile_picture,
      };

      setUser(profileData);
      setImageUrl(response.data.profile_picture || null);
      setImageError(false);
      
      // Initialize form data
      setFormData({
        fullname: profileData.fullname,
        phone: profileData.phone,
        farm_location: profileData.farm_location,
        crop_type: profileData.crop_type,
        district: profileData.district,
      });

    } catch (error: any) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant camera roll permissions.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    if (!user) return;

    try {
      setUploadingImage(true);
      setImageError(false);
      const token = await getToken();
      
      if (!token) {
        Alert.alert("Error", "Please login again");
        router.push("/login");
        return;
      }

      console.log("1. Uploading image from URI:", imageUri);

      const formData = new FormData();
      const filename = `profile_${user.id}_${Date.now()}.jpg`;

      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: 'image/jpeg' });
        formData.append('file', file);
      } else {
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: filename,
        } as any);
      }

      console.log("2. Sending to:", `${BASE_URL}/users/${user.id}/profile-picture`);

      const response = await axios.post<UploadResponse>(
        `${BASE_URL}/users/${user.id}/profile-picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log("3. Upload response:", response.data);

      if (response.data.imageUrl) {
        console.log("4. Image URL received:", response.data.imageUrl);
        setImageUrl(response.data.imageUrl);
        
        // Update user in state
        const updatedUser = {
          ...user,
          profile_picture: response.data.imageUrl,
        };
        setUser(updatedUser);

        // Update AsyncStorage
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.profile_picture = response.data.imageUrl;
          await AsyncStorage.setItem("user", JSON.stringify(userData));
        }

        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }

    } catch (error: any) {
      console.error("Upload error:", error);
      console.log("Error response:", error.response?.data);
      Alert.alert("Error", error.response?.data?.detail || "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!formData.fullname || !formData.phone || !formData.farm_location || 
        !formData.crop_type || !formData.district) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setSaving(true);
      const token = await getToken();
      
      if (!token) {
        Alert.alert("Error", "Please login again");
        router.push("/login");
        return;
      }

      const updateData: UpdateProfileRequest = {
        fullname: formData.fullname,
        phone: formData.phone,
        farm_location: formData.farm_location,
        crop_type: formData.crop_type,
        district: formData.district,
      };

      const response = await axios.put<UpdateProfileResponse>(
        `${BASE_URL}/users/profile/${user.id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local user state
      const updatedUser = {
        ...user,
        fullname: formData.fullname,
        phone: formData.phone,
        farm_location: formData.farm_location,
        crop_type: formData.crop_type,
        district: formData.district,
        is_profile_completed: response.data.is_profile_completed,
      };
      
      setUser(updatedUser);
      
      // Update AsyncStorage user data
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        userData.fullname = formData.fullname;
        userData.phone = formData.phone;
        await AsyncStorage.setItem("user", JSON.stringify(userData));
      }

      setSaving(false);
      setIsEditing(false);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);

    } catch (error: any) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", error.response?.data?.detail || "Failed to save profile");
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        fullname: user.fullname,
        phone: user.phone,
        farm_location: user.farm_location,
        crop_type: user.crop_type,
        district: user.district,
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Farmer Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Farmer Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.errorContainer, isDarkMode && styles.darkErrorContainer]}>
          <Text style={[isDarkMode && styles.darkText]}>Failed to load profile</Text>
          <TouchableOpacity onPress={loadUserProfile}>
            <Text style={[styles.retryText, isDarkMode && styles.darkText]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  console.log("Current imageUrl state:", imageUrl);
  console.log("User profile_picture:", user.profile_picture);

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmer Profile</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <MaterialCommunityIcons name="pencil" size={24} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            <Image
              source={
                imageUrl && !imageError
                  ? { uri: imageUrl }
                  : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}&background=2E7D32&color=fff&size=150` }
              }
              style={styles.profileImage}
              onError={(e) => {
                console.log("Image failed to load:", e.nativeEvent.error);
                console.log("Failed URL:", imageUrl);
                setImageError(true);
              }}
              onLoad={() => {
                console.log("Image loaded successfully");
                setImageError(false);
              }}
            />
            {isEditing && (
              <TouchableOpacity 
                style={styles.cameraButton} 
                onPress={pickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            )}
          </View>
          
          <View style={[styles.roleBadge, isDarkMode && styles.darkRoleBadge]}>
            <MaterialCommunityIcons name="tractor" size={16} color={isDarkMode ? "#FFF" : "#2E7D32"} />
            <Text style={[styles.roleText, isDarkMode && styles.darkText]}>Farmer</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={[styles.infoCard, isDarkMode && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Personal Information</Text>
          
          <View style={[styles.infoRow, isDarkMode && styles.darkBorder]}>
            <MaterialCommunityIcons name="account" size={20} color="#2E7D32" />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkSubText]}>Full Name</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.infoInput, isDarkMode && styles.darkInput]}
                  value={formData.fullname}
                  onChangeText={(text) => handleChange("fullname", text)}
                  placeholder="Full Name"
                  placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
                />
              ) : (
                <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{user.fullname}</Text>
              )}
            </View>
          </View>

          <View style={[styles.infoRow, isDarkMode && styles.darkBorder]}>
            <MaterialCommunityIcons name="email" size={20} color="#2E7D32" />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkSubText]}>Email</Text>
              <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{user.email}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, isDarkMode && styles.darkBorder]}>
            <MaterialCommunityIcons name="phone" size={20} color="#2E7D32" />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkSubText]}>Phone</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.infoInput, isDarkMode && styles.darkInput]}
                  value={formData.phone}
                  onChangeText={(text) => handleChange("phone", text)}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
                />
              ) : (
                <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{user.phone || 'Not provided'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Farm Information */}
        <View style={[styles.infoCard, isDarkMode && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Farm Information</Text>
          
          <View style={[styles.infoRow, isDarkMode && styles.darkBorder]}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#2E7D32" />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkSubText]}>District</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.infoInput, isDarkMode && styles.darkInput]}
                  value={formData.district}
                  onChangeText={(text) => handleChange("district", text)}
                  placeholder="District"
                  placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
                />
              ) : (
                <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{user.district || 'Not provided'}</Text>
              )}
            </View>
          </View>

          <View style={[styles.infoRow, isDarkMode && styles.darkBorder]}>
            <MaterialCommunityIcons name="terrain" size={20} color="#2E7D32" />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkSubText]}>Farm Location</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.infoInput, isDarkMode && styles.darkInput]}
                  value={formData.farm_location}
                  onChangeText={(text) => handleChange("farm_location", text)}
                  placeholder="Farm Location"
                  placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
                />
              ) : (
                <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{user.farm_location || 'Not provided'}</Text>
              )}
            </View>
          </View>

          <View style={[styles.infoRow, isDarkMode && styles.darkBorder]}>
            <MaterialCommunityIcons name="sprout" size={20} color="#2E7D32" />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkSubText]}>Main Crops</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.infoInput, isDarkMode && styles.darkInput]}
                  value={formData.crop_type}
                  onChangeText={(text) => handleChange("crop_type", text)}
                  placeholder="Main Crops"
                  placeholderTextColor={isDarkMode ? "#AAA" : "#999"}
                />
              ) : (
                <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{user.crop_type || 'Not provided'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {isEditing ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.cancelButton, isDarkMode && styles.darkCancelButton]} 
              onPress={handleCancel}
            >
              <Text style={[styles.cancelButtonText, isDarkMode && styles.darkText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, isDarkMode && styles.darkSaveButton]} 
              onPress={handleSave} 
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Image URL Display (for testing) */}
        {imageUrl && (
          <View style={[styles.infoCard, isDarkMode && styles.darkCard]}>
            <Text style={[styles.label, isDarkMode && styles.darkText]}>Image URL (saved in DB):</Text>
            <Text style={[styles.url, isDarkMode && styles.darkSubText]} numberOfLines={2}>{imageUrl}</Text>
          </View>
        )}
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <MaterialCommunityIcons name="check-circle" size={50} color="#2E7D32" />
            <Text style={[styles.modalText, isDarkMode && styles.darkText]}>Profile updated successfully!</Text>
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
  header: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  retryText: {
    color: "#2E7D32",
    marginTop: 10,
    fontSize: 16,
  },
  content: {
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
  },
  roleText: {
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    gap: 12,
  },
  infoContent: {
    flex: 1,
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
    backgroundColor: "#FFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
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
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 8,
  },
  url: {
    fontSize: 12,
    color: "#666",
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
  modalText: {
    fontSize: 16,
    color: "#333",
    marginTop: 10,
  },
  
  // Dark mode styles
  darkContainer: {
    backgroundColor: "#121212",
  },
  darkHeader: {
    backgroundColor: "#1B5E20",
  },
  darkErrorContainer: {
    backgroundColor: "#121212",
  },
  darkRoleBadge: {
    backgroundColor: "#1B5E20",
  },
  darkCard: {
    backgroundColor: "#1E1E1E",
  },
  darkText: {
    color: "#FFF",
  },
  darkSubText: {
    color: "#AAA",
  },
  darkBorder: {
    borderBottomColor: "#333",
  },
  darkInput: {
    color: "#FFF",
    borderBottomColor: "#2E7D32",
  },
  darkCancelButton: {
    backgroundColor: "#2A2A2A",
    borderColor: "#444",
  },
  darkSaveButton: {
    backgroundColor: "#1B5E20",
  },
  darkModalContent: {
    backgroundColor: "#1E1E1E",
  },
});
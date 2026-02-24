import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BASE_URL from "../../services/api";

// Define types
interface Complaint {
  id: number;
  title: string;
  type: string;
  description: string;
  location: string;
  status: string;
  image?: string | null;
  created_at: string;
  created_by?: number;
}

// Define icon type for MaterialCommunityIcons
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Complaint types with valid icon names
const complaintTypes: { value: string; label: string; icon: IconName }[] = [
  { value: "Pest Attack", label: "Pest Attack", icon: "bug" },
  { value: "Animal Damage", label: "Animal Damage", icon: "paw" },
  { value: "Crop Disease", label: "Crop Disease", icon: "leaf-off" },
  { value: "Theft", label: "Theft", icon: "lock-alert" },
  { value: "Weather Damage", label: "Weather Damage", icon: "weather-lightning-rainy" },
  { value: "Soil Issue", label: "Soil Issue", icon: "earth" },
  { value: "Equipment Failure", label: "Equipment Failure", icon: "tractor" },
  { value: "Other", label: "Other Issue", icon: "dots-horizontal" },
];

// Status colors - case insensitive
const getStatusColor = (status: string): { bg: string; text: string; dot: string } => {
  const statusLower = status.toLowerCase();
  if (statusLower === "pending") {
    return { bg: "#FFF3E0", text: "#FF9800", dot: "#FF9800" };
  } else if (statusLower === "in progress") {
    return { bg: "#E3F2FD", text: "#2196F3", dot: "#2196F3" };
  } else if (statusLower === "resolved") {
    return { bg: "#E8F5E9", text: "#4CAF50", dot: "#4CAF50" };
  } else if (statusLower === "rejected") {
    return { bg: "#FFEBEE", text: "#D32F2F", dot: "#D32F2F" };
  }
  return { bg: "#F5F5F5", text: "#9E9E9E", dot: "#9E9E9E" };
};

// Separate Form Component to prevent re-renders
const ComplaintForm = memo(({ 
  visible, 
  onClose, 
  onSubmit, 
  editId,
  initialTitle,
  initialType,
  initialDescription,
  initialLocation,
  initialImage,
  submitting 
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, type: string, description: string, location: string, image: string | null) => void;
  editId: number | null;
  initialTitle: string;
  initialType: string;
  initialDescription: string;
  initialLocation: string;
  initialImage: string | null;
  submitting: boolean;
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [type, setType] = useState(initialType);
  const [description, setDescription] = useState(initialDescription);
  const [location, setLocation] = useState(initialLocation);
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage);

  useEffect(() => {
    setTitle(initialTitle);
    setType(initialType);
    setDescription(initialDescription);
    setLocation(initialLocation);
    setSelectedImage(initialImage);
  }, [initialTitle, initialType, initialDescription, initialLocation, initialImage]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant camera roll permissions to upload image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0].uri) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant camera permissions to take photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const handleSubmit = () => {
    onSubmit(title, type, description, location, selectedImage);
  };

  const handleClose = () => {
    setTitle("");
    setType("");
    setDescription("");
    setLocation("");
    setSelectedImage(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.formContainer}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.formTitle}>
            {editId ? "Update Complaint" : "Report New Issue"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.formContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <MaterialCommunityIcons name="tag" size={16} color="#2E7D32" />
              {"  "}Complaint Title *
            </Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Maize leaves turning yellow"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Type of Issue *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {complaintTypes.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.typeChip,
                    type === item.value && styles.typeChipActive,
                  ]}
                  onPress={() => setType(item.value)}
                >
                  <MaterialCommunityIcons 
                    name={item.icon} 
                    size={16} 
                    color={type === item.value ? "#FFF" : "#2E7D32"} 
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      type === item.value && styles.typeChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#2E7D32" />
              {"  "}Location *
            </Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Field A, North Section"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue in detail..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Upload Image (Optional)</Text>
            {selectedImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <MaterialCommunityIcons name="image" size={20} color="#2E7D32" />
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <MaterialCommunityIcons name="camera" size={20} color="#2E7D32" />
                <Text style={styles.imageButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={20} color="#FFF" />
                <Text style={styles.submitButtonText}>
                  {editId ? "Update Complaint" : "Submit Complaint"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
});

export default function ComplaintDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [viewComplaint, setViewComplaint] = useState<Complaint | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    title: "",
    type: "",
    description: "",
    location: "",
    image: null as string | null,
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showActionModal, setShowActionModal] = useState<number | null>(null);
  
  const getUserId = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
      }
    } catch (error) {
      console.error("Error getting user ID:", error);
    }
    return null;
  };

  const getToken = async () => {
    return await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
  };

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const id = await getUserId();
      
      if (!token || !id) {
        Alert.alert("Error", "Please login again");
        router.push("/login");
        return;
      }

      try {
        const response = await axios.get<Complaint[]>(
          `${BASE_URL}/complaints/user/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const sortedComplaints = response.data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setComplaints(sortedComplaints);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setComplaints([]);
        } else {
          console.error("Error loading complaints:", error);
          Alert.alert("Error", "Failed to load complaints");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setComplaints([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadComplaints();
  }, []);

  const handleSubmit = async (title: string, type: string, description: string, location: string, selectedImage: string | null) => {
    if (!title || !type || !description || !location) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();
      const id = await getUserId();
      
      if (!token || !id) {
        Alert.alert("Error", "Please login again");
        router.push("/login");
        return;
      }

      const formDataObj = new FormData();
      formDataObj.append('user_id', id.toString());
      formDataObj.append('title', title);
      formDataObj.append('type', type);
      formDataObj.append('description', description);
      formDataObj.append('location', location);
      
      if (selectedImage) {
        try {
          const uriParts = selectedImage.split('.');
          const fileExtension = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
          const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
          const filename = `${editId ? `complaint_${editId}` : 'complaint'}_${Date.now()}.${fileExtension}`;

          if (Platform.OS === 'web') {
            const response = await fetch(selectedImage);
            const blob = await response.blob();
            formDataObj.append('image', blob, filename);
          } else {
            formDataObj.append('image', {
              uri: selectedImage,
              type: mimeType,
              name: filename,
            } as any);
          }
        } catch (error) {
          console.error("Error preparing file:", error);
          Alert.alert("Warning", "Image could not be prepared, but complaint will still be submitted");
        }
      }

      if (editId) {
        await axios.put(
          `${BASE_URL}/complaints/${editId}?user_id=${id}`,
          formDataObj,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        Alert.alert("Success", "Complaint updated successfully");
      } else {
        await axios.post(
          `${BASE_URL}/complaints`,
          formDataObj,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        Alert.alert("Success", "Complaint submitted successfully");
      }

      setEditId(null);
      setEditData({ title: "", type: "", description: "", location: "", image: null });
      setShowForm(false);
      loadComplaints();
    } catch (error: any) {
      console.error("Error submitting complaint:", error);
      
      let errorMsg = "Failed to submit complaint";
      if (error.response) {
        if (error.response.status === 422) {
          const detail = error.response.data?.detail;
          if (Array.isArray(detail)) {
            errorMsg = detail.map((err: any) => err.msg).join('\n');
          } else if (detail) {
            errorMsg = detail;
          }
        } else {
          errorMsg = error.response.data?.detail || errorMsg;
        }
      }
      
      Alert.alert("Error", errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Delete Complaint",
      "Are you sure you want to delete this complaint?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              const userId = await getUserId();
              
              if (!token || !userId) {
                Alert.alert("Error", "Please login again");
                router.push("/login");
                return;
              }

              await axios.delete(
                `${BASE_URL}/complaints/${id}?user_id=${userId}`,
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );

              setComplaints(complaints.filter(c => c.id !== id));
              setShowActionModal(null);
              Alert.alert("Success", "Complaint deleted successfully");
            } catch (error: any) {
              console.error("Error deleting complaint:", error);
              Alert.alert("Error", error.response?.data?.detail || "Failed to delete complaint");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (complaint: Complaint) => {
    setEditData({
      title: complaint.title,
      type: complaint.type,
      description: complaint.description,
      location: complaint.location,
      image: complaint.image || null,
    });
    setEditId(complaint.id);
    setShowForm(true);
    setShowActionModal(null);
  };

  const handleAddNew = () => {
    setEditId(null);
    setEditData({ title: "", type: "", description: "", location: "", image: null });
    setShowForm(true);
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || c.status.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getTypeIcon = (type: string): IconName => {
    const found = complaintTypes.find(t => t.value === type);
    return found?.icon || "alert-circle";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Fixed Complaint Card Component with working three-dot menu
  const ComplaintCard = ({ item }: { item: Complaint }) => {
    const statusStyle = getStatusColor(item.status);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {item.status}
              </Text>
            </View>
          </View>
          
          {/* Three dots menu button - FIXED: Always visible for all complaints, not just pending */}
          <TouchableOpacity
            onPress={() => setShowActionModal(item.id)}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="dots-vertical" size={24} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => setViewComplaint(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardRow}>
              <MaterialCommunityIcons name={getTypeIcon(item.type)} size={16} color="#2E7D32" />
              <Text style={styles.cardType}>{item.type}</Text>
            </View>
            <View style={styles.cardRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#2E7D32" />
              <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
            </View>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            {item.image && (
              <>
                <MaterialCommunityIcons name="image" size={14} color="#666" />
                <Text style={styles.cardDate}>Photo</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Action Modal - Appears when three dots are clicked */}
        <Modal
          visible={showActionModal === item.id}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowActionModal(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowActionModal(null)}
          >
            <View style={styles.actionModal}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setViewComplaint(item);
                  setShowActionModal(null);
                }}
              >
                <MaterialCommunityIcons name="eye" size={20} color="#2196F3" />
                <Text style={styles.actionText}>View Details</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  handleEdit(item);
                  setShowActionModal(null);
                }}
              >
                <MaterialCommunityIcons name="pencil" size={20} color="#4CAF50" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => {
                  handleDelete(item.id);
                  setShowActionModal(null);
                }}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#D32F2F" />
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  const FilterModal = () => (
    <Modal visible={showFilterModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Complaints</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#2E7D32" />
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Status</Text>
          {["all", "pending", "in progress", "resolved", "rejected"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterOption,
                filterStatus === status && styles.filterOptionActive,
              ]}
              onPress={() => {
                setFilterStatus(status);
                setShowFilterModal(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  filterStatus === status && styles.filterOptionTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
              {filterStatus === status && (
                <MaterialCommunityIcons name="check" size={20} color="#2E7D32" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const ComplaintDetailModal = () => {
    if (!viewComplaint) return null;
    const statusStyle = getStatusColor(viewComplaint.status);
    
    return (
      <Modal visible={!!viewComplaint} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complaint Details</Text>
              <TouchableOpacity onPress={() => setViewComplaint(null)}>
                <MaterialCommunityIcons name="close" size={24} color="#2E7D32" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <>
                <View style={styles.detailStatus}>
                  <View style={[styles.detailStatusBadge, { backgroundColor: statusStyle.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
                    <Text style={[styles.detailStatusText, { color: statusStyle.text }]}>
                      {viewComplaint.status}
                    </Text>
                  </View>
                  <Text style={styles.detailId}>#{viewComplaint.id}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Title</Text>
                  <Text style={styles.detailValue}>{viewComplaint.title}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailHalf}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <View style={styles.detailType}>
                      <MaterialCommunityIcons 
                        name={getTypeIcon(viewComplaint.type)} 
                        size={16} 
                        color="#2E7D32" 
                      />
                      <Text style={styles.detailValue}>{viewComplaint.type}</Text>
                    </View>
                  </View>
                  <View style={styles.detailHalf}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <View style={styles.detailLocation}>
                      <MaterialCommunityIcons name="map-marker" size={16} color="#2E7D32" />
                      <Text style={styles.detailValue}>{viewComplaint.location}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailDescription}>{viewComplaint.description}</Text>
                </View>

                {viewComplaint.image && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Attached Image</Text>
                    <Image 
                      source={{ uri: viewComplaint.image }} 
                      style={styles.detailImage}
                      resizeMode="cover"
                    />
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Reported On</Text>
                  <Text style={styles.detailDate}>
                    {new Date(viewComplaint.created_at).toLocaleString()}
                  </Text>
                </View>
              </>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farm Complaints</Text>
        <TouchableOpacity onPress={handleAddNew} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#2E7D32" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search complaints..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close" size={20} color="#2E7D32" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.filterButton, filterStatus !== "all" && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <MaterialCommunityIcons 
            name="filter" 
            size={20} 
            color={filterStatus !== "all" ? "#FFF" : "#2E7D32"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{complaints.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {complaints.filter(c => c.status.toLowerCase() === "pending").length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {complaints.filter(c => c.status.toLowerCase() === "in progress").length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {complaints.filter(c => c.status.toLowerCase() === "resolved").length}
          </Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading complaints...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredComplaints}
          renderItem={({ item }) => <ComplaintCard item={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#2E7D32" />
              <Text style={styles.emptyText}>No complaints found</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleAddNew}
              >
                <Text style={styles.emptyButtonText}>Report Your First Issue</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <FilterModal />
      <ComplaintDetailModal />
      <ComplaintForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        editId={editId}
        initialTitle={editData.title}
        initialType={editData.type}
        initialDescription={editData.description}
        initialLocation={editData.location}
        initialImage={editData.image}
        submitting={submitting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5E9",
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
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 15,
    color: "#333",
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  filterButtonActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#cefec2",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 6,
  },
  menuButton: {
    padding: 8,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2E7D32",
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  cardContent: {
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  cardType: {
    fontSize: 13,
    color: "#2E7D32",
  },
  cardLocation: {
    fontSize: 13,
    color: "#2E7D32",
    flex: 1,
  },
  cardDescription: {
    fontSize: 13,
    color: "#333",
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#E8F5E9",
    paddingTop: 8,
  },
  cardDate: {
    fontSize: 11,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#2E7D32",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#2E7D32",
    marginTop: 10,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionModal: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 8,
    width: 200,
    position: "absolute",
    right: 20,
    top: "50%",
    marginTop: -100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  deleteButton: {
    borderTopWidth: 1,
    borderTopColor: "#E8F5E9",
  },
  actionText: {
    fontSize: 14,
    color: "#333",
  },
  deleteText: {
    color: "#D32F2F",
  },
  filterModal: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 10,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#F5F5F5",
  },
  filterOptionActive: {
    backgroundColor: "#E8F5E9",
  },
  filterOptionText: {
    fontSize: 15,
    color: "#333",
  },
  filterOptionTextActive: {
    color: "#2E7D32",
    fontWeight: "500",
  },
  detailModal: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  detailStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  detailStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  detailStatusText: {
    fontSize: 13,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  detailId: {
    fontSize: 12,
    color: "#2E7D32",
  },
  detailSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  detailHalf: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#2E7D32",
    marginBottom: 4,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 15,
    color: "#333",
  },
  detailType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailDescription: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  detailImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  detailDate: {
    fontSize: 13,
    color: "#666",
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#E8F5E9",
  },
  formHeader: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  formContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  typeScroll: {
    flexDirection: "row",
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#2E7D32",
    gap: 6,
  },
  typeChipActive: {
    backgroundColor: "#2E7D32",
  },
  typeChipText: {
    fontSize: 13,
    color: "#2E7D32",
  },
  typeChipTextActive: {
    color: "#FFF",
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 12,
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#D32F2F",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  imageButtons: {
    flexDirection: "row",
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2E7D32",
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    color: "#2E7D32",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
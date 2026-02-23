import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define types
interface Complaint {
  id: number;
  title: string;
  type: string;
  description: string;
  location: string;
  status: string;
  image?: string;
  created_at: string;
}

interface FormData {
  title: string;
  type: string;
  description: string;
  location: string;
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
  { value: "Soil Issue", label: "Soil Issue", icon: "earth" }, // Changed from "soil" to "earth"
  { value: "Equipment Failure", label: "Equipment Failure", icon: "tractor" },
  { value: "Other", label: "Other Issue", icon: "dots-horizontal" },
];

export default function ComplaintDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [viewComplaint, setViewComplaint] = useState<Complaint | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showActionModal, setShowActionModal] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    type: "",
    description: "",
    location: "",
  });

  // Mock data for preview
  const mockComplaints: Complaint[] = [
    {
      id: 1,
      title: "Pest Attack on Maize",
      type: "Pest Attack",
      description: "Army worms detected in Field A",
      location: "Field A, North Section",
      status: "pending",
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Irrigation System Failure",
      type: "Equipment Failure",
      description: "Water pump not working",
      location: "Field B",
      status: "in progress",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 3,
      title: "Crop Disease",
      type: "Crop Disease",
      description: "Maize leaves turning yellow",
      location: "Field C",
      status: "resolved",
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  // Load complaints
  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setComplaints(mockComplaints);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading complaints:", error);
      Alert.alert("Error", "Failed to load complaints");
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadComplaints();
  }, []);

  // Image picker
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to upload image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
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
  };

  // Handle form submit
  const handleSubmit = () => {
    if (!formData.title || !formData.type || !formData.description || !formData.location) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const newComplaint: Complaint = {
        id: Date.now(),
        ...formData,
        status: "pending",
        created_at: new Date().toISOString(),
        image: selectedImage || undefined,
      };

      if (editId) {
        setComplaints(complaints.map(c => c.id === editId ? { ...c, ...formData } : c));
        Alert.alert("Success", "Complaint updated successfully");
      } else {
        setComplaints([newComplaint, ...complaints]);
        Alert.alert("Success", "Complaint submitted successfully");
      }

      // Reset form
      setFormData({ title: "", type: "", description: "", location: "" });
      setSelectedImage(null);
      setEditId(null);
      setShowForm(false);
      setLoading(false);
    }, 1000);
  };

  // Handle delete
  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Complaint",
      "Are you sure you want to delete this complaint?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setComplaints(complaints.filter(c => c.id !== id));
            setShowActionModal(null);
            Alert.alert("Success", "Complaint deleted successfully");
          },
        },
      ]
    );
  };

  // Handle edit
  const handleEdit = (complaint: Complaint) => {
    setFormData({
      title: complaint.title,
      type: complaint.type,
      description: complaint.description,
      location: complaint.location,
    });
    setSelectedImage(complaint.image || null);
    setEditId(complaint.id);
    setShowForm(true);
    setShowActionModal(null);
  };

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "in progress":
        return "#2196F3";
      default:
        return "#9E9E9E";
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "#E8F5E9";
      case "pending":
        return "#FFF3E0";
      case "in progress":
        return "#E3F2FD";
      default:
        return "#F5F5F5";
    }
  };

  // Get icon for complaint type
  const getTypeIcon = (type: string): IconName => {
    const found = complaintTypes.find(t => t.value === type);
    return found?.icon || "alert-circle";
  };

  // Format date
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

  // Complaint Card Component
  const ComplaintCard = ({ item }: { item: Complaint }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setViewComplaint(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.status) }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowActionModal(item.id)}
          style={styles.menuButton}
        >
          <MaterialCommunityIcons name="dots-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>

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
        <MaterialCommunityIcons name="clock-outline" size={14} color="#999" />
        <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
      </View>

      {/* Action Modal */}
      <Modal visible={showActionModal === item.id} transparent>
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
              onPress={() => handleEdit(item)}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#4CAF50" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(item.id)}
            >
              <MaterialCommunityIcons name="delete" size={20} color="#D32F2F" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );

  // Filter Modal
  const FilterModal = () => (
    <Modal visible={showFilterModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Complaints</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Status</Text>
          {["all", "pending", "in progress", "resolved"].map((status) => (
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

  // Complaint Detail Modal
  const ComplaintDetailModal = () => (
    <Modal visible={!!viewComplaint} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.detailModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complaint Details</Text>
            <TouchableOpacity onPress={() => setViewComplaint(null)}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {viewComplaint && (
              <>
                <View style={styles.detailStatus}>
                  <View style={[styles.detailStatusBadge, { backgroundColor: getStatusBgColor(viewComplaint.status) }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(viewComplaint.status) }]} />
                    <Text style={[styles.detailStatusText, { color: getStatusColor(viewComplaint.status) }]}>
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
                    <Image source={{ uri: viewComplaint.image }} style={styles.detailImage} />
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Reported On</Text>
                  <Text style={styles.detailDate}>
                    {new Date(viewComplaint.created_at).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailButtons}>
                  <TouchableOpacity
                    style={[styles.detailButton, styles.editButton]}
                    onPress={() => {
                      handleEdit(viewComplaint);
                      setViewComplaint(null);
                    }}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color="#FFF" />
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailButton, styles.deleteDetailButton]}
                    onPress={() => {
                      handleDelete(viewComplaint.id);
                      setViewComplaint(null);
                    }}
                  >
                    <MaterialCommunityIcons name="delete" size={20} color="#FFF" />
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Form Modal
  const FormModal = () => (
    <Modal visible={showForm} animationType="slide">
      <SafeAreaView style={styles.formContainer}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setShowForm(false)} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.formTitle}>
            {editId ? "Update Complaint" : "Report New Issue"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.formContent}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <MaterialCommunityIcons name="tag" size={16} color="#2E7D32" />
              {"  "}Complaint Title *
            </Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="e.g., Maize leaves turning yellow"
              placeholderTextColor="#999"
            />
          </View>

          {/* Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Type of Issue *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {complaintTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeChip,
                    formData.type === type.value && styles.typeChipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, type: type.value })}
                >
                  <MaterialCommunityIcons 
                    name={type.icon} 
                    size={16} 
                    color={formData.type === type.value ? "#FFF" : "#2E7D32"} 
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      formData.type === type.value && styles.typeChipTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#2E7D32" />
              {"  "}Location *
            </Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="e.g., Field A, North Section"
              placeholderTextColor="#999"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe the issue in detail..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Image Upload */}
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

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farm Complaints</Text>
        <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search complaints..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close" size={20} color="#999" />
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

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{complaints.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {complaints.filter(c => c.status === "pending").length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {complaints.filter(c => c.status === "in progress").length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {complaints.filter(c => c.status === "resolved").length}
          </Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* Complaints List */}
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
              <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>No complaints found</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowForm(true)}
              >
                <Text style={styles.emptyButtonText}>Report Your First Issue</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modals */}
      <FilterModal />
      <ComplaintDetailModal />
      <FormModal />
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
    borderColor: "#E0E0E0",
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
    borderColor: "#E0E0E0",
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    color: "#333",
    marginBottom: 6,
  },
  menuButton: {
    padding: 4,
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
    color: "#666",
  },
  cardLocation: {
    fontSize: 13,
    color: "#666",
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
  },
  cardDate: {
    fontSize: 11,
    color: "#999",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
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
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  deleteButton: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
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
    color: "#333",
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
    color: "#999",
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
    color: "#999",
    marginBottom: 4,
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
  },
  detailDate: {
    fontSize: 13,
    color: "#666",
  },
  detailButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  detailButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  editButton: {
    backgroundColor: "#2196F3",
  },
  deleteDetailButton: {
    backgroundColor: "#D32F2F",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#F5F7FA",
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
    borderColor: "#E0E0E0",
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
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
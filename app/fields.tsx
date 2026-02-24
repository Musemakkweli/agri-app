import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BASE_URL from "../services/api";

const { width } = Dimensions.get("window");

// Simplified color palette - reduced from 8+ colors to 5
const COLORS = {
  primary: "#2E7D32",      // Green - main brand color
  secondary: "#8B5A2B",    // Brown - accent color
  text: {
    primary: "#333333",    // Dark gray - main text
    secondary: "#666666",  // Medium gray - secondary text
    light: "#999999",      // Light gray - placeholder text
  },
  background: {
    main: "#F8F5F0",       // Off-white - main background
    card: "#FFFFFF",       // White - card background
    overlay: "rgba(0,0,0,0.5)", // Semi-transparent black
  },
  border: "#E8E0D5",       // Light brown - borders
  white: "#FFFFFF",
  black: "#000000",
  // Semantic colors - only used for specific meanings
  danger: "#D32F2F",       // Red - delete actions
  info: "#2196F3",         // Blue - view actions
  success: "#4CAF50",      // Green - edit/save actions
  warning: "#FF9800",      // Orange - download actions
} as const;

interface Field {
  id: number;
  name: string;
  area: string;
  crop_type: string;
  location: string;
  user_id: number;
}

// Field Card Component
const FieldCard = ({ field, onView, onEdit, onDelete, onDownload }: any) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardTitleContainer}>
        <MaterialCommunityIcons name="terrain" size={24} color={COLORS.primary} />
        <Text style={styles.cardTitle}>{field.name}</Text>
      </View>
      <TouchableOpacity style={styles.menuButton}>
        <MaterialCommunityIcons name="dots-vertical" size={24} color={COLORS.text.secondary} />
      </TouchableOpacity>
    </View>

    <View style={styles.cardContent}>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="ruler" size={16} color={COLORS.secondary} />
        <Text style={styles.infoText}>Area: {field.area || '-'} ha</Text>
      </View>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="sprout" size={16} color={COLORS.secondary} />
        <Text style={styles.infoText}>Crop: {field.crop_type || '-'}</Text>
      </View>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.secondary} />
        <Text style={styles.infoText}>Location: {field.location || '-'}</Text>
      </View>
    </View>

    <View style={styles.cardActions}>
      <TouchableOpacity style={styles.actionButton} onPress={onView}>
        <MaterialCommunityIcons name="eye" size={20} color={COLORS.info} />
        <Text style={styles.actionText}>View</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
        <MaterialCommunityIcons name="pencil" size={20} color={COLORS.success} />
        <Text style={styles.actionText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
        <MaterialCommunityIcons name="delete" size={20} color={COLORS.danger} />
        <Text style={styles.actionText}>Delete</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onDownload}>
        <MaterialCommunityIcons name="download" size={20} color={COLORS.warning} />
        <Text style={styles.actionText}>CSV</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Modal Component
const CustomModal = ({ visible, title, children, onClose, onConfirm }: any) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>
          {children}
          {onConfirm && (
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={onConfirm}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  </Modal>
);

export default function FieldsScreen() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [viewField, setViewField] = useState<Field | null>(null);
  const [deleteFieldId, setDeleteFieldId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    area: "",
    crop_type: "",
    location: "",
  });

  const loadFields = async () => {
    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      const userStr = await AsyncStorage.getItem("user");
      
      if (!token || !userStr) {
        Alert.alert("Error", "Please login again");
        router.push("/login");
        return;
      }

      const user = JSON.parse(userStr);
      
      const response = await axios.get(`${BASE_URL}/fields/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFields(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error loading fields:", error);
      Alert.alert("Error", "Failed to load fields");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadFields();
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.area || !formData.crop_type || !formData.location) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      const userStr = await AsyncStorage.getItem("user");
      
      if (!token || !userStr) {
        Alert.alert("Error", "Please login again");
        router.push("/login");
        return;
      }

      const user = JSON.parse(userStr);
      const payload = {
        ...formData,
        area: parseFloat(formData.area),
        user_id: user.id
      };

      if (editingField) {
        await axios.put(`${BASE_URL}/fields/${editingField.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert("Success", "Field updated successfully!");
      } else {
        await axios.post(`${BASE_URL}/fields`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert("Success", "Field added successfully!");
      }

      setFormData({ name: "", area: "", crop_type: "", location: "" });
      setEditingField(null);
      setShowForm(false);
      loadFields();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.detail || "Failed to save field");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteFieldId) return;

    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      
      await axios.delete(`${BASE_URL}/fields/${deleteFieldId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFields(fields.filter(f => f.id !== deleteFieldId));
      setDeleteFieldId(null);
      Alert.alert("Success", "Field deleted successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.detail || "Failed to delete field");
    }
  };

  const handleDownload = (field: Field) => {
    Alert.alert("Download", "CSV download feature coming soon!");
  };

  const handleEdit = (field: Field) => {
    setFormData({
      name: field.name,
      area: field.area.toString(),
      crop_type: field.crop_type || "",
      location: field.location || "",
    });
    setEditingField(field);
    setShowForm(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Fields</Text>
        <TouchableOpacity onPress={() => {
          setEditingField(null);
          setFormData({ name: "", area: "", crop_type: "", location: "" });
          setShowForm(true);
        }} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Add/Edit Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.formModalOverlay}>
          <View style={styles.formModalContent}>
            <View style={styles.formModalHeader}>
              <Text style={styles.formModalTitle}>
                {editingField ? "Edit Field" : "Add New Field"}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formModalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Field Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Field A"
                  placeholderTextColor={COLORS.text.light}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Area (hectares)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.area}
                  onChangeText={(text) => setFormData({ ...formData, area: text })}
                  placeholder="e.g., 5"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.text.light}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Crop Type</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.crop_type}
                  onChangeText={(text) => setFormData({ ...formData, crop_type: text })}
                  placeholder="e.g., Maize"
                  placeholderTextColor={COLORS.text.light}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="e.g., North Section"
                  placeholderTextColor={COLORS.text.light}
                />
              </View>

              <View style={styles.formButtonContainer}>
                <TouchableOpacity
                  style={styles.formCancelButton}
                  onPress={() => setShowForm(false)}
                >
                  <Text style={styles.formCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formSubmitButton, submitting && styles.formSubmitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.formSubmitButtonText}>
                      {editingField ? "Update" : "Save"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* View Modal */}
      <CustomModal
        visible={!!viewField}
        title="Field Details"
        onClose={() => setViewField(null)}
      >
        {viewField && (
          <View>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Name:</Text> {viewField.name}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Area:</Text> {viewField.area} ha
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Crop:</Text> {viewField.crop_type || '-'}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Location:</Text> {viewField.location || '-'}
            </Text>
          </View>
        )}
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        visible={!!deleteFieldId}
        title="Confirm Delete"
        onClose={() => setDeleteFieldId(null)}
        onConfirm={handleDelete}
      >
        <Text style={styles.confirmText}>Are you sure you want to delete this field?</Text>
      </CustomModal>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading fields...</Text>
        </View>
      ) : fields.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="terrain" size={60} color={COLORS.text.light} />
          <Text style={styles.emptyText}>No fields added yet</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              setEditingField(null);
              setFormData({ name: "", area: "", crop_type: "", location: "" });
              setShowForm(true);
            }}
          >
            <Text style={styles.emptyButtonText}>Add Your First Field</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[COLORS.primary]} 
              tintColor={COLORS.primary}
            />
          }
        >
          {fields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              onView={() => setViewField(field)}
              onEdit={() => handleEdit(field)}
              onDelete={() => setDeleteFieldId(field.id)}
              onDownload={() => handleDownload(field)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.main,
  },
  header: {
    backgroundColor: COLORS.primary,
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
    color: COLORS.white,
  },
  addButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.text.light,
    marginTop: 10,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "500",
  },
  card: {
    backgroundColor: COLORS.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  menuButton: {
    padding: 4,
  },
  cardContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.background.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.background.card,
    borderRadius: 20,
    width: "80%",
    maxWidth: 400,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background.main,
  },
  modalCancelText: {
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  modalConfirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
  },
  modalConfirmText: {
    color: COLORS.white,
    fontWeight: "500",
  },
  detailText: {
    fontSize: 15,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  confirmText: {
    fontSize: 16,
    color: COLORS.text.primary,
    textAlign: "center",
  },
  // Form Modal Styles
  formModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.background.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  formModalContent: {
    backgroundColor: COLORS.background.card,
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
  },
  formModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  formModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  formModalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: COLORS.background.main,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
  },
  formCancelButton: {
    flex: 1,
    backgroundColor: COLORS.background.main,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formCancelButtonText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  formSubmitButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  formSubmitButtonDisabled: {
    opacity: 0.7,
  },
  formSubmitButtonText: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: "600",
  },
});
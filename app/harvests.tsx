import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useTheme } from '../context/ThemeContext';
import BASE_URL from "../services/api"; // ✅ Correct import path

interface Harvest {
  id: number;
  field_id: number;
  crop_type: string;
  harvest_date: string;
  status: string;
  field_name?: string;
}

interface Field {
  id: number;
  name: string;
}

// Harvest Card Component
const HarvestCard = ({ harvest, onView, onEdit, onDelete, onDownload, isDarkMode }: any) => (
  <View style={[styles.card, isDarkMode && styles.darkCard]}>
    <View style={styles.cardHeader}>
      <View style={styles.cardTitleContainer}>
        <MaterialCommunityIcons name="calendar-check" size={24} color="#8B5A2B" />
        <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>
          {harvest.crop_type || 'Unknown'} - Field {harvest.field_id}
        </Text>
      </View>
      <TouchableOpacity style={styles.menuButton}>
        <MaterialCommunityIcons name="dots-vertical" size={24} color={isDarkMode ? "#AAA" : "#666"} />
      </TouchableOpacity>
    </View>

    <View style={styles.cardContent}>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="calendar" size={16} color="#8B5A2B" />
        <Text style={[styles.infoText, isDarkMode && styles.darkSubText]}>
          Date: {new Date(harvest.harvest_date).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="information" size={16} color="#8B5A2B" />
        <Text style={[styles.infoText, isDarkMode && styles.darkSubText]}>Status: {harvest.status}</Text>
      </View>
    </View>

    <View style={[styles.cardActions, isDarkMode && styles.darkBorder]}>
      <TouchableOpacity style={styles.actionButton} onPress={onView}>
        <MaterialCommunityIcons name="eye" size={20} color="#a8c8e2" />
        <Text style={[styles.actionText, isDarkMode && styles.darkSubText]}>View</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
        <MaterialCommunityIcons name="pencil" size={20} color="#90d692" />
        <Text style={[styles.actionText, isDarkMode && styles.darkSubText]}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
        <MaterialCommunityIcons name="delete" size={20} color="#f4c4c0" />
        <Text style={[styles.actionText, isDarkMode && styles.darkSubText]}>Delete</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onDownload}>
        <MaterialCommunityIcons name="download" size={20} color="#d7b581" />
        <Text style={[styles.actionText, isDarkMode && styles.darkSubText]}>CSV</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Modal Component
const CustomModal = ({ visible, title, children, onClose, onConfirm, isDarkMode }: any) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
        <View style={[styles.modalHeader, isDarkMode && styles.darkBorder]}>
          <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? "#FFF" : "#8B5A2B"} />
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>
          {children}
          {onConfirm && (
            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalCancelButton, isDarkMode && styles.darkCancelButton]} onPress={onClose}>
                <Text style={[styles.modalCancelText, isDarkMode && styles.darkSubText]}>Cancel</Text>
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

export default function HarvestsScreen() {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [viewHarvest, setViewHarvest] = useState<Harvest | null>(null);
  const [deleteHarvestId, setDeleteHarvestId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const { isDarkMode } = useTheme();

  const [formData, setFormData] = useState({
    field_id: "",
    crop_type: "",
    harvest_date: "",
    status: "upcoming",
  });

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      const userStr = await AsyncStorage.getItem("user");
      
      if (!token || !userStr) {
        Alert.alert("Error", "Please login again");
        router.push("/login");
        return;
      }

      const user = JSON.parse(userStr);
      
      // Load harvests - handle 404 as empty array
      try {
        const harvestsRes = await axios.get(`${BASE_URL}/harvests/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHarvests(Array.isArray(harvestsRes.data) ? harvestsRes.data : []);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // No harvests found - this is fine
          setHarvests([]);
        } else {
          console.error("Error loading harvests:", error);
          setHarvests([]);
        }
      }

      // Load fields for dropdown - handle 404 as empty array
      try {
        const fieldsRes = await axios.get(`${BASE_URL}/fields/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFields(Array.isArray(fieldsRes.data) ? fieldsRes.data : []);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // No fields found - this is fine
          setFields([]);
        } else {
          console.error("Error loading fields:", error);
          setFields([]);
        }
      }
      
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSubmit = async () => {
    if (!formData.field_id) {
      Alert.alert("Error", "Please select a field");
      return;
    }
    
    if (!formData.harvest_date) {
      Alert.alert("Error", "Please enter harvest date");
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
      
      // Validate that the selected field exists
      const selectedField = fields.find(f => f.id.toString() === formData.field_id);
      if (!selectedField) {
        Alert.alert("Error", "Please select a valid field");
        setSubmitting(false);
        return;
      }

      // FIXED: Match backend exactly
      const payload = {
        farmer_id: user.id,
        field_id: parseInt(formData.field_id),
        crop_type: formData.crop_type || null,
        harvest_date: formData.harvest_date,
        status: formData.status
      };

      console.log("Submitting harvest with payload:", payload);

      if (editingHarvest) {
        await axios.put(`${BASE_URL}/harvests/${editingHarvest.id}`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        Alert.alert("Success", "Harvest updated successfully!", [
          {
            text: "OK",
            onPress: () => {
              setFormData({ field_id: "", crop_type: "", harvest_date: "", status: "upcoming" });
              setEditingHarvest(null);
              setShowForm(false);
              loadData();
            }
          }
        ]);
      } else {
        await axios.post(`${BASE_URL}/harvests`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        Alert.alert("Success", "Harvest scheduled successfully!", [
          {
            text: "OK",
            onPress: () => {
              setFormData({ field_id: "", crop_type: "", harvest_date: "", status: "upcoming" });
              setShowForm(false);
              loadData();
            }
          }
        ]);
      }

    } catch (error: any) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      let errorMessage = "Failed to save harvest";
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((d: any) => d.msg).join(", ");
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteHarvestId) return;

    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      
      await axios.delete(`${BASE_URL}/harvests/${deleteHarvestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setHarvests(harvests.filter(h => h.id !== deleteHarvestId));
      setDeleteHarvestId(null);
      Alert.alert("Success", "Harvest deleted successfully!");
    } catch (error: any) {
      console.error("Delete error:", error.response?.data);
      Alert.alert("Error", error.response?.data?.detail || "Failed to delete harvest");
    }
  };

  const handleDownload = (harvest: Harvest) => {
    Alert.alert("Download", "CSV download feature coming soon!");
  };

  const handleEdit = (harvest: Harvest) => {
    setFormData({
      field_id: harvest.field_id.toString(),
      crop_type: harvest.crop_type || "",
      harvest_date: harvest.harvest_date.split('T')[0],
      status: harvest.status || "upcoming",
    });
    setEditingHarvest(harvest);
    setShowForm(true);
    setMenuOpen(null);
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Harvests</Text>
        <TouchableOpacity 
          onPress={() => {
            setEditingHarvest(null);
            setFormData({ field_id: "", crop_type: "", harvest_date: "", status: "upcoming" });
            setShowForm(true);
          }} 
          style={styles.addButton}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
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
          <View style={[styles.formModalContent, isDarkMode && styles.darkFormModalContent]}>
            <View style={[styles.formModalHeader, isDarkMode && styles.darkBorder]}>
              <Text style={[styles.formModalTitle, isDarkMode && styles.darkText]}>
                {editingHarvest ? "Edit Harvest" : "Schedule Harvest"}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)} disabled={submitting}>
                <MaterialCommunityIcons name="close" size={24} color={isDarkMode ? "#FFF" : "#8B5A2B"} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formModalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Select Field *</Text>
                {fields.length === 0 ? (
                  <View style={[styles.noFieldsContainer, isDarkMode && styles.darkNoFieldsContainer]}>
                    <Text style={[styles.noFieldsText, isDarkMode && styles.darkSubText]}>No fields available. Please add a field first.</Text>
                    <TouchableOpacity
                      style={styles.goToFieldsButton}
                      onPress={() => {
                        setShowForm(false);
                        router.push("/fields");
                      }}
                    >
                      <Text style={styles.goToFieldsButtonText}>Go to Fields</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.pickerContainer}>
                    {fields.map((field) => (
                      <TouchableOpacity
                        key={field.id}
                        style={[
                          styles.pickerOption,
                          formData.field_id === field.id.toString() && styles.pickerOptionSelected,
                          isDarkMode && styles.darkPickerOption
                        ]}
                        onPress={() => setFormData({ ...formData, field_id: field.id.toString() })}
                        disabled={submitting}
                      >
                        <Text style={[
                          styles.pickerOptionText,
                          formData.field_id === field.id.toString() && styles.pickerOptionTextSelected,
                          isDarkMode && styles.darkText
                        ]}>
                          {field.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Crop Type</Text>
                <TextInput
                  style={[styles.formInput, isDarkMode && styles.darkInput]}
                  value={formData.crop_type}
                  onChangeText={(text) => setFormData({ ...formData, crop_type: text })}
                  placeholder="e.g., Maize"
                  placeholderTextColor={isDarkMode ? "#666" : "#999"}
                  editable={!submitting}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Harvest Date *</Text>
                <TextInput
                  style={[styles.formInput, isDarkMode && styles.darkInput]}
                  value={formData.harvest_date}
                  onChangeText={(text) => setFormData({ ...formData, harvest_date: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={isDarkMode ? "#666" : "#999"}
                  editable={!submitting}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>Status</Text>
                <View style={styles.pickerContainer}>
                  {["upcoming", "completed"].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.pickerOption,
                        formData.status === status && styles.pickerOptionSelected,
                        isDarkMode && styles.darkPickerOption
                      ]}
                      onPress={() => setFormData({ ...formData, status })}
                      disabled={submitting}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.status === status && styles.pickerOptionTextSelected,
                        isDarkMode && styles.darkText
                      ]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formButtonContainer}>
                <TouchableOpacity
                  style={[styles.formCancelButton, isDarkMode && styles.darkCancelButton]}
                  onPress={() => setShowForm(false)}
                  disabled={submitting}
                >
                  <Text style={[styles.formCancelButtonText, isDarkMode && styles.darkSubText]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formSubmitButton, submitting && styles.formSubmitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting || fields.length === 0}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.formSubmitButtonText}>
                      {editingHarvest ? "Update" : "Save"}
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
        visible={!!viewHarvest}
        title="Harvest Details"
        onClose={() => setViewHarvest(null)}
        isDarkMode={isDarkMode}
      >
        {viewHarvest && (
          <View>
            <Text style={[styles.detailText, isDarkMode && styles.darkText]}>
              <Text style={[styles.detailLabel, isDarkMode && styles.darkText]}>Field ID:</Text> {viewHarvest.field_id}
            </Text>
            <Text style={[styles.detailText, isDarkMode && styles.darkText]}>
              <Text style={[styles.detailLabel, isDarkMode && styles.darkText]}>Crop:</Text> {viewHarvest.crop_type || 'N/A'}
            </Text>
            <Text style={[styles.detailText, isDarkMode && styles.darkText]}>
              <Text style={[styles.detailLabel, isDarkMode && styles.darkText]}>Date:</Text> {new Date(viewHarvest.harvest_date).toLocaleDateString()}
            </Text>
            <Text style={[styles.detailText, isDarkMode && styles.darkText]}>
              <Text style={[styles.detailLabel, isDarkMode && styles.darkText]}>Status:</Text> {viewHarvest.status}
            </Text>
          </View>
        )}
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        visible={!!deleteHarvestId}
        title="Confirm Delete"
        onClose={() => setDeleteHarvestId(null)}
        onConfirm={handleDelete}
        isDarkMode={isDarkMode}
      >
        <Text style={[styles.confirmText, isDarkMode && styles.darkText]}>Are you sure you want to delete this harvest?</Text>
      </CustomModal>

      {/* Content */}
      {loading ? (
        <View style={[styles.loadingContainer, isDarkMode && styles.darkContainer]}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>Loading harvests...</Text>
        </View>
      ) : harvests.length === 0 ? (
        <View style={[styles.emptyContainer, isDarkMode && styles.darkContainer]}>
          <MaterialCommunityIcons name="calendar-check" size={60} color={isDarkMode ? "#555" : "#CCC"} />
          <Text style={[styles.emptyText, isDarkMode && styles.darkSubText]}>No harvests scheduled yet</Text>
          {fields.length === 0 ? (
            <>
              <Text style={[styles.emptySubText, isDarkMode && styles.darkSubText]}>You need to add a field first</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/fields")}
              >
                <Text style={styles.emptyButtonText}>Go to Fields</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => {
                setEditingHarvest(null);
                setFormData({ field_id: "", crop_type: "", harvest_date: "", status: "upcoming" });
                setShowForm(true);
              }}
            >
              <Text style={styles.emptyButtonText}>Schedule Your First Harvest</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} />
          }
        >
          {harvests.map((harvest) => (
            <HarvestCard
              key={harvest.id}
              harvest={harvest}
              onView={() => setViewHarvest(harvest)}
              onEdit={() => handleEdit(harvest)}
              onDelete={() => setDeleteHarvestId(harvest.id)}
              onDownload={() => handleDownload(harvest)}
              isDarkMode={isDarkMode}
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
    backgroundColor: "#F8F5F0",
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
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
    color: "#2E7D32",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginBottom: 20,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#cdefbe",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkCard: {
    backgroundColor: "#1E1E1E",
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
    color: "#8B5A2B",
    flex: 1,
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
    color: "#666",
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#E8E0D5",
    paddingTop: 12,
  },
  darkBorder: {
    borderTopColor: "#333",
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    color: "#666",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: "80%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  darkModalContent: {
    backgroundColor: "#1E1E1E",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E0D5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B5A2B",
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
    backgroundColor: "#F5F5F5",
  },
  darkCancelButton: {
    backgroundColor: "#2A2A2A",
  },
  modalCancelText: {
    color: "#666",
    fontWeight: "500",
  },
  modalConfirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#D32F2F",
  },
  modalConfirmText: {
    color: "#FFF",
    fontWeight: "500",
  },
  detailText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: "bold",
    color: "#8B5A2B",
  },
  confirmText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  // Form Modal Styles
  formModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  formModalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
  },
  darkFormModalContent: {
    backgroundColor: "#1E1E1E",
  },
  formModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E0D5",
  },
  formModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B5A2B",
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
    color: "#8B5A2B",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  darkInput: {
    backgroundColor: "#2A2A2A",
    color: "#FFF",
    borderColor: "#444",
  },
  formButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
  },
  formCancelButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  formCancelButtonText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  formSubmitButton: {
    flex: 1,
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  formSubmitButtonDisabled: {
    backgroundColor: "#81C784",
    opacity: 0.7,
  },
  formSubmitButtonText: {
    fontSize: 15,
    color: "#FFF",
    fontWeight: "600",
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#8B5A2B",
    backgroundColor: "#FFF",
  },
  darkPickerOption: {
    backgroundColor: "#2A2A2A",
  },
  pickerOptionSelected: {
    backgroundColor: "#8B5A2B",
  },
  pickerOptionText: {
    fontSize: 14,
    color: "#8B5A2B",
  },
  pickerOptionTextSelected: {
    color: "#FFF",
  },
  noFieldsContainer: {
    padding: 16,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    alignItems: "center",
  },
  darkNoFieldsContainer: {
    backgroundColor: "#2A1A0A",
  },
  noFieldsText: {
    fontSize: 14,
    color: "#8B5A2B",
    marginBottom: 10,
    textAlign: "center",
  },
  goToFieldsButton: {
    backgroundColor: "#8B5A2B",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goToFieldsButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  // Dark mode text styles
  darkText: {
    color: "#FFF",
  },
  darkSubText: {
    color: "#AAA",
  },
});
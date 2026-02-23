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
import BASE_URL from "../services/api";

interface Pest {
  id: number;
  field_id: number;
  pest_type: string;
  severity: string;
  description: string;
  created_at: string;
  field_name?: string;
}

interface Field {
  id: number;
  name: string;
}

// Pest Card Component
const PestCard = ({ pest, onView, onEdit, onDelete, onDownload }: any) => {
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "#D32F2F";
      case "medium":
        return "#FF9800";
      case "low":
        return "#4CAF50";
      default:
        return "#8B5A2B";
    }
  };

  const severityColor = getSeverityColor(pest.severity);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <MaterialCommunityIcons name="bug" size={24} color={severityColor} />
          <Text style={styles.cardTitle}>
            {pest.pest_type} - Field {pest.field_id}
          </Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="alert-circle" size={16} color="#8B5A2B" />
          <Text style={styles.infoText}>Severity: </Text>
          <View style={[styles.severityBadge, { backgroundColor: severityColor + "20" }]}>
            <Text style={[styles.severityText, { color: severityColor }]}>
              {pest.severity?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={16} color="#8B5A2B" />
          <Text style={styles.infoText}>
            Detected: {new Date(pest.created_at).toLocaleDateString()}
          </Text>
        </View>
        {pest.description ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description:</Text>
            <Text style={styles.descriptionText}>{pest.description}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onView}>
          <MaterialCommunityIcons name="eye" size={20} color="#2196F3" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <MaterialCommunityIcons name="pencil" size={20} color="#4CAF50" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <MaterialCommunityIcons name="delete" size={20} color="#F44336" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDownload}>
          <MaterialCommunityIcons name="download" size={20} color="#FF9800" />
          <Text style={styles.actionText}>CSV</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
            <MaterialCommunityIcons name="close" size={24} color="#8B5A2B" />
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

export default function PestsScreen() {
  const [pests, setPests] = useState<Pest[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPest, setEditingPest] = useState<Pest | null>(null);
  const [viewPest, setViewPest] = useState<Pest | null>(null);
  const [deletePestId, setDeletePestId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    field_id: "",
    pest_type: "",
    severity: "low",
    description: "",
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
      
      // Load pests
      const pestsRes = await axios.get(`${BASE_URL}/pest-alerts/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPests(Array.isArray(pestsRes.data) ? pestsRes.data : []);

      // Load fields for dropdown
      const fieldsRes = await axios.get(`${BASE_URL}/fields/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFields(Array.isArray(fieldsRes.data) ? fieldsRes.data : []);
      
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load pest alerts");
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
    if (!formData.field_id || !formData.pest_type) {
      Alert.alert("Error", "Field and Pest Type are required");
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
        farmer_id: user.id,
        field_id: parseInt(formData.field_id),
        pest_type: formData.pest_type,
        severity: formData.severity || "low",
        description: formData.description || "",
      };

      if (editingPest) {
        await axios.put(`${BASE_URL}/pest-alerts/${editingPest.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert("Success", "Pest alert updated successfully!");
      } else {
        await axios.post(`${BASE_URL}/pest-alerts`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert("Success", "Pest alert reported successfully!");
      }

      setFormData({ field_id: "", pest_type: "", severity: "low", description: "" });
      setEditingPest(null);
      setShowForm(false);
      loadData();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.detail || "Failed to save pest alert");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePestId) return;

    try {
      const token = await AsyncStorage.getItem("token") || await AsyncStorage.getItem("user_token");
      
      await axios.delete(`${BASE_URL}/pest-alerts/${deletePestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPests(pests.filter(p => p.id !== deletePestId));
      setDeletePestId(null);
      Alert.alert("Success", "Pest alert deleted successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.detail || "Failed to delete pest alert");
    }
  };

  const handleDownload = (pest: Pest) => {
    Alert.alert("Download", "CSV download feature coming soon!");
  };

  const handleEdit = (pest: Pest) => {
    setFormData({
      field_id: pest.field_id.toString(),
      pest_type: pest.pest_type,
      severity: pest.severity || "low",
      description: pest.description || "",
    });
    setEditingPest(pest);
    setShowForm(true);
    setMenuOpen(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pest Alerts</Text>
        <TouchableOpacity onPress={() => {
          setEditingPest(null);
          setFormData({ field_id: "", pest_type: "", severity: "low", description: "" });
          setShowForm(true);
        }} style={styles.addButton}>
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
          <View style={styles.formModalContent}>
            <View style={styles.formModalHeader}>
              <Text style={styles.formModalTitle}>
                {editingPest ? "Edit Pest Alert" : "Report Pest Alert"}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#8B5A2B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formModalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Select Field</Text>
                <View style={styles.pickerContainer}>
                  {fields.map((field) => (
                    <TouchableOpacity
                      key={field.id}
                      style={[
                        styles.pickerOption,
                        formData.field_id === field.id.toString() && styles.pickerOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, field_id: field.id.toString() })}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.field_id === field.id.toString() && styles.pickerOptionTextSelected
                      ]}>
                        {field.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Pest Type</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.pest_type}
                  onChangeText={(text) => setFormData({ ...formData, pest_type: text })}
                  placeholder="e.g., Aphids, Armyworms"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Severity</Text>
                <View style={styles.pickerContainer}>
                  {["low", "medium", "high"].map((severity) => (
                    <TouchableOpacity
                      key={severity}
                      style={[
                        styles.pickerOption,
                        formData.severity === severity && styles.pickerOptionSelected
                      ]}
                      onPress={() => setFormData({ ...formData, severity })}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.severity === severity && styles.pickerOptionTextSelected
                      ]}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Describe the pest issue in detail..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
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
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.formSubmitButtonText}>
                      {editingPest ? "Update" : "Report"}
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
        visible={!!viewPest}
        title="Pest Alert Details"
        onClose={() => setViewPest(null)}
      >
        {viewPest && (
          <View>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Field ID:</Text> {viewPest.field_id}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Pest Type:</Text> {viewPest.pest_type}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Severity:</Text> {viewPest.severity}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>Detected:</Text> {new Date(viewPest.created_at).toLocaleDateString()}</Text>
            {viewPest.description ? (
              <Text style={styles.detailText}><Text style={styles.detailLabel}>Description:</Text> {viewPest.description}</Text>
            ) : null}
          </View>
        )}
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        visible={!!deletePestId}
        title="Confirm Delete"
        onClose={() => setDeletePestId(null)}
        onConfirm={handleDelete}
      >
        <Text style={styles.confirmText}>Are you sure you want to delete this pest alert?</Text>
      </CustomModal>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading pest alerts...</Text>
        </View>
      ) : pests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="bug" size={60} color="#CCC" />
          <Text style={styles.emptyText}>No pest alerts reported yet</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => {
              setEditingPest(null);
              setFormData({ field_id: "", pest_type: "", severity: "low", description: "" });
              setShowForm(true);
            }}
          >
            <Text style={styles.emptyButtonText}>Report Your First Pest Alert</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} />
          }
        >
          {pests.map((pest) => (
            <PestCard
              key={pest.id}
              pest={pest}
              onView={() => setViewPest(pest)}
              onEdit={() => handleEdit(pest)}
              onDelete={() => setDeletePestId(pest.id)}
              onDownload={() => handleDownload(pest)}
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
    fontSize: 16,
    fontWeight: "500",
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
    flexWrap: "wrap",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  descriptionContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B5A2B",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#E8E0D5",
    paddingTop: 12,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
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
});
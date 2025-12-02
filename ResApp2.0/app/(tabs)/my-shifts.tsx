"use client";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/firebase";
import { requestCover } from "@/helpers/shiftCoverHelper";
import {
  Shift,
  formatShiftDate,
  getCurrentMonth,
  getMonthOptions
} from "@/types/shift";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MyShiftsScreen() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [monthSelectorVisible, setMonthSelectorVisible] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [shiftDetailsVisible, setShiftDetailsVisible] = useState(false);
  const [requestCoverVisible, setRequestCoverVisible] = useState(false);
  const [coverReason, setCoverReason] = useState("");

  useEffect(() => {
    initializeData();
  }, [selectedMonth]);

  const initializeData = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem("userEmail");
      const currentUserEmail = storedEmail || auth.currentUser?.email;

      if (!currentUserEmail) {
        Alert.alert("Error", "No user session found. Please login again.");
        return;
      }

      setUserEmail(currentUserEmail);
      setupShiftsListener(currentUserEmail, selectedMonth);
    } catch (error) {
      console.error("Error initializing:", error);
      Alert.alert("Error", "Failed to load shifts data.");
    } finally {
      setLoading(false);
    }
  };

  const setupShiftsListener = (email: string, month: string) => {
    const shiftsQuery = query(
      collection(db, "Shifts"),
      where("userEmail", "==", email),
      where("month", "==", month),
      orderBy("date", "asc"),
      orderBy("startTime", "asc")
    );

    const unsubscribe = onSnapshot(
      shiftsQuery,
      (snapshot) => {
        const shiftsList: Shift[] = [];
        snapshot.forEach((doc) => {
          shiftsList.push({ id: doc.id, ...doc.data() } as Shift);
        });
        setShifts(shiftsList);
        console.log(`Loaded ${shiftsList.length} shifts for ${month}`);
      },
      (error) => {
        console.error("Error listening to shifts:", error);
        if (error.code !== "permission-denied") {
          Alert.alert("Error", "Failed to sync shifts.");
        }
      }
    );

    return unsubscribe;
  };

  const handleRequestCover = async () => {
    if (!selectedShift || !coverReason.trim()) {
      Alert.alert("Error", "Please provide a reason for requesting cover.");
      return;
    }

    const result = await requestCover(selectedShift.id, coverReason.trim(), userEmail);

    if (result.success) {
      Alert.alert("Success", "Cover request submitted successfully!");
      setRequestCoverVisible(false);
      setCoverReason("");
      setSelectedShift(null);
    } else {
      Alert.alert("Error", result.error || "Failed to request cover.");
    }
  };

  const getShiftStatusColor = (status: Shift["status"]) => {
    switch (status) {
      case "scheduled":
        return "#10b981";
      case "cover_requested":
        return "#f59e0b";
      case "cover_pending_approval":
        return "#3b82f6";
      case "completed":
        return "#6b7280";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getShiftStatusLabel = (status: Shift["status"]) => {
    switch (status) {
      case "scheduled":
        return "Scheduled";
      case "cover_requested":
        return "Cover Requested";
      case "cover_pending_approval":
        return "Pending Approval";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const monthOptions = getMonthOptions(6);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading shifts...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconContainer}>
              <IconSymbol size={32} name="calendar" color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>My Shifts</Text>
              <Text style={styles.headerSubtitle}>View and manage your shifts</Text>
            </View>
          </View>

          {/* Month Selector */}
          <TouchableOpacity
            style={styles.monthSelector}
            onPress={() => setMonthSelectorVisible(true)}
          >
            <Text style={styles.monthSelectorText}>
              {monthOptions.find((m) => m.value === selectedMonth)?.label || selectedMonth}
            </Text>
            <IconSymbol name="chevron.down" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Shifts List */}
        <View style={styles.section}>
          {shifts.length > 0 ? (
            <View style={styles.shiftsContainer}>
              {shifts.map((shift) => (
                <TouchableOpacity
                  key={shift.id}
                  style={styles.shiftCard}
                  onPress={() => {
                    setSelectedShift(shift);
                    setShiftDetailsVisible(true);
                  }}
                >
                  <View
                    style={[
                      styles.shiftColorBar,
                      { backgroundColor: getShiftStatusColor(shift.status) },
                    ]}
                  />
                  <View style={styles.shiftContent}>
                    <View style={styles.shiftHeader}>
                      <Text style={styles.shiftDate}>{formatShiftDate(shift.date)}</Text>
                      <View
                        style={[
                          styles.shiftStatusBadge,
                          { backgroundColor: `${getShiftStatusColor(shift.status)}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.shiftStatusText,
                            { color: getShiftStatusColor(shift.status) },
                          ]}
                        >
                          {getShiftStatusLabel(shift.status)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.shiftTime}>
                      {shift.startTime} - {shift.endTime}
                    </Text>
                    <Text style={styles.shiftLocation}>📍 {shift.location}</Text>
                    {shift.description && (
                      <Text style={styles.shiftDescription}>{shift.description}</Text>
                    )}
                  </View>
                  {shift.status === "scheduled" && (
                    <TouchableOpacity
                      style={styles.requestButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedShift(shift);
                        setRequestCoverVisible(true);
                      }}
                    >
                      <IconSymbol size={16} name="person.2.fill" color="#3b82f6" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol size={64} name="calendar" color="#e5e7eb" />
              <Text style={styles.emptyStateText}>No shifts for this month</Text>
              <Text style={styles.emptyStateSubtext}>
                Shifts assigned to you will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Month Selector Modal */}
      <Modal
        visible={monthSelectorVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMonthSelectorVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMonthSelectorVisible(false)}
        >
          <Pressable style={styles.monthModalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <View style={styles.monthOptions}>
              {monthOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.monthOption,
                    selectedMonth === option.value && styles.monthOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedMonth(option.value);
                    setMonthSelectorVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.monthOptionText,
                      selectedMonth === option.value && styles.monthOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedMonth === option.value && (
                    <IconSymbol name="checkmark" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Shift Details Modal */}
      <Modal
        visible={shiftDetailsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShiftDetailsVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShiftDetailsVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedShift && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Shift Details</Text>
                  <TouchableOpacity
                    onPress={() => setShiftDetailsVisible(false)}
                    style={styles.closeButton}
                  >
                    <IconSymbol size={24} name="xmark" color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="calendar" color="#666" />
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{formatShiftDate(selectedShift.date)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="clock" color="#666" />
                    <Text style={styles.detailLabel}>Time:</Text>
                    <Text style={styles.detailValue}>
                      {selectedShift.startTime} - {selectedShift.endTime}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="location" color="#666" />
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>{selectedShift.location}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="tag" color="#666" />
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: getShiftStatusColor(selectedShift.status) },
                      ]}
                    >
                      {getShiftStatusLabel(selectedShift.status)}
                    </Text>
                  </View>

                  {selectedShift.description && (
                    <View style={styles.detailRow}>
                      <IconSymbol size={20} name="note.text" color="#666" />
                      <Text style={styles.detailLabel}>Notes:</Text>
                      <Text style={styles.detailValue}>{selectedShift.description}</Text>
                    </View>
                  )}
                </View>

                {selectedShift.status === "scheduled" && (
                  <TouchableOpacity
                    style={styles.requestCoverButton}
                    onPress={() => {
                      setShiftDetailsVisible(false);
                      setRequestCoverVisible(true);
                    }}
                  >
                    <IconSymbol size={20} name="person.2.fill" color="#fff" />
                    <Text style={styles.requestCoverButtonText}>Request Cover</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Request Cover Modal */}
      <Modal
        visible={requestCoverVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRequestCoverVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRequestCoverVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Cover</Text>
              <TouchableOpacity
                onPress={() => setRequestCoverVisible(false)}
                style={styles.closeButton}
              >
                <IconSymbol size={24} name="xmark" color="#666" />
              </TouchableOpacity>
            </View>

            {selectedShift && (
              <>
                <View style={styles.requestCoverInfo}>
                  <Text style={styles.requestCoverLabel}>Shift</Text>
                  <Text style={styles.requestCoverValue}>
                    {formatShiftDate(selectedShift.date)}
                  </Text>
                  <Text style={styles.requestCoverValue}>
                    {selectedShift.startTime} - {selectedShift.endTime}
                  </Text>
                  <Text style={styles.requestCoverValue}>📍 {selectedShift.location}</Text>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Reason for Cover Request *</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Please provide a reason for this cover request..."
                    placeholderTextColor="#94a3b8"
                    value={coverReason}
                    onChangeText={setCoverReason}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setRequestCoverVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton]}
                    onPress={handleRequestCover}
                  >
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", paddingBottom: 100 },
  content: { flex: 1 },
  headerSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  headerTitleContainer: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#1e293b", marginBottom: 0 },
  headerSubtitle: { fontSize: 14, color: "#666" },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthSelectorText: { fontSize: 16, fontWeight: "600", color: "#000" },
  section: { marginBottom: 32 },
  shiftsContainer: { paddingHorizontal: 20, gap: 12 },
  shiftCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shiftColorBar: { width: 4 },
  shiftContent: { flex: 1, padding: 16 },
  shiftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  shiftDate: { fontSize: 16, fontWeight: "600", color: "#000" },
  shiftStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  shiftStatusText: { fontSize: 12, fontWeight: "600" },
  shiftTime: { fontSize: 14, color: "#666", marginBottom: 4 },
  shiftLocation: { fontSize: 14, color: "#999", marginBottom: 4 },
  shiftDescription: { fontSize: 13, color: "#666", fontStyle: "italic", marginTop: 4 },
  requestButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    margin: 8,
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyStateText: { fontSize: 18, fontWeight: "600", color: "#999", textAlign: "center" },
  emptyStateSubtext: { fontSize: 14, color: "#ccc", textAlign: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { fontSize: 16, color: "#6b7280", fontWeight: "500" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  monthModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "80%",
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: { fontSize: 24, fontWeight: "700", color: "#000" },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsContainer: { marginBottom: 24 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
  detailLabel: { fontSize: 14, color: "#666", fontWeight: "500", minWidth: 70 },
  detailValue: { fontSize: 14, color: "#000", fontWeight: "600", flex: 1 },
  monthOptions: { gap: 8 },
  monthOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  monthOptionSelected: {
    backgroundColor: "#f0f9ff",
    borderColor: "#3b82f6",
  },
  monthOptionText: { fontSize: 16, fontWeight: "500", color: "#000" },
  monthOptionTextSelected: { color: "#3b82f6", fontWeight: "600" },
  requestCoverButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  requestCoverButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  requestCoverInfo: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  requestCoverLabel: { fontSize: 14, fontWeight: "600", color: "#666", marginBottom: 8 },
  requestCoverValue: { fontSize: 14, color: "#000", marginBottom: 4 },
  inputSection: { marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 8 },
  textArea: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#000",
    backgroundColor: "#f8fafc",
    minHeight: 100,
  },
  modalActions: { flexDirection: "row", gap: 12 },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  submitButton: {
    backgroundColor: "#3b82f6",
  },
  cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#666" },
  submitButtonText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});


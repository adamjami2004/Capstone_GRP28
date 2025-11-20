"use client";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/firebase";
import { approveCover, rejectCover } from "@/helpers/shiftCoverHelper";
import { canApproveCover, CoverRequest, formatShiftDate } from "@/types/shift";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    collection,
    getDocs,
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

export default function ApprovalsScreen() {
  const [pendingApprovals, setPendingApprovals] = useState<CoverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CoverRequest | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [reviewNotesModalVisible, setReviewNotesModalVisible] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem("userEmail");
      const currentUserEmail = storedEmail || auth.currentUser?.email;

      if (!currentUserEmail) {
        Alert.alert("Error", "No user session found. Please login again.");
        return;
      }

      setUserEmail(currentUserEmail);

      // Check if user is TL or Admin
      const role = await checkUserRole(currentUserEmail);
      setUserRole(role);

      const authorized = canApproveCover(role as any);
      setIsAuthorized(authorized);

      if (authorized) {
        setupApprovalsListener();
      }
    } catch (error) {
      console.error("Error initializing:", error);
      Alert.alert("Error", "Failed to load approval requests.");
    } finally {
      setLoading(false);
    }
  };

  const checkUserRole = async (email: string): Promise<string> => {
    try {
      const usersRef = collection(db, "Users");
      const userQuery = query(usersRef, where("Email", "==", email));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        return userData.role || "Staff";
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
    return "Staff";
  };

  const setupApprovalsListener = () => {
    const approvalsQuery = query(
      collection(db, "CoverRequests"),
      where("status", "==", "pending_approval"),
      orderBy("takenAt", "desc")
    );

    const unsubscribe = onSnapshot(
      approvalsQuery,
      (snapshot) => {
        const requests: CoverRequest[] = [];
        snapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() } as CoverRequest);
        });
        setPendingApprovals(requests);
        console.log(`Loaded ${requests.length} pending approvals`);
      },
      (error) => {
        console.error("Error listening to approvals:", error);
        if (error.code !== "permission-denied") {
          Alert.alert("Error", "Failed to sync approval requests.");
        }
      }
    );

    return unsubscribe;
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    const result = await approveCover(selectedRequest.id, userEmail, reviewNotes);

    if (result.success) {
      Alert.alert(
        "Success",
        "Cover request approved! The shift has been reassigned."
      );
      setReviewNotesModalVisible(false);
      setDetailsModalVisible(false);
      setReviewNotes("");
    } else {
      Alert.alert("Error", result.error || "Failed to approve cover request.");
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    const result = await rejectCover(selectedRequest.id, userEmail, reviewNotes);

    if (result.success) {
      Alert.alert(
        "Success",
        "Cover request rejected. The shift remains with the original user."
      );
      setReviewNotesModalVisible(false);
      setDetailsModalVisible(false);
      setReviewNotes("");
    } else {
      Alert.alert("Error", result.error || "Failed to reject cover request.");
    }
  };

  const openReviewModal = (action: "approve" | "reject", request: CoverRequest) => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes("");
    setDetailsModalVisible(false);
    setReviewNotesModalVisible(true);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ThemedView>
    );
  }

  if (!isAuthorized) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.unauthorizedContainer}>
          <IconSymbol size={80} name="lock.fill" color="#e5e7eb" />
          <Text style={styles.unauthorizedTitle}>Access Restricted</Text>
          <Text style={styles.unauthorizedText}>
            This section is only available to Team Leaders and Administrators.
          </Text>
          <Text style={styles.unauthorizedRole}>Your role: {userRole}</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerIconContainer}>
            <IconSymbol size={32} name="checkmark.seal.fill" color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Approvals</Text>
            <Text style={styles.headerSubtitle}>Review and approve cover requests</Text>
          </View>
        </View>

        {pendingApprovals.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{pendingApprovals.length} pending</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {pendingApprovals.length > 0 ? (
            <View style={styles.requestsContainer}>
              {pendingApprovals.map((request) => (
                <TouchableOpacity
                  key={request.id}
                  style={styles.requestCard}
                  onPress={() => {
                    setSelectedRequest(request);
                    setDetailsModalVisible(true);
                  }}
                >
                  <View style={styles.requestHeader}>
                    <View>
                      <Text style={styles.requestDate}>
                        {formatShiftDate(request.shiftDate)}
                      </Text>
                      <Text style={styles.requestTime}>{request.shiftTime}</Text>
                    </View>
                    <View style={styles.pendingBadge}>
                      <IconSymbol size={16} name="clock" color="#f59e0b" />
                      <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                  </View>

                  <Text style={styles.requestLocation}>📍 {request.shiftLocation}</Text>

                  <View style={styles.requestUsers}>
                    <View style={styles.userRow}>
                      <IconSymbol size={16} name="person.fill" color="#666" />
                      <Text style={styles.userLabel}>Original:</Text>
                      <Text style={styles.userName}>{request.requestedBy}</Text>
                    </View>
                    <IconSymbol size={16} name="arrow.right" color="#3b82f6" />
                    <View style={styles.userRow}>
                      <IconSymbol size={16} name="person.fill" color="#10b981" />
                      <Text style={styles.userLabel}>New:</Text>
                      <Text style={[styles.userName, styles.newUser]}>
                        {request.takenBy}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.requestReason} numberOfLines={2}>
                    "{request.reason}"
                  </Text>

                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        openReviewModal("reject", request);
                      }}
                    >
                      <IconSymbol size={18} name="xmark" color="#fff" />
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        openReviewModal("approve", request);
                      }}
                    >
                      <IconSymbol size={18} name="checkmark" color="#fff" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol size={64} name="checkmark.circle" color="#e5e7eb" />
              <Text style={styles.emptyStateText}>No pending approvals</Text>
              <Text style={styles.emptyStateSubtext}>
                Cover requests awaiting approval will appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDetailsModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedRequest && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Approval Details</Text>
                  <TouchableOpacity
                    onPress={() => setDetailsModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <IconSymbol size={24} name="xmark" color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Shift Information</Text>
                    <View style={styles.detailRow}>
                      <IconSymbol size={20} name="calendar" color="#666" />
                      <Text style={styles.detailLabel}>Date:</Text>
                      <Text style={styles.detailValue}>
                        {formatShiftDate(selectedRequest.shiftDate)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol size={20} name="clock" color="#666" />
                      <Text style={styles.detailLabel}>Time:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.shiftTime}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol size={20} name="location" color="#666" />
                      <Text style={styles.detailLabel}>Location:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.shiftLocation}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Cover Request</Text>
                    <View style={styles.detailRow}>
                      <IconSymbol size={20} name="person" color="#666" />
                      <Text style={styles.detailLabel}>Requested by:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.requestedBy}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol size={20} name="person.fill" color="#10b981" />
                      <Text style={styles.detailLabel}>Taken by:</Text>
                      <Text style={[styles.detailValue, { color: "#10b981" }]}>
                        {selectedRequest.takenBy}
                      </Text>
                    </View>
                    <View style={[styles.detailRow, styles.reasonRow]}>
                      <IconSymbol size={20} name="note.text" color="#666" />
                      <View style={styles.reasonContent}>
                        <Text style={styles.detailLabel}>Reason:</Text>
                        <Text style={styles.reasonText}>{selectedRequest.reason}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.rejectButtonLarge]}
                    onPress={() => openReviewModal("reject", selectedRequest)}
                  >
                    <IconSymbol size={20} name="xmark.circle" color="#fff" />
                    <Text style={styles.modalButtonText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.approveButtonLarge]}
                    onPress={() => openReviewModal("approve", selectedRequest)}
                  >
                    <IconSymbol size={20} name="checkmark.circle.fill" color="#fff" />
                    <Text style={styles.modalButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Review Notes Modal */}
      <Modal
        visible={reviewNotesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReviewNotesModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setReviewNotesModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {reviewAction === "approve" ? "Approve Cover" : "Reject Cover"}
              </Text>
              <TouchableOpacity
                onPress={() => setReviewNotesModalVisible(false)}
                style={styles.closeButton}
              >
                <IconSymbol size={24} name="xmark" color="#666" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <>
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewInfoLabel}>
                    {reviewAction === "approve"
                      ? "Approving cover request"
                      : "Rejecting cover request"}
                  </Text>
                  <View style={styles.reviewShiftInfo}>
                    <Text style={styles.reviewShiftText}>
                      {formatShiftDate(selectedRequest.shiftDate)}
                    </Text>
                    <Text style={styles.reviewShiftText}>{selectedRequest.shiftTime}</Text>
                    <Text style={styles.reviewShiftText}>
                      {selectedRequest.requestedBy} → {selectedRequest.takenBy}
                    </Text>
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>
                    Notes (Optional)
                  </Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Add any notes about this decision..."
                    placeholderTextColor="#94a3b8"
                    value={reviewNotes}
                    onChangeText={setReviewNotes}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setReviewNotesModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      reviewAction === "approve"
                        ? styles.approveButtonLarge
                        : styles.rejectButtonLarge,
                    ]}
                    onPress={
                      reviewAction === "approve"
                        ? handleApproveRequest
                        : handleRejectRequest
                    }
                  >
                    <Text style={styles.modalButtonText}>
                      {reviewAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                    </Text>
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
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#000", marginBottom: 2 },
  headerSubtitle: { fontSize: 14, color: "#666" },
  countBadge: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  countBadgeText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  section: { flex: 1 },
  requestsContainer: { paddingHorizontal: 20, gap: 12, paddingBottom: 20 },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  requestDate: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 4 },
  requestTime: { fontSize: 14, color: "#3b82f6", fontWeight: "500" },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeText: { fontSize: 12, fontWeight: "600", color: "#f59e0b" },
  requestLocation: { fontSize: 14, color: "#666", marginBottom: 12 },
  requestUsers: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  userLabel: { fontSize: 12, color: "#666", fontWeight: "500" },
  userName: { fontSize: 14, color: "#000", fontWeight: "600", flex: 1 },
  newUser: { color: "#10b981" },
  requestReason: { fontSize: 14, color: "#666", fontStyle: "italic", marginBottom: 12 },
  requestActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: { backgroundColor: "#10b981" },
  rejectButton: { backgroundColor: "#ef4444" },
  actionButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    textAlign: "center",
  },
  emptyStateSubtext: { fontSize: 14, color: "#ccc", textAlign: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { fontSize: 16, color: "#6b7280", fontWeight: "500" },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 16,
  },
  unauthorizedTitle: { fontSize: 24, fontWeight: "700", color: "#000" },
  unauthorizedText: { fontSize: 16, color: "#666", textAlign: "center", lineHeight: 24 },
  unauthorizedRole: { fontSize: 14, color: "#999", marginTop: 8 },
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
  detailSection: { marginBottom: 20 },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
  reasonRow: { alignItems: "flex-start" },
  detailLabel: { fontSize: 14, color: "#666", fontWeight: "500", minWidth: 90 },
  detailValue: { fontSize: 14, color: "#000", fontWeight: "600", flex: 1 },
  reasonContent: { flex: 1 },
  reasonText: { fontSize: 14, color: "#000", marginTop: 4, lineHeight: 20 },
  reviewInfo: { marginBottom: 20 },
  reviewInfoLabel: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 8 },
  reviewShiftInfo: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  reviewShiftText: { fontSize: 14, color: "#000" },
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
    minHeight: 80,
  },
  modalActions: { flexDirection: "row", gap: 12 },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  approveButtonLarge: { backgroundColor: "#10b981" },
  rejectButtonLarge: { backgroundColor: "#ef4444" },
  cancelButton: { backgroundColor: "#f3f4f6" },
  modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelButtonText: { color: "#666", fontSize: 16, fontWeight: "600" },
});


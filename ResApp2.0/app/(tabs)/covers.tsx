"use client";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/firebase";
import { takeCover, cancelCover } from "@/helpers/shiftCoverHelper";
import { CoverRequest, formatShiftDate } from "@/types/shift";
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
  TouchableOpacity,
  View,
} from "react-native";

export default function CoversScreen() {
  const [availableCovers, setAvailableCovers] = useState<CoverRequest[]>([]);
  const [myRequests, setMyRequests] = useState<CoverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [selectedCover, setSelectedCover] = useState<CoverRequest | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"available" | "myRequests">("available");

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
      setupCoversListeners(currentUserEmail);
    } catch (error) {
      console.error("Error initializing:", error);
      Alert.alert("Error", "Failed to load cover requests.");
    } finally {
      setLoading(false);
    }
  };

  const setupCoversListeners = (email: string) => {
    // Listen to all open cover requests (available to take)
    const availableQuery = query(
      collection(db, "CoverRequests"),
      where("status", "==", "open"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeAvailable = onSnapshot(
      availableQuery,
      (snapshot) => {
        const covers: CoverRequest[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as CoverRequest;
          // Don't show user's own requests in available covers
          if (data.requestedByEmail !== email) {
            covers.push({ id: doc.id, ...data });
          }
        });
        setAvailableCovers(covers);
        console.log(`Loaded ${covers.length} available covers`);
      },
      (error) => {
        console.error("Error listening to available covers:", error);
        if (error.code !== "permission-denied") {
          Alert.alert("Error", "Failed to sync cover requests.");
        }
      }
    );

    // Listen to user's own cover requests
    const myRequestsQuery = query(
      collection(db, "CoverRequests"),
      where("requestedByEmail", "==", email),
      orderBy("createdAt", "desc")
    );

    const unsubscribeMyRequests = onSnapshot(
      myRequestsQuery,
      (snapshot) => {
        const requests: CoverRequest[] = [];
        snapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() } as CoverRequest);
        });
        setMyRequests(requests);
        console.log(`Loaded ${requests.length} my cover requests`);
      },
      (error) => {
        console.error("Error listening to my requests:", error);
        if (error.code !== "permission-denied") {
          Alert.alert("Error", "Failed to sync your cover requests.");
        }
      }
    );

    return () => {
      unsubscribeAvailable();
      unsubscribeMyRequests();
    };
  };

  const handleTakeCover = async (coverRequest: CoverRequest) => {
    Alert.alert(
      "Take Cover",
      `Are you sure you want to take this shift cover?\n\n${formatShiftDate(coverRequest.shiftDate)}\n${coverRequest.shiftTime}\n${coverRequest.shiftLocation}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Take Cover",
          onPress: async () => {
            const result = await takeCover(coverRequest.id, userEmail);
            if (result.success) {
              Alert.alert(
                "Success",
                "Cover request accepted! It's now pending approval from a Team Leader."
              );
              setDetailsModalVisible(false);
            } else {
              Alert.alert("Error", result.error || "Failed to take cover.");
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = async (coverRequest: CoverRequest) => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this cover request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            const result = await cancelCover(coverRequest.id, userEmail);
            if (result.success) {
              Alert.alert("Success", "Cover request cancelled.");
              setDetailsModalVisible(false);
            } else {
              Alert.alert("Error", result.error || "Failed to cancel request.");
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: CoverRequest["status"]) => {
    switch (status) {
      case "open":
        return "#10b981";
      case "pending_approval":
        return "#3b82f6";
      case "approved":
        return "#6b7280";
      case "rejected":
        return "#ef4444";
      case "cancelled":
        return "#94a3b8";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status: CoverRequest["status"]) => {
    switch (status) {
      case "open":
        return "Open";
      case "pending_approval":
        return "Pending Approval";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const renderCoverCard = (cover: CoverRequest, showTakeButton: boolean) => (
    <TouchableOpacity
      key={cover.id}
      style={styles.coverCard}
      onPress={() => {
        setSelectedCover(cover);
        setDetailsModalVisible(true);
      }}
    >
      <View style={styles.coverHeader}>
        <View style={styles.coverHeaderLeft}>
          <Text style={styles.coverDate}>{formatShiftDate(cover.shiftDate)}</Text>
          <Text style={styles.coverTime}>{cover.shiftTime}</Text>
        </View>
        <View
          style={[
            styles.coverStatusBadge,
            { backgroundColor: `${getStatusColor(cover.status)}20` },
          ]}
        >
          <Text style={[styles.coverStatusText, { color: getStatusColor(cover.status) }]}>
            {getStatusLabel(cover.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.coverLocation}>📍 {cover.shiftLocation}</Text>
      <Text style={styles.coverRequester}>
        Requested by: <Text style={styles.coverRequesterName}>{cover.requestedBy}</Text>
      </Text>
      <Text style={styles.coverReason} numberOfLines={2}>
        {cover.reason}
      </Text>

      {showTakeButton && cover.status === "open" && (
        <TouchableOpacity
          style={styles.takeCoverButton}
          onPress={(e) => {
            e.stopPropagation();
            handleTakeCover(cover);
          }}
        >
          <IconSymbol size={16} name="checkmark.circle.fill" color="#fff" />
          <Text style={styles.takeCoverButtonText}>Take Cover</Text>
        </TouchableOpacity>
      )}

      {!showTakeButton && cover.status === "open" && (
        <TouchableOpacity
          style={styles.cancelRequestButton}
          onPress={(e) => {
            e.stopPropagation();
            handleCancelRequest(cover);
          }}
        >
          <IconSymbol size={16} name="xmark.circle" color="#ef4444" />
          <Text style={styles.cancelRequestButtonText}>Cancel Request</Text>
        </TouchableOpacity>
      )}

      {!showTakeButton && cover.status === "pending_approval" && (
        <View style={styles.pendingInfo}>
          <IconSymbol size={16} name="clock" color="#3b82f6" />
          <Text style={styles.pendingInfoText}>
            Taken by {cover.takenBy}, awaiting approval
          </Text>
        </View>
      )}

      {!showTakeButton && cover.status === "approved" && cover.takenBy && (
        <View style={styles.approvedInfo}>
          <IconSymbol size={16} name="checkmark.circle.fill" color="#10b981" />
          <Text style={styles.approvedInfoText}>Approved - Covered by {cover.takenBy}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading cover requests...</Text>
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
            <IconSymbol size={32} name="person.2.fill" color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Covers</Text>
            <Text style={styles.headerSubtitle}>Request and take shift covers</Text>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "available" && styles.tabActive]}
            onPress={() => setActiveTab("available")}
          >
            <Text
              style={[styles.tabText, activeTab === "available" && styles.tabTextActive]}
            >
              Available ({availableCovers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "myRequests" && styles.tabActive]}
            onPress={() => setActiveTab("myRequests")}
          >
            <Text
              style={[styles.tabText, activeTab === "myRequests" && styles.tabTextActive]}
            >
              My Requests ({myRequests.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Available Covers Tab */}
        {activeTab === "available" && (
          <View style={styles.section}>
            {availableCovers.length > 0 ? (
              <View style={styles.coversContainer}>
                {availableCovers.map((cover) => renderCoverCard(cover, true))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol size={64} name="person.2" color="#e5e7eb" />
                <Text style={styles.emptyStateText}>No available covers</Text>
                <Text style={styles.emptyStateSubtext}>
                  Cover requests from other users will appear here
                </Text>
              </View>
            )}
          </View>
        )}

        {/* My Requests Tab */}
        {activeTab === "myRequests" && (
          <View style={styles.section}>
            {myRequests.length > 0 ? (
              <View style={styles.coversContainer}>
                {myRequests.map((cover) => renderCoverCard(cover, false))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol size={64} name="tray" color="#e5e7eb" />
                <Text style={styles.emptyStateText}>No cover requests</Text>
                <Text style={styles.emptyStateSubtext}>
                  Your cover requests will appear here
                </Text>
              </View>
            )}
          </View>
        )}
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
            {selectedCover && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Cover Request Details</Text>
                  <TouchableOpacity
                    onPress={() => setDetailsModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <IconSymbol size={24} name="xmark" color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="calendar" color="#666" />
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>
                      {formatShiftDate(selectedCover.shiftDate)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="clock" color="#666" />
                    <Text style={styles.detailLabel}>Time:</Text>
                    <Text style={styles.detailValue}>{selectedCover.shiftTime}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="location" color="#666" />
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>{selectedCover.shiftLocation}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="person" color="#666" />
                    <Text style={styles.detailLabel}>Requested by:</Text>
                    <Text style={styles.detailValue}>{selectedCover.requestedBy}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="tag" color="#666" />
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: getStatusColor(selectedCover.status) },
                      ]}
                    >
                      {getStatusLabel(selectedCover.status)}
                    </Text>
                  </View>

                  <View style={[styles.detailRow, styles.reasonRow]}>
                    <IconSymbol size={20} name="note.text" color="#666" />
                    <View style={styles.reasonContent}>
                      <Text style={styles.detailLabel}>Reason:</Text>
                      <Text style={styles.reasonText}>{selectedCover.reason}</Text>
                    </View>
                  </View>

                  {selectedCover.takenBy && (
                    <View style={styles.detailRow}>
                      <IconSymbol size={20} name="person.fill" color="#666" />
                      <Text style={styles.detailLabel}>Taken by:</Text>
                      <Text style={styles.detailValue}>{selectedCover.takenBy}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalActions}>
                  {selectedCover.status === "open" &&
                    selectedCover.requestedByEmail !== userEmail && (
                      <TouchableOpacity
                        style={styles.takeCoverButtonLarge}
                        onPress={() => handleTakeCover(selectedCover)}
                      >
                        <IconSymbol size={20} name="checkmark.circle.fill" color="#fff" />
                        <Text style={styles.takeCoverButtonLargeText}>Take Cover</Text>
                      </TouchableOpacity>
                    )}

                  {selectedCover.status === "open" &&
                    selectedCover.requestedByEmail === userEmail && (
                      <TouchableOpacity
                        style={styles.cancelRequestButtonLarge}
                        onPress={() => handleCancelRequest(selectedCover)}
                      >
                        <IconSymbol size={20} name="xmark.circle" color="#fff" />
                        <Text style={styles.cancelRequestButtonLargeText}>
                          Cancel Request
                        </Text>
                      </TouchableOpacity>
                    )}
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
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#000", marginBottom: 2 },
  headerSubtitle: { fontSize: 14, color: "#666" },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#3b82f6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#fff",
  },
  section: { flex: 1 },
  coversContainer: { paddingHorizontal: 20, gap: 12, paddingBottom: 20 },
  coverCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  coverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  coverHeaderLeft: { flex: 1 },
  coverDate: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 4 },
  coverTime: { fontSize: 14, color: "#3b82f6", fontWeight: "500" },
  coverStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  coverStatusText: { fontSize: 12, fontWeight: "600" },
  coverLocation: { fontSize: 14, color: "#666", marginBottom: 8 },
  coverRequester: { fontSize: 14, color: "#666", marginBottom: 8 },
  coverRequesterName: { fontWeight: "600", color: "#000" },
  coverReason: { fontSize: 14, color: "#666", fontStyle: "italic", marginBottom: 12 },
  takeCoverButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    padding: 12,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  takeCoverButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  cancelRequestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ef4444",
    padding: 12,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  cancelRequestButtonText: { color: "#ef4444", fontSize: 14, fontWeight: "600" },
  pendingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  pendingInfoText: { fontSize: 13, color: "#3b82f6", fontWeight: "500" },
  approvedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  approvedInfoText: { fontSize: 13, color: "#10b981", fontWeight: "500" },
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
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
  reasonRow: { alignItems: "flex-start" },
  detailLabel: { fontSize: 14, color: "#666", fontWeight: "500", minWidth: 90 },
  detailValue: { fontSize: 14, color: "#000", fontWeight: "600", flex: 1 },
  reasonContent: { flex: 1 },
  reasonText: { fontSize: 14, color: "#000", marginTop: 4, lineHeight: 20 },
  modalActions: { gap: 12 },
  takeCoverButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  takeCoverButtonLargeText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelRequestButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelRequestButtonLargeText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});


"use client"

import { ThemedView } from "@/components/themed-view"
import { IconSymbol } from "@/components/ui/icon-symbol"
import { useEffect, useState } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"

type DutyShift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: "regular" | "overtime" | "emergency";
  status: "scheduled" | "completed" | "cancelled";
  location: string;
  notes?: string;
}

type DutySwap = {
  id: string;
  originalShift: DutyShift;
  requestedBy: string;
  reason: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export default function DutyScreen() {
  const [upcomingShifts, setUpcomingShifts] = useState<DutyShift[]>([]);
  const [swapRequests, setSwapRequests] = useState<DutySwap[]>([]);
  const [nextDuty, setNextDuty] = useState<DutyShift | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedShift, setSelectedShift] = useState<DutyShift | null>(null);

  useEffect(() => {
    fetchDutyData();
  }, []);

  const fetchDutyData = async () => {
    try {
      // Mock data for now - replace with actual Firestore queries
      const mockShifts: DutyShift[] = [
        {
          id: "1",
          date: "2025-01-15",
          startTime: "08:00",
          endTime: "16:00",
          type: "regular",
          status: "scheduled",
          location: "Main Building",
          notes: "Regular duty shift"
        },
        {
          id: "2", 
          date: "2025-01-18",
          startTime: "16:00",
          endTime: "00:00",
          type: "overtime",
          status: "scheduled",
          location: "Main Building",
          notes: "Overtime coverage"
        },
        {
          id: "3",
          date: "2025-01-22",
          startTime: "08:00",
          endTime: "16:00",
          type: "regular",
          status: "scheduled",
          location: "Main Building"
        }
      ];

      const mockSwaps: DutySwap[] = [
        {
          id: "swap1",
          originalShift: mockShifts[0],
          requestedBy: "John Doe",
          reason: "Family emergency",
          status: "pending",
          createdAt: "2025-01-10"
        }
      ];

      setUpcomingShifts(mockShifts);
      setSwapRequests(mockSwaps);
      setNextDuty(mockShifts[0]);
    } catch (error) {
      console.error("Error fetching duty data:", error);
    }
  };

  const getShiftTypeColor = (type: DutyShift["type"]) => {
    switch (type) {
      case "regular": return "#3b82f6";
      case "overtime": return "#f59e0b";
      case "emergency": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getShiftTypeIcon = (type: DutyShift["type"]) => {
    switch (type) {
      case "regular": return "clock";
      case "overtime": return "clock.badge.exclamationmark";
      case "emergency": return "exclamationmark.triangle";
      default: return "clock";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  };

  const getTimeUntilNextDuty = () => {
    if (!nextDuty) return "No upcoming duty";
    
    const now = new Date();
    const dutyDate = new Date(nextDuty.date + " " + nextDuty.startTime);
    const diffMs = dutyDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days`;
  };

  const handleShiftPress = (shift: DutyShift) => {
    setSelectedShift(shift);
    setModalVisible(true);
  };

  const handleRequestSwap = (shift: DutyShift) => {
    // TODO: Implement swap request functionality
    console.log("Request swap for shift:", shift.id);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconContainer}>
              <IconSymbol size={32} name="building.2.fill" color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Duty Management</Text>
              <Text style={styles.headerSubtitle}>Manage your duty schedule</Text>
            </View>
          </View>
        </View>

        {/* Next Duty Card */}
        {nextDuty && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Next Duty</Text>
            <TouchableOpacity 
              style={styles.nextDutyCard}
              onPress={() => handleShiftPress(nextDuty)}
            >
              <View style={styles.nextDutyHeader}>
                <View style={[styles.nextDutyIcon, { backgroundColor: getShiftTypeColor(nextDuty.type) }]}>
                  <IconSymbol size={24} name={getShiftTypeIcon(nextDuty.type)} color="#fff" />
                </View>
                <View style={styles.nextDutyInfo}>
                  <Text style={styles.nextDutyDate}>{formatDate(nextDuty.date)}</Text>
                  <Text style={styles.nextDutyTime}>{nextDuty.startTime} - {nextDuty.endTime}</Text>
                  <Text style={styles.nextDutyLocation}>{nextDuty.location}</Text>
                </View>
                <View style={styles.nextDutyCountdown}>
                  <Text style={styles.countdownText}>{getTimeUntilNextDuty()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Upcoming Shifts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Shifts</Text>
          <View style={styles.shiftsContainer}>
            {upcomingShifts.map((shift) => (
              <TouchableOpacity 
                key={shift.id} 
                style={styles.shiftCard}
                onPress={() => handleShiftPress(shift)}
              >
                <View style={[styles.shiftColorBar, { backgroundColor: getShiftTypeColor(shift.type) }]} />
                <View style={styles.shiftContent}>
                  <View style={styles.shiftHeader}>
                    <Text style={styles.shiftDate}>{formatDate(shift.date)}</Text>
                    <View style={[styles.shiftTypeBadge, { backgroundColor: `${getShiftTypeColor(shift.type)}20` }]}>
                      <Text style={[styles.shiftTypeText, { color: getShiftTypeColor(shift.type) }]}>
                        {shift.type.charAt(0).toUpperCase() + shift.type.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.shiftTime}>{shift.startTime} - {shift.endTime}</Text>
                  <Text style={styles.shiftLocation}>{shift.location}</Text>
                  {shift.notes && <Text style={styles.shiftNotes}>{shift.notes}</Text>}
                </View>
                <TouchableOpacity 
                  style={styles.swapButton}
                  onPress={() => handleRequestSwap(shift)}
                >
                  <IconSymbol size={16} name="arrow.left.arrow.right" color="#3b82f6" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duty Swap Requests */}
        {swapRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Swap Requests</Text>
            <View style={styles.swapContainer}>
              {swapRequests.map((swap) => (
                <View key={swap.id} style={styles.swapCard}>
                  <View style={styles.swapHeader}>
                    <Text style={styles.swapRequester}>{swap.requestedBy}</Text>
                    <View style={[styles.swapStatusBadge, { backgroundColor: swap.status === "pending" ? "#f59e0b" : swap.status === "accepted" ? "#10b981" : "#ef4444" }]}>
                      <Text style={styles.swapStatusText}>{swap.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.swapReason}>{swap.reason}</Text>
                  <Text style={styles.swapShift}>Shift: {formatDate(swap.originalShift.date)} {swap.originalShift.startTime} - {swap.originalShift.endTime}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: "#10b981" }]}>
                <IconSymbol size={24} name="clock.badge.checkmark" color="#fff" />
              </View>
              <Text style={styles.actionTitle}>Clock In/Out</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: "#3b82f6" }]}>
                <IconSymbol size={24} name="arrow.left.arrow.right" color="#fff" />
              </View>
              <Text style={styles.actionTitle}>Request Swap</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: "#8b5cf6" }]}>
                <IconSymbol size={24} name="exclamationmark.triangle" color="#fff" />
              </View>
              <Text style={styles.actionTitle}>Report Incident</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: "#f59e0b" }]}>
                <IconSymbol size={24} name="person.2" color="#fff" />
              </View>
              <Text style={styles.actionTitle}>Coverage Status</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Shift Details Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedShift && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Shift Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                    <IconSymbol size={24} name="xmark" color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.shiftDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="calendar" color="#666" />
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedShift.date)}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="clock" color="#666" />
                    <Text style={styles.detailLabel}>Time:</Text>
                    <Text style={styles.detailValue}>{selectedShift.startTime} - {selectedShift.endTime}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="location" color="#666" />
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>{selectedShift.location}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="tag" color="#666" />
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>{selectedShift.type.charAt(0).toUpperCase() + selectedShift.type.slice(1)}</Text>
                  </View>
                  
                  {selectedShift.notes && (
                    <View style={styles.detailRow}>
                      <IconSymbol size={20} name="note.text" color="#666" />
                      <Text style={styles.detailLabel}>Notes:</Text>
                      <Text style={styles.detailValue}>{selectedShift.notes}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalButton}>
                    <IconSymbol size={20} name="arrow.left.arrow.right" color="#3b82f6" />
                    <Text style={styles.modalButtonText}>Request Swap</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#3b82f6" }]}>
                    <IconSymbol size={20} name="checkmark" color="#fff" />
                    <Text style={[styles.modalButtonText, { color: "#fff" }]}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  content: { flex: 1 },
  
  // Header
  headerSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  headerTitleContainer: { flexDirection: "row", alignItems: "center", gap: 16 },
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
  
  // Sections
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#000", marginBottom: 16, paddingHorizontal: 20 },
  
  // Next Duty Card
  nextDutyCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  nextDutyHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  nextDutyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  nextDutyInfo: { flex: 1 },
  nextDutyDate: { fontSize: 18, fontWeight: "700", color: "#000", marginBottom: 4 },
  nextDutyTime: { fontSize: 16, color: "#666", marginBottom: 2 },
  nextDutyLocation: { fontSize: 14, color: "#999" },
  nextDutyCountdown: { alignItems: "center" },
  countdownText: { fontSize: 16, fontWeight: "600", color: "#3b82f6" },
  
  // Shifts
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
  shiftHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  shiftDate: { fontSize: 16, fontWeight: "600", color: "#000" },
  shiftTypeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  shiftTypeText: { fontSize: 12, fontWeight: "600" },
  shiftTime: { fontSize: 14, color: "#666", marginBottom: 4 },
  shiftLocation: { fontSize: 14, color: "#999" },
  shiftNotes: { fontSize: 13, color: "#666", marginTop: 4, fontStyle: "italic" },
  swapButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    margin: 8,
  },
  
  // Swaps
  swapContainer: { paddingHorizontal: 20, gap: 12 },
  swapCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  swapHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  swapRequester: { fontSize: 16, fontWeight: "600", color: "#000" },
  swapStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  swapStatusText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  swapReason: { fontSize: 14, color: "#666", marginBottom: 4 },
  swapShift: { fontSize: 13, color: "#999" },
  
  // Quick Actions
  actionsContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    paddingHorizontal: 20, 
    gap: 12 
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionTitle: { fontSize: 14, fontWeight: "600", color: "#000", textAlign: "center" },
  
  // Modal
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
  shiftDetails: { marginBottom: 24 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  detailLabel: { fontSize: 14, color: "#666", fontWeight: "500", minWidth: 60 },
  detailValue: { fontSize: 14, color: "#000", fontWeight: "600", flex: 1 },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  modalButtonText: { fontSize: 16, fontWeight: "600", color: "#3b82f6" },
})
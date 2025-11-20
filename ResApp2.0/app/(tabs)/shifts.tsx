"use client";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/firebase";
import {
  approveCover,
  cancelCover,
  createShift,
  rejectCover,
  requestCover,
  takeCover,
} from "@/helpers/shiftCoverHelper";
import {
  canApproveCover,
  CoverRequest,
  formatShiftDate,
  getCurrentMonth,
  getMonthOptions,
  Shift,
} from "@/types/shift";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type TabType = "myShifts" | "covers" | "approvals";

export default function ShiftsScreen() {
  // Common state
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("myShifts");

  // My Shifts state
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [addShiftModalVisible, setAddShiftModalVisible] = useState(false);
  const [newShift, setNewShift] = useState({
    date: "",
    startTime: "20:00",
    endTime: "07:00",
    residence: "",
  });
  const [userResidence, setUserResidence] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Covers state
  const [availableCovers, setAvailableCovers] = useState<CoverRequest[]>([]);
  const [myRequests, setMyRequests] = useState<CoverRequest[]>([]);
  const [coversSubTab, setCoversSubTab] = useState<"available" | "myRequests">("available");

  // Approvals state
  const [pendingApprovals, setPendingApprovals] = useState<CoverRequest[]>([]);

  // Modals state
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedCover, setSelectedCover] = useState<CoverRequest | null>(null);
  const [shiftDetailsVisible, setShiftDetailsVisible] = useState(false);
  const [requestCoverVisible, setRequestCoverVisible] = useState(false);
  const [coverReason, setCoverReason] = useState("");
  const [coverDetailsVisible, setCoverDetailsVisible] = useState(false);
  const [reviewNotesModalVisible, setReviewNotesModalVisible] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [monthSelectorVisible, setMonthSelectorVisible] = useState(false);

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

      // Check user role and get residence
      const { role, residence } = await checkUserRole(currentUserEmail);
      setUserRole(role);
      setUserResidence(residence);
      const authorized = canApproveCover(role as any);
      setIsAuthorized(authorized);

      // Setup listeners
      setupShiftsListener(currentUserEmail, selectedMonth);
      setupCoversListeners(currentUserEmail);
      if (authorized) {
        setupApprovalsListener(residence);
      }
    } catch (error) {
      console.error("Error initializing:", error);
      Alert.alert("Error", "Failed to load shift data.");
    } finally {
      setLoading(false);
    }
  };

  const checkUserRole = async (email: string): Promise<{ role: string; residence: string }> => {
    try {
      const usersRef = collection(db, "Users");
      const userQuery = query(usersRef, where("Email", "==", email));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        return {
          role: userData.role || "Staff",
          residence: userData.residence || ""
        };
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
    return { role: "Staff", residence: "" };
  };

  const setupShiftsListener = (email: string, month: string) => {
    const shiftsQuery = query(
      collection(db, "Shifts"),
      where("userEmail", "==", email),
      where("month", "==", month),
      orderBy("date", "asc"),
      orderBy("startTime", "asc")
    );

    return onSnapshot(
      shiftsQuery,
      (snapshot) => {
        const shiftsList: Shift[] = [];
        snapshot.forEach((doc) => {
          shiftsList.push({ id: doc.id, ...doc.data() } as Shift);
        });
        setShifts(shiftsList);
      },
      (error) => {
        console.error("Error listening to shifts:", error);
      }
    );
  };

  const setupCoversListeners = (email: string) => {
    // Available covers
    const availableQuery = query(
      collection(db, "CoverRequests"),
      where("status", "==", "open"),
      orderBy("createdAt", "desc")
    );

    const unsubAvailable = onSnapshot(availableQuery, (snapshot) => {
      const covers: CoverRequest[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as CoverRequest;
        if (data.requestedByEmail !== email) {
          covers.push({ id: doc.id, ...data });
        }
      });
      setAvailableCovers(covers);
    });

    // My requests
    const myRequestsQuery = query(
      collection(db, "CoverRequests"),
      where("requestedByEmail", "==", email),
      orderBy("createdAt", "desc")
    );

    const unsubMine = onSnapshot(myRequestsQuery, (snapshot) => {
      const requests: CoverRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as CoverRequest);
      });
      setMyRequests(requests);
    });

    return () => {
      unsubAvailable();
      unsubMine();
    };
  };

  const setupApprovalsListener = async (currentUserResidence: string) => {
    console.log("Setting up approvals listener for residence:", currentUserResidence);
    
    const approvalsQuery = query(
      collection(db, "CoverRequests"),
      where("status", "==", "pending_approval"),
      orderBy("takenAt", "desc")
    );

    return onSnapshot(approvalsQuery, (snapshot) => {
      const requests: CoverRequest[] = [];
      
      console.log(`Found ${snapshot.docs.length} pending approval requests to filter`);
      
      // Filter by residence - only show requests from users in the same residence
      snapshot.forEach((doc) => {
        const requestData = { id: doc.id, ...doc.data() } as CoverRequest;
        
        console.log(`Request from ${requestData.requestedByEmail}: residence="${requestData.requestedByResidence}", TL residence="${currentUserResidence}", match=${requestData.requestedByResidence === currentUserResidence}`);
        
        // Only include if same residence as the TL/Admin
        if (requestData.requestedByResidence === currentUserResidence) {
          requests.push(requestData);
        }
      });
      
      console.log(`Filtered to ${requests.length} requests for residence: ${currentUserResidence}`);
      setPendingApprovals(requests);
    });
  };

  const handleAddShift = async () => {
    if (!newShift.date || !newShift.startTime || !newShift.endTime || !newShift.residence) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    const result = await createShift(userEmail, {
      date: newShift.date,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      location: newShift.residence, // Using residence as location
    });

    if (result.success) {
      Alert.alert("Success", "Shift created successfully!");
      setAddShiftModalVisible(false);
      setNewShift({
        date: "",
        startTime: "20:00",
        endTime: "07:00",
        residence: "",
      });
    } else {
      Alert.alert("Error", result.error || "Failed to create shift.");
    }
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

  const handleTakeCover = async (coverRequest: CoverRequest) => {
    Alert.alert(
      "Take Cover",
      `Take this shift?\n\n${formatShiftDate(coverRequest.shiftDate)}\n${coverRequest.shiftTime}\n${coverRequest.shiftLocation}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Take Cover",
          onPress: async () => {
            const result = await takeCover(coverRequest.id, userEmail);
            if (result.success) {
              Alert.alert("Success", "Cover request accepted! Pending TL/Admin approval.");
              setCoverDetailsVisible(false);
            } else {
              Alert.alert("Error", result.error || "Failed to take cover.");
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = async (coverRequest: CoverRequest) => {
    Alert.alert("Cancel Request", "Cancel this cover request?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          const result = await cancelCover(coverRequest.id, userEmail);
          if (result.success) {
            Alert.alert("Success", "Cover request cancelled.");
            setCoverDetailsVisible(false);
          } else {
            Alert.alert("Error", result.error || "Failed to cancel request.");
          }
        },
      },
    ]);
  };

  const handleApproveRequest = async () => {
    if (!selectedCover) return;

    const result = await approveCover(selectedCover.id, userEmail, reviewNotes);

    if (result.success) {
      Alert.alert("Success", "Cover request approved! Shift reassigned.");
      setReviewNotesModalVisible(false);
      setCoverDetailsVisible(false);
      setReviewNotes("");
    } else {
      Alert.alert("Error", result.error || "Failed to approve cover request.");
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedCover) return;

    const result = await rejectCover(selectedCover.id, userEmail, reviewNotes);

    if (result.success) {
      Alert.alert("Success", "Cover request rejected. Shift remains with original user.");
      setReviewNotesModalVisible(false);
      setCoverDetailsVisible(false);
      setReviewNotes("");
    } else {
      Alert.alert("Error", result.error || "Failed to reject cover request.");
    }
  };

  const getShiftStatusColor = (status: Shift["status"]) => {
    switch (status) {
      case "scheduled": return "#10b981";
      case "cover_requested": return "#f59e0b";
      case "cover_pending_approval": return "#3b82f6";
      case "completed": return "#6b7280";
      case "cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getShiftStatusLabel = (status: Shift["status"]) => {
    switch (status) {
      case "scheduled": return "Scheduled";
      case "cover_requested": return "Cover Requested";
      case "cover_pending_approval": return "Pending Approval";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  const getCoverStatusColor = (status: CoverRequest["status"]) => {
    switch (status) {
      case "open": return "#10b981";
      case "pending_approval": return "#3b82f6";
      case "approved": return "#6b7280";
      case "rejected": return "#ef4444";
      case "cancelled": return "#94a3b8";
      default: return "#6b7280";
    }
  };

  const getCoverStatusLabel = (status: CoverRequest["status"]) => {
    switch (status) {
      case "open": return "Open";
      case "pending_approval": return "Pending Approval";
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      case "cancelled": return "Cancelled";
      default: return status;
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
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerIconContainer}>
            <IconSymbol size={32} name="calendar" color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Shift Management</Text>
            <Text style={styles.headerSubtitle}>Manage shifts and covers</Text>
          </View>
        </View>

        {/* Main Tabs */}
        <View style={styles.mainTabSelector}>
          <TouchableOpacity
            style={[styles.mainTab, activeTab === "myShifts" && styles.mainTabActive]}
            onPress={() => setActiveTab("myShifts")}
          >
            <IconSymbol
              size={18}
              name="calendar"
              color={activeTab === "myShifts" ? "#fff" : "#666"}
            />
            <Text style={[styles.mainTabText, activeTab === "myShifts" && styles.mainTabTextActive]}>
              My Shifts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainTab, activeTab === "covers" && styles.mainTabActive]}
            onPress={() => setActiveTab("covers")}
          >
            <IconSymbol
              size={18}
              name="person.2.fill"
              color={activeTab === "covers" ? "#fff" : "#666"}
            />
            <Text style={[styles.mainTabText, activeTab === "covers" && styles.mainTabTextActive]}>
              Covers ({availableCovers.length})
            </Text>
          </TouchableOpacity>

          {isAuthorized && (
            <TouchableOpacity
              style={[styles.mainTab, activeTab === "approvals" && styles.mainTabActive]}
              onPress={() => setActiveTab("approvals")}
            >
              <IconSymbol
                size={18}
                name="checkmark.seal.fill"
                color={activeTab === "approvals" ? "#fff" : "#666"}
              />
              <Text style={[styles.mainTabText, activeTab === "approvals" && styles.mainTabTextActive]}>
                Approvals ({pendingApprovals.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* MY SHIFTS TAB */}
        {activeTab === "myShifts" && (
          <View style={styles.tabContent}>
            {/* Month Selector & Add Button */}
            <View style={styles.controlsRow}>
              <TouchableOpacity
                style={styles.monthSelector}
                onPress={() => setMonthSelectorVisible(true)}
              >
                <Text style={styles.monthSelectorText}>
                  {monthOptions.find((m) => m.value === selectedMonth)?.label || selectedMonth}
                </Text>
                <IconSymbol name="chevron.down" size={16} color="#3b82f6" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setAddShiftModalVisible(true)}
              >
                <IconSymbol name="plus" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add Shift</Text>
              </TouchableOpacity>
            </View>

            {/* Shifts List */}
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
                            styles.statusBadge,
                            { backgroundColor: `${getShiftStatusColor(shift.status)}20` },
                          ]}
                        >
                          <Text
                            style={[styles.statusText, { color: getShiftStatusColor(shift.status) }]}
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
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => setAddShiftModalVisible(true)}
                >
                  <IconSymbol size={18} name="plus.circle.fill" color="#3b82f6" />
                  <Text style={styles.emptyActionText}>Add Your First Shift</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* COVERS TAB */}
        {activeTab === "covers" && (
          <View style={styles.tabContent}>
            {/* Sub-tabs */}
            <View style={styles.subTabSelector}>
              <TouchableOpacity
                style={[styles.subTab, coversSubTab === "available" && styles.subTabActive]}
                onPress={() => setCoversSubTab("available")}
              >
                <Text
                  style={[
                    styles.subTabText,
                    coversSubTab === "available" && styles.subTabTextActive,
                  ]}
                >
                  Available ({availableCovers.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subTab, coversSubTab === "myRequests" && styles.subTabActive]}
                onPress={() => setCoversSubTab("myRequests")}
              >
                <Text
                  style={[
                    styles.subTabText,
                    coversSubTab === "myRequests" && styles.subTabTextActive,
                  ]}
                >
                  My Requests ({myRequests.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Available Covers */}
            {coversSubTab === "available" && (
              <>
                {availableCovers.length > 0 ? (
                  <View style={styles.coversContainer}>
                    {availableCovers.map((cover) => (
                      <TouchableOpacity
                        key={cover.id}
                        style={styles.coverCard}
                        onPress={() => {
                          setSelectedCover(cover);
                          setCoverDetailsVisible(true);
                        }}
                      >
                        <View style={styles.coverHeader}>
                          <View>
                            <Text style={styles.coverDate}>{formatShiftDate(cover.shiftDate)}</Text>
                            <Text style={styles.coverTime}>{cover.shiftTime}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.takeCoverButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleTakeCover(cover);
                            }}
                          >
                            <IconSymbol size={16} name="checkmark.circle.fill" color="#fff" />
                            <Text style={styles.takeCoverButtonText}>Take</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.coverLocation}>📍 {cover.shiftLocation}</Text>
                        <Text style={styles.coverRequester}>
                          By: <Text style={styles.coverRequesterName}>{cover.requestedBy}</Text>
                        </Text>
                        <Text style={styles.coverReason} numberOfLines={2}>
                          {cover.reason}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <IconSymbol size={64} name="person.2" color="#e5e7eb" />
                    <Text style={styles.emptyStateText}>No available covers</Text>
                  </View>
                )}
              </>
            )}

            {/* My Requests */}
            {coversSubTab === "myRequests" && (
              <>
                {myRequests.length > 0 ? (
                  <View style={styles.coversContainer}>
                    {myRequests.map((cover) => (
                      <TouchableOpacity
                        key={cover.id}
                        style={styles.coverCard}
                        onPress={() => {
                          setSelectedCover(cover);
                          setCoverDetailsVisible(true);
                        }}
                      >
                        <View style={styles.coverHeader}>
                          <View>
                            <Text style={styles.coverDate}>{formatShiftDate(cover.shiftDate)}</Text>
                            <Text style={styles.coverTime}>{cover.shiftTime}</Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: `${getCoverStatusColor(cover.status)}20` },
                            ]}
                          >
                            <Text
                              style={[styles.statusText, { color: getCoverStatusColor(cover.status) }]}
                            >
                              {getCoverStatusLabel(cover.status)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.coverLocation}>📍 {cover.shiftLocation}</Text>
                        <Text style={styles.coverReason} numberOfLines={2}>
                          {cover.reason}
                        </Text>
                        {cover.status === "pending_approval" && cover.takenBy && (
                          <Text style={styles.takenByText}>Taken by: {cover.takenBy}</Text>
                        )}
                        {cover.status === "open" && (
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleCancelRequest(cover);
                            }}
                          >
                            <IconSymbol size={14} name="xmark.circle" color="#ef4444" />
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <IconSymbol size={64} name="tray" color="#e5e7eb" />
                    <Text style={styles.emptyStateText}>No cover requests</Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* APPROVALS TAB */}
        {activeTab === "approvals" && isAuthorized && (
          <View style={styles.tabContent}>
            {pendingApprovals.length > 0 ? (
              <View style={styles.approvalsContainer}>
                {pendingApprovals.map((request) => (
                  <TouchableOpacity
                    key={request.id}
                    style={styles.approvalCard}
                    onPress={() => {
                      setSelectedCover(request);
                      setCoverDetailsVisible(true);
                    }}
                  >
                    <View style={styles.approvalHeader}>
                      <View>
                        <Text style={styles.approvalDate}>
                          {formatShiftDate(request.shiftDate)}
                        </Text>
                        <Text style={styles.approvalTime}>{request.shiftTime}</Text>
                      </View>
                      <View style={styles.pendingBadge}>
                        <IconSymbol size={14} name="clock" color="#f59e0b" />
                        <Text style={styles.pendingText}>Pending</Text>
                      </View>
                    </View>
                    <Text style={styles.approvalLocation}>📍 {request.shiftLocation}</Text>
                    <View style={styles.approvalUsers}>
                      <Text style={styles.approvalUserFrom}>{request.requestedBy}</Text>
                      <IconSymbol size={14} name="arrow.right" color="#3b82f6" />
                      <Text style={styles.approvalUserTo}>{request.takenBy}</Text>
                    </View>
                    <Text style={styles.approvalReason} numberOfLines={2}>
                      "{request.reason}"
                    </Text>
                    <View style={styles.approvalActions}>
                      <TouchableOpacity
                        style={[styles.approvalActionButton, styles.rejectButton]}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedCover(request);
                          setReviewAction("reject");
                          setReviewNotesModalVisible(true);
                        }}
                      >
                        <IconSymbol size={16} name="xmark" color="#fff" />
                        <Text style={styles.approvalActionText}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.approvalActionButton, styles.approveButton]}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedCover(request);
                          setReviewAction("approve");
                          setReviewNotesModalVisible(true);
                        }}
                      >
                        <IconSymbol size={16} name="checkmark" color="#fff" />
                        <Text style={styles.approvalActionText}>Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol size={64} name="checkmark.circle" color="#e5e7eb" />
                <Text style={styles.emptyStateText}>No pending approvals</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODALS */}

      {/* Add Shift Modal */}
      <Modal
        visible={addShiftModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddShiftModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAddShiftModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Shift</Text>
              <TouchableOpacity
                onPress={() => setAddShiftModalVisible(false)}
                style={styles.closeButton}
              >
                <IconSymbol size={24} name="xmark" color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Date *</Text>
                
                {/* Calendar Date Picker Button */}
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.calendarButtonContent}>
                    <IconSymbol name="calendar" size={24} color="#3b82f6" />
                    <View style={styles.calendarTextContainer}>
                      <Text style={styles.calendarButtonLabel}>
                        {newShift.date ? formatShiftDate(newShift.date) : "Pick a date from calendar"}
                      </Text>
                      {newShift.date && (
                        <Text style={styles.calendarButtonDate}>{newShift.date}</Text>
                      )}
                    </View>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color="#3b82f6" />
                </TouchableOpacity>
                
                {/* Date Picker */}
                {showDatePicker && (Platform.OS === "ios" ? (
                  <Modal
                    transparent={true}
                    animationType="slide"
                    visible={showDatePicker}
                    onRequestClose={() => setShowDatePicker(false)}
                  >
                    <Pressable
                      style={styles.datePickerOverlay}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Pressable style={styles.datePickerContainer} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.datePickerHeader}>
                          <Text style={styles.datePickerTitle}>Select Date</Text>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(false)}
                            style={styles.datePickerCloseButton}
                          >
                            <IconSymbol size={24} name="xmark" color="#666" />
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.iosPickerWrapper}>
                          <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="spinner"
                            onChange={(event, date) => {
                              if (date) {
                                setSelectedDate(date);
                              }
                            }}
                            minimumDate={new Date()}
                            textColor="#000000"
                            themeVariant="light"
                          />
                        </View>
                        
                        <View style={styles.datePickerActions}>
                          <TouchableOpacity
                            style={[styles.datePickerButton, styles.datePickerCancelButton]}
                            onPress={() => setShowDatePicker(false)}
                          >
                            <Text style={styles.datePickerCancelText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.datePickerButton, styles.datePickerConfirmButton]}
                            onPress={() => {
                              const dateString = selectedDate.toISOString().split('T')[0];
                              setNewShift({ ...newShift, date: dateString });
                              setShowDatePicker(false);
                            }}
                          >
                            <Text style={styles.datePickerConfirmText}>Confirm</Text>
                          </TouchableOpacity>
                        </View>
                      </Pressable>
                    </Pressable>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) {
                        setSelectedDate(date);
                        const dateString = date.toISOString().split('T')[0];
                        setNewShift({ ...newShift, date: dateString });
                      }
                    }}
                    minimumDate={new Date()}
                  />
                ))}
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputSection, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Start Time *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="20:00"
                    placeholderTextColor="#94a3b8"
                    value={newShift.startTime}
                    onChangeText={(text) => setNewShift({ ...newShift, startTime: text })}
                  />
                  <Text style={styles.helperText}>Default: 8pm</Text>
                </View>
                <View style={[styles.inputSection, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>End Time *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="07:00"
                    placeholderTextColor="#94a3b8"
                    value={newShift.endTime}
                    onChangeText={(text) => setNewShift({ ...newShift, endTime: text })}
                  />
                  <Text style={styles.helperText}>Default: 7am</Text>
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Residence *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your residence"
                  placeholderTextColor="#94a3b8"
                  value={newShift.residence}
                  onChangeText={(text) => setNewShift({ ...newShift, residence: text })}
                />
                {userResidence && (
                  <Text style={styles.helperText}>Your residence: {userResidence}</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setAddShiftModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={handleAddShift}
              >
                <Text style={styles.modalButtonSubmitText}>Add Shift</Text>
              </TouchableOpacity>
            </View>
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
                <View style={styles.shiftInfoBox}>
                  <Text style={styles.shiftInfoDate}>{formatShiftDate(selectedShift.date)}</Text>
                  <Text style={styles.shiftInfoTime}>
                    {selectedShift.startTime} - {selectedShift.endTime}
                  </Text>
                  <Text style={styles.shiftInfoLocation}>📍 {selectedShift.location}</Text>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Reason *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Why do you need cover for this shift?"
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
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setRequestCoverVisible(false)}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSubmit]}
                    onPress={handleRequestCover}
                  >
                    <Text style={styles.modalButtonSubmitText}>Submit Request</Text>
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

            {selectedCover && (
              <>
                <View style={styles.shiftInfoBox}>
                  <Text style={styles.shiftInfoDate}>
                    {formatShiftDate(selectedCover.shiftDate)}
                  </Text>
                  <Text style={styles.shiftInfoTime}>{selectedCover.shiftTime}</Text>
                  <Text style={styles.approvalUserTransfer}>
                    {selectedCover.requestedBy} → {selectedCover.takenBy}
                  </Text>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Add notes about your decision..."
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
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setReviewNotesModalVisible(false)}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      reviewAction === "approve"
                        ? styles.modalButtonSubmit
                        : styles.modalButtonDanger,
                    ]}
                    onPress={reviewAction === "approve" ? handleApproveRequest : handleRejectRequest}
                  >
                    <Text
                      style={[
                        styles.modalButtonSubmitText,
                        reviewAction === "reject" && { color: "#fff" },
                      ]}
                    >
                      {reviewAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

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
          <Pressable style={styles.smallModalContent} onPress={(e) => e.stopPropagation()}>
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
                    <IconSymbol name="checkmark" size={18} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", paddingBottom: 100 },
  content: { flex: 1 },
  
  // Header
  headerSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, backgroundColor: "#fff" },
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
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#000", marginBottom: 2 },
  headerSubtitle: { fontSize: 14, color: "#666" },
  
  // Main Tabs
  mainTabSelector: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  mainTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  mainTabActive: {
    backgroundColor: "#3b82f6",
  },
  mainTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  mainTabTextActive: {
    color: "#fff",
  },
  
  // Tab Content
  tabContent: { padding: 20 },
  
  // Controls
  controlsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  monthSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  monthSelectorText: { fontSize: 15, fontWeight: "600", color: "#000" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  addButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  
  // Shifts
  shiftsContainer: { gap: 12 },
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
  shiftContent: { flex: 1, padding: 14 },
  shiftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  shiftDate: { fontSize: 16, fontWeight: "600", color: "#000" },
  shiftTime: { fontSize: 14, color: "#666", marginBottom: 4 },
  shiftLocation: { fontSize: 14, color: "#999" },
  shiftDescription: { fontSize: 13, color: "#666", fontStyle: "italic", marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "600" },
  requestButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    margin: 8,
  },
  
  // Sub-tabs
  subTabSelector: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  subTabActive: {
    backgroundColor: "#3b82f6",
  },
  subTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  subTabTextActive: {
    color: "#fff",
  },
  
  // Covers
  coversContainer: { gap: 12 },
  coverCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
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
    marginBottom: 10,
  },
  coverDate: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 4 },
  coverTime: { fontSize: 14, color: "#3b82f6", fontWeight: "500" },
  coverLocation: { fontSize: 14, color: "#666", marginBottom: 6 },
  coverRequester: { fontSize: 13, color: "#666", marginBottom: 6 },
  coverRequesterName: { fontWeight: "600", color: "#000" },
  coverReason: { fontSize: 13, color: "#666", fontStyle: "italic" },
  takeCoverButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
  },
  takeCoverButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  takenByText: { fontSize: 13, color: "#3b82f6", marginTop: 8, fontWeight: "500" },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 4,
    marginTop: 8,
  },
  cancelButtonText: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  
  // Approvals
  approvalsContainer: { gap: 12 },
  approvalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  approvalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  approvalDate: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 4 },
  approvalTime: { fontSize: 14, color: "#3b82f6", fontWeight: "500" },
  approvalLocation: { fontSize: 14, color: "#666", marginBottom: 10 },
  approvalUsers: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  approvalUserFrom: { fontSize: 14, color: "#000", fontWeight: "500", flex: 1 },
  approvalUserTo: { fontSize: 14, color: "#10b981", fontWeight: "600", flex: 1, textAlign: "right" },
  approvalUserTransfer: { fontSize: 14, color: "#666", marginTop: 4 },
  approvalReason: { fontSize: 13, color: "#666", fontStyle: "italic", marginBottom: 10 },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingText: { fontSize: 11, fontWeight: "600", color: "#f59e0b" },
  approvalActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  approvalActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: { backgroundColor: "#10b981" },
  rejectButton: { backgroundColor: "#ef4444" },
  approvalActionText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  
  // Empty states
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyStateText: { fontSize: 18, fontWeight: "600", color: "#999", textAlign: "center" },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0f9ff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyActionText: { fontSize: 15, fontWeight: "600", color: "#3b82f6" },
  
  // Loading
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { fontSize: 16, color: "#6b7280", fontWeight: "500" },
  
  // Modals
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
    maxHeight: "80%",
  },
  smallModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "80%",
    maxWidth: 350,
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
  modalTitle: { fontSize: 22, fontWeight: "700", color: "#000" },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: { maxHeight: 400 },
  inputSection: { marginBottom: 16 },
  inputLabel: { fontSize: 15, fontWeight: "600", color: "#000", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#000",
    backgroundColor: "#f8fafc",
  },
  inputRow: { flexDirection: "row", gap: 12 },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  shiftInfoBox: {
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  shiftInfoDate: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 4 },
  shiftInfoTime: { fontSize: 14, color: "#3b82f6", marginBottom: 4 },
  shiftInfoLocation: { fontSize: 14, color: "#666" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#f3f4f6",
  },
  modalButtonSubmit: {
    backgroundColor: "#3b82f6",
  },
  modalButtonDanger: {
    backgroundColor: "#ef4444",
  },
  modalButtonCancelText: { fontSize: 15, fontWeight: "600", color: "#666" },
  modalButtonSubmitText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  
  // Month options
  monthOptions: { gap: 8 },
  monthOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  monthOptionSelected: {
    backgroundColor: "#f0f9ff",
    borderColor: "#3b82f6",
  },
  monthOptionText: { fontSize: 15, fontWeight: "500", color: "#000" },
  monthOptionTextSelected: { color: "#3b82f6", fontWeight: "600" },
  
  // Date picker
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f9ff",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3b82f6",
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  
  // Calendar Button
  calendarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  calendarTextContainer: {
    flex: 1,
  },
  calendarButtonLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3b82f6",
    marginBottom: 2,
  },
  calendarButtonDate: {
    fontSize: 13,
    color: "#666",
  },
  
  // Date Picker Modal
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  datePickerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },
  datePickerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  iosPickerWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 10,
  },
  datePickerActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  datePickerButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  datePickerCancelButton: {
    backgroundColor: "#f3f4f6",
  },
  datePickerConfirmButton: {
    backgroundColor: "#3b82f6",
  },
  datePickerCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  datePickerConfirmText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});


"use client"

import { ThemedView } from "@/components/themed-view"
import { IconSymbol } from "@/components/ui/icon-symbol"
import { auth, db } from "@/firebase"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore"
import { useEffect, useState } from "react"
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"

type TimeOffRequest = {
  id: string;
  full_name: string;
  residence: string;
  start: any;
  end: any;
  reason?: string;
  status: "pending" | "accepted" | "refused";
  notified: boolean;
  userId: string;
  userEmail: string;
  createdAt: any;
  updatedAt: any;
}

type User = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  residence: string;
}

export default function TimeOffScreen() {
  const [myRequests, setMyRequests] = useState<TimeOffRequest[]>([]);
  const [allRequests, setAllRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userResidence, setUserResidence] = useState<string>("");
  const [userFullName, setUserFullName] = useState<string>("");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  
  const [newRequest, setNewRequest] = useState({
    startDate: "",
    endDate: "",
    reason: ""
  });

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
      
      await loadUserData(currentUserEmail);
      
    } catch (error) {
      console.error("Error initializing time-off data:", error);
      Alert.alert("Error", "Failed to load time-off data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (email: string) => {
    try {
      const usersRef = collection(db, "Users");
      const userQuery = query(usersRef, where("Email", "==", email));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        const role = userData.role || "Staff";
        const residence = userData.residence || "";
        const fullName = userData.fullName || `${userData.firstName} ${userData.lastName}`;
        
        setUserFullName(fullName);
        setUserResidence(residence);
        const isAdminUser = role.toLowerCase() === "admin";
        setIsAdmin(isAdminUser);
        
        console.log("User loaded:", { fullName, residence, role, isAdmin: isAdminUser });
        setupRealtimeListeners(email, residence, isAdminUser);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const setupRealtimeListeners = (email: string, residence: string, isAdminUser: boolean) => {
    console.log("Setting up listeners for:", { email, residence, isAdminUser });
    
    try {
      const myRequestsQuery = query(
        collection(db, "time-off-request"),
        where("userEmail", "==", email)
      );

      const unsubscribeMyRequests = onSnapshot(myRequestsQuery, (snapshot) => {
        console.log("My requests snapshot:", snapshot.size, "documents");
        const requests: TimeOffRequest[] = [];
        snapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() } as TimeOffRequest);
        });
        
        requests.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        
        setMyRequests(requests);
        console.log("Loaded my requests:", requests.length);
      }, (error) => {
        console.error("Error listening to my requests:", error);
      });

      let unsubscribeAllRequests = () => {};
      if (isAdminUser && residence) {
        const allRequestsQuery = query(
          collection(db, "time-off-request"),
          where("residence", "==", residence)
        );

        unsubscribeAllRequests = onSnapshot(allRequestsQuery, (snapshot) => {
          console.log("All requests snapshot:", snapshot.size, "documents");
          const requests: TimeOffRequest[] = [];
          snapshot.forEach((doc) => {
            requests.push({ id: doc.id, ...doc.data() } as TimeOffRequest);
          });
          
          requests.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
          
          setAllRequests(requests);
          console.log("Loaded all requests for residence:", requests.length);
        }, (error) => {
          console.error("Error listening to all requests:", error);
        });
      }

      return () => {
        console.log("Cleaning up real-time listeners");
        unsubscribeMyRequests();
        unsubscribeAllRequests();
      };
    } catch (error) {
      console.error("Error setting up listeners:", error);
    }
  };

  const createTimeOffRequest = async () => {
    if (!newRequest.startDate || !newRequest.endDate) {
      Alert.alert("Error", "Please fill in start and end dates.");
      return;
    }

    try {
      const startDate = new Date(newRequest.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(newRequest.endDate);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < startDate) {
        Alert.alert("Error", "End date cannot be before start date.");
        return;
      }

      const requestData = {
        full_name: userFullName,
        residence: userResidence,
        start: startDate,
        end: endDate,
        reason: newRequest.reason || "",
        status: "pending" as const,
        notified: false,
        userId: auth.currentUser?.uid || "",
        userEmail: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "time-off-request"), requestData);
      
      Alert.alert("Success", "Time-off request created successfully!");
      
      setNewRequest({
        startDate: "",
        endDate: "",
        reason: ""
      });
      setCreateModalVisible(false);
      
    } catch (error) {
      console.error("Error creating time-off request:", error);
      Alert.alert("Error", "Failed to create request. Please try again.");
    }
  };

  const cancelRequest = async (requestId: string) => {
    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this request? This action cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "time-off-request", requestId));
              Alert.alert("Success", "Request cancelled successfully!");
            } catch (error) {
              console.error("Error cancelling request:", error);
              Alert.alert("Error", "Failed to cancel request. Please try again.");
            }
          }
        }
      ]
    );
  };

  const updateRequestStatus = async (requestId: string, status: "accepted" | "refused") => {
    try {
      const requestRef = doc(db, "time-off-request", requestId);
      await updateDoc(requestRef, {
        status: status,
        notified: true,
        updatedAt: serverTimestamp()
      });
      
      Alert.alert("Success", `Request ${status} successfully!`);
      setDetailsModalVisible(false);
    } catch (error) {
      console.error("Error updating request status:", error);
      Alert.alert("Error", "Failed to update request. Please try again.");
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getStatusColor = (status: TimeOffRequest["status"]) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "accepted": return "#10b981";
      case "refused": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusIcon = (status: TimeOffRequest["status"]) => {
    switch (status) {
      case "pending": return "clock";
      case "accepted": return "checkmark.circle";
      case "refused": return "xmark.circle";
      default: return "questionmark.circle";
    }
  };

  const handleRequestPress = (request: TimeOffRequest) => {
    setSelectedRequest(request);
    setDetailsModalVisible(true);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading time-off requests...</Text>
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
              <IconSymbol size={32} name="calendar.badge.clock" color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                {isAdmin ? "Time-Off Management" : "My Time-Off Requests"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isAdmin ? "Review and manage time-off requests" : "Create and track your time-off requests"}
              </Text>
            </View>
          </View>
          
          {/* Create Request Button (Non-Admin) */}
          {!isAdmin && (
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setCreateModalVisible(true)}
            >
              <IconSymbol size={20} name="plus.circle.fill" color="#fff" />
              <Text style={styles.createButtonText}>New Request</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Admin View: All Requests */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {allRequests.length > 0 ? `All Requests (${allRequests.length})` : "No Requests"}
            </Text>
            {allRequests.length > 0 ? (
              <View style={styles.requestsContainer}>
                {allRequests.map((request) => (
                  <TouchableOpacity 
                    key={request.id} 
                    style={styles.requestCard}
                    onPress={() => handleRequestPress(request)}
                  >
                    <View style={[styles.requestColorBar, { backgroundColor: getStatusColor(request.status) }]} />
                    <View style={styles.requestContent}>
                      <View style={styles.requestHeader}>
                        <Text style={styles.requestName}>{request.full_name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(request.status)}20` }]}>
                          <IconSymbol size={14} name={getStatusIcon(request.status)} color={getStatusColor(request.status)} />
                          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.requestDates}>
                        <View style={styles.dateRow}>
                          <IconSymbol size={16} name="calendar" color="#666" />
                          <Text style={styles.dateLabel}>From:</Text>
                          <Text style={styles.dateValue}>{formatDate(request.start)}</Text>
                        </View>
                        <View style={styles.dateRow}>
                          <IconSymbol size={16} name="calendar" color="#666" />
                          <Text style={styles.dateLabel}>To:</Text>
                          <Text style={styles.dateValue}>{formatDate(request.end)}</Text>
                        </View>
                      </View>
                      {request.reason && <Text style={styles.requestReason}>{request.reason}</Text>}
                      {request.status === "pending" && (
                        <View style={styles.adminActions}>
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={(e) => {
                              e.stopPropagation();
                              updateRequestStatus(request.id, "accepted");
                            }}
                          >
                            <IconSymbol size={16} name="checkmark" color="#fff" />
                            <Text style={styles.actionButtonText}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.refuseButton]}
                            onPress={(e) => {
                              e.stopPropagation();
                              updateRequestStatus(request.id, "refused");
                            }}
                          >
                            <IconSymbol size={16} name="xmark" color="#fff" />
                            <Text style={styles.actionButtonText}>Refuse</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol size={48} name="calendar.badge.clock" color="#ccc" />
                <Text style={styles.emptyStateText}>No time-off requests in your residence</Text>
              </View>
            )}
          </View>
        )}

        {/* Non-Admin View: My Requests */}
        {!isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {myRequests.length > 0 ? "My Requests" : "No Requests Yet"}
            </Text>
            {myRequests.length > 0 ? (
              <View style={styles.requestsContainer}>
                {myRequests.map((request) => (
                  <TouchableOpacity 
                    key={request.id} 
                    style={styles.requestCard}
                    onPress={() => handleRequestPress(request)}
                  >
                    <View style={[styles.requestColorBar, { backgroundColor: getStatusColor(request.status) }]} />
                    <View style={styles.requestContent}>
                      <View style={styles.requestHeader}>
                        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(request.status)}20` }]}>
                          <IconSymbol size={14} name={getStatusIcon(request.status)} color={getStatusColor(request.status)} />
                          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.requestDates}>
                        <View style={styles.dateRow}>
                          <IconSymbol size={16} name="calendar" color="#666" />
                          <Text style={styles.dateLabel}>From:</Text>
                          <Text style={styles.dateValue}>{formatDate(request.start)}</Text>
                        </View>
                        <View style={styles.dateRow}>
                          <IconSymbol size={16} name="calendar" color="#666" />
                          <Text style={styles.dateLabel}>To:</Text>
                          <Text style={styles.dateValue}>{formatDate(request.end)}</Text>
                        </View>
                      </View>
                      {request.reason && <Text style={styles.requestReason}>{request.reason}</Text>}
                      {request.status === "pending" && (
                        <TouchableOpacity 
                          style={styles.cancelButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            cancelRequest(request.id);
                          }}
                        >
                          <IconSymbol size={16} name="trash" color="#ef4444" />
                          <Text style={styles.cancelButtonText}>Cancel Request</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol size={48} name="calendar.badge.clock" color="#ccc" />
                <Text style={styles.emptyStateText}>No time-off requests yet</Text>
                <Text style={styles.emptyStateSubtext}>Tap "New Request" to create one</Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* Create Request Modal */}
      <Modal
        visible={createModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCreateModalVisible(false)}>
          <Pressable style={styles.createModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Time-Off Request</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.closeButton}>
                <IconSymbol size={24} name="xmark" color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Start Date */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Start Date *</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    value={newRequest.startDate}
                    onChangeText={(text) => setNewRequest({ ...newRequest, startDate: text })}
                  />
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const dateString = tomorrow.toISOString().split('T')[0];
                      setNewRequest({ ...newRequest, startDate: dateString });
                    }}
                  >
                    <IconSymbol name="calendar" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* End Date */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>End Date *</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    value={newRequest.endDate}
                    onChangeText={(text) => setNewRequest({ ...newRequest, endDate: text })}
                  />
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      const dateString = nextWeek.toISOString().split('T')[0];
                      setNewRequest({ ...newRequest, endDate: dateString });
                    }}
                  >
                    <IconSymbol name="calendar" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reason */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Reason (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Enter reason for time-off request"
                  value={newRequest.reason}
                  onChangeText={(text) => setNewRequest({ ...newRequest, reason: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <IconSymbol size={20} name="info.circle" color="#3b82f6" />
                <Text style={styles.infoText}>
                  Your request will be sent to your admin for approval. You can cancel it anytime while it's pending.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={createTimeOffRequest}
              >
                <Text style={styles.modalButtonSubmitText}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Request Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDetailsModalVisible(false)}>
          <Pressable style={styles.detailsModalContent} onPress={(e) => e.stopPropagation()}>
            {selectedRequest && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Request Details</Text>
                  <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.closeButton}>
                    <IconSymbol size={24} name="xmark" color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.detailsContent}>
                  {/* Status Badge */}
                  <View style={[styles.largeStatusBadge, { backgroundColor: `${getStatusColor(selectedRequest.status)}20` }]}>
                    <IconSymbol size={32} name={getStatusIcon(selectedRequest.status)} color={getStatusColor(selectedRequest.status)} />
                    <Text style={[styles.largeStatusText, { color: getStatusColor(selectedRequest.status) }]}>
                      {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </Text>
                  </View>

                  {/* Details */}
                  {isAdmin && (
                    <View style={styles.detailRow}>
                      <IconSymbol size={20} name="person" color="#666" />
                      <Text style={styles.detailLabel}>Requested by:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.full_name}</Text>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="calendar" color="#666" />
                    <Text style={styles.detailLabel}>From:</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedRequest.start)}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="calendar" color="#666" />
                    <Text style={styles.detailLabel}>To:</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedRequest.end)}</Text>
                  </View>
                  
                  {selectedRequest.reason && (
                    <View style={styles.detailRow}>
                      <IconSymbol size={20} name="text.alignleft" color="#666" />
                      <Text style={styles.detailLabel}>Reason:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.reason}</Text>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <IconSymbol size={20} name="building.2" color="#666" />
                    <Text style={styles.detailLabel}>Residence:</Text>
                    <Text style={styles.detailValue}>{selectedRequest.residence}</Text>
                  </View>
                </View>
                
                {/* Actions */}
                {isAdmin && selectedRequest.status === "pending" && (
                  <View style={styles.detailsActions}>
                    <TouchableOpacity 
                      style={[styles.detailsActionButton, styles.acceptButton]}
                      onPress={() => updateRequestStatus(selectedRequest.id, "accepted")}
                    >
                      <IconSymbol size={20} name="checkmark" color="#fff" />
                      <Text style={styles.actionButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.detailsActionButton, styles.refuseButton]}
                      onPress={() => updateRequestStatus(selectedRequest.id, "refused")}
                    >
                      <IconSymbol size={20} name="xmark" color="#fff" />
                      <Text style={styles.actionButtonText}>Refuse</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {!isAdmin && selectedRequest.status === "pending" && (
                  <TouchableOpacity 
                    style={styles.detailsCancelButton}
                    onPress={() => {
                      setDetailsModalVisible(false);
                      cancelRequest(selectedRequest.id);
                    }}
                  >
                    <IconSymbol size={20} name="trash" color="#ef4444" />
                    <Text style={styles.cancelButtonText}>Cancel Request</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingBottom: 100 },
  content: { flex: 1 },
  
  headerSection: { 
    paddingHorizontal: 20, 
    paddingTop: 32, 
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTitleContainer: { flexDirection: "row", alignItems: "flex-start", gap: 16, marginBottom: 20 },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: "#111827",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: "#6b7280",
    lineHeight: 20,
    maxWidth: 240,
  },
  
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  
  section: { marginBottom: 32, paddingTop: 24 },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#111827",
    marginBottom: 16, 
    paddingHorizontal: 20,
    letterSpacing: -0.3,
  },
  
  requestsContainer: { paddingHorizontal: 20, gap: 16 },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  requestColorBar: { width: 5 },
  requestContent: { flex: 1, padding: 20 },
  requestHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  requestName: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: "#111827", 
    flex: 1,
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  statusText: { 
    fontSize: 13, 
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  requestDates: { gap: 10, marginBottom: 16 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateLabel: { 
    fontSize: 14, 
    color: "#6b7280", 
    fontWeight: "600", 
    width: 50,
  },
  dateValue: { 
    fontSize: 14, 
    color: "#111827", 
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  requestReason: { 
    fontSize: 14, 
    color: "#6b7280", 
    marginBottom: 16, 
    fontStyle: "italic",
    lineHeight: 20,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 10,
  },
  
  adminActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  acceptButton: {
    backgroundColor: "#10b981",
  },
  refuseButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 1.5,
    borderColor: "#fecaca",
    gap: 6,
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 80,
    alignItems: "center",
    gap: 16,
  },
  emptyStateText: {
    fontSize: 17,
    color: "#6b7280",
    textAlign: "center",
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    fontWeight: "500",
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "600",
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  createModalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  detailsModalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: "#111827",
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    padding: 24,
  },
  
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#111827",
  },
  formTextArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  datePickerButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#dbeafe",
  },
  
  infoBox: {
    flexDirection: "row",
    gap: 14,
    padding: 18,
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 21,
    fontWeight: "500",
  },
  
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#f3f4f6",
  },
  modalButtonSubmit: {
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.2,
  },
  modalButtonSubmitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  
  detailsContent: {
    marginTop: 24,
    gap: 18,
  },
  largeStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 18,
    gap: 14,
    marginBottom: 12,
  },
  largeStatusText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  detailLabel: { 
    fontSize: 14, 
    color: "#6b7280", 
    fontWeight: "600", 
    minWidth: 80,
  },
  detailValue: { 
    fontSize: 14, 
    color: "#111827", 
    fontWeight: "700", 
    flex: 1,
    letterSpacing: -0.2,
  },
  
  detailsActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },
  detailsActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  
  detailsCancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#fef2f2",
    borderWidth: 2,
    borderColor: "#fecaca",
    gap: 8,
    marginTop: 28,
  },
})

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

type DutyShift = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: "regular" | "overtime" | "emergency";
  status: "scheduled" | "completed" | "cancelled" | "pending_swap";
  location: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

type DutySwap = {
  id: string;
  shiftId: string;
  requestedBy: string;
  requestedByEmail: string;
  requestedByUserId: string;
  reason: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  createdAt: any;
  updatedAt: any;
}

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  residence?: string;
  isActive: boolean;
}

type UserRole = "Staff" | "TL" | "PS" | "CA";

export default function DutyScreen() {
  const [upcomingShifts, setUpcomingShifts] = useState<DutyShift[]>([]);
  const [swapRequests, setSwapRequests] = useState<DutySwap[]>([]);
  const [nextDuty, setNextDuty] = useState<DutyShift | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedShift, setSelectedShift] = useState<DutyShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  
  // TL Management States
  const [userRole, setUserRole] = useState<UserRole>("Staff");
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [assignDutyModalVisible, setAssignDutyModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newDuty, setNewDuty] = useState({
    date: "",
    startTime: "",
    endTime: "",
    type: "regular" as "regular" | "overtime" | "emergency",
    location: "",
    notes: ""
  });
  const [allDuties, setAllDuties] = useState<DutyShift[]>([]);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Get user email from AsyncStorage or auth
      const storedEmail = await AsyncStorage.getItem("userEmail");
      const currentUserEmail = storedEmail || auth.currentUser?.email;
      
      if (!currentUserEmail) {
        Alert.alert("Error", "No user session found. Please login again.");
        return;
      }

      setUserEmail(currentUserEmail);
      
      // Get user role and check if user is Team Lead
      const userRole = await checkUserRole(currentUserEmail);
      
      // Set up real-time listeners
      const cleanup = setupRealtimeListeners(currentUserEmail, userRole === "TL");
      
      // If user is TL, load all users and all duties
      if (isTeamLead) {
        await loadAllUsers();
        await loadAllDuties();
      }
      
    } catch (error) {
      console.error("Error initializing duty data:", error);
      Alert.alert("Error", "Failed to load duty data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkUserRole = async (userEmail: string): Promise<string> => {
    try {
      const usersRef = collection(db, "Users");
      const userQuery = query(usersRef, where("Email", "==", userEmail));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        const role = userData.role || "Staff";
        setUserRole(role as UserRole);
        setIsTeamLead(role === "TL");
        console.log("User role:", role, "Is Team Lead:", role === "TL");
        return role;
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
    return "Staff";
  };

  const loadAllUsers = async () => {
    try {
      const usersRef = collection(db, "Users");
      const usersQuery = query(usersRef, where("isActive", "==", true));
      const usersSnapshot = await getDocs(usersQuery);
      
      const users: User[] = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          email: userData.Email || userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          residence: userData.residence,
          isActive: userData.isActive
        });
      });
      
      setAllUsers(users);
      console.log("Loaded users:", users.length);
      
      // If no users found, show sample users for testing
      if (users.length === 0) {
        const sampleUsers: User[] = [
          {
            id: "sample-user-1",
            email: "john.doe@example.com",
            firstName: "John",
            lastName: "Doe",
            role: "Staff",
            residence: "Building A",
            isActive: true
          },
          {
            id: "sample-user-2", 
            email: "jane.smith@example.com",
            firstName: "Jane",
            lastName: "Smith",
            role: "Staff",
            residence: "Building B",
            isActive: true
          }
        ];
        setAllUsers(sampleUsers);
        console.log("Using sample users for testing:", sampleUsers.length);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      
      // Fallback to sample users if there's an error
      const sampleUsers: User[] = [
        {
          id: "sample-user-1",
          email: "john.doe@example.com",
          firstName: "John",
          lastName: "Doe",
          role: "Staff",
          residence: "Building A",
          isActive: true
        },
        {
          id: "sample-user-2", 
          email: "jane.smith@example.com",
          firstName: "Jane",
          lastName: "Smith",
          role: "Staff",
          residence: "Building B",
          isActive: true
        }
      ];
      setAllUsers(sampleUsers);
      console.log("Using fallback sample users:", sampleUsers.length);
    }
  };

  const loadAllDuties = async () => {
    try {
      const dutiesRef = collection(db, "DutyShifts");
      const dutiesQuery = query(dutiesRef, orderBy("date", "asc"));
      
      const unsubscribe = onSnapshot(dutiesQuery, (snapshot) => {
        const duties: DutyShift[] = [];
        snapshot.forEach((doc) => {
          duties.push({ id: doc.id, ...doc.data() } as DutyShift);
        });
        setAllDuties(duties);
        console.log("Loaded all duties:", duties.length);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error("Error loading all duties:", error);
    }
  };

  const loadSampleData = async (userEmail: string) => {
    try {
      // Create some sample duty shifts for demonstration
      const sampleShifts: DutyShift[] = [
        {
          id: "sample1",
          userId: auth.currentUser?.uid || "sample-user",
          userEmail: userEmail,
          userName: "Sample User",
          date: "2025-01-20",
          startTime: "08:00",
          endTime: "16:00",
          type: "regular",
          status: "scheduled",
          location: "Main Building",
          notes: "Regular duty shift - Sample data",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "sample2",
          userId: auth.currentUser?.uid || "sample-user",
          userEmail: userEmail,
          userName: "Sample User",
          date: "2025-01-22",
          startTime: "16:00",
          endTime: "00:00",
          type: "overtime",
          status: "scheduled",
          location: "Main Building",
          notes: "Overtime coverage - Sample data",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      setUpcomingShifts(sampleShifts);
      setNextDuty(sampleShifts[0]);
      
      console.log("Sample data loaded for demonstration");
    } catch (error) {
      console.error("Error loading sample data:", error);
    }
  };

  const setupRealtimeListeners = (userEmail: string, isTL: boolean) => {
    console.log("Setting up real-time listeners for user:", userEmail, "isTL:", isTL);
    
    try {
      // Real-time listener for user's duty shifts - simplified query to avoid index requirements
      const shiftsQuery = query(
        collection(db, "DutyShifts"),
        where("userEmail", "==", userEmail)
      );

      const unsubscribeShifts = onSnapshot(shiftsQuery, (snapshot) => {
        console.log("Duty shifts snapshot received:", snapshot.size, "documents");
        const allShifts: DutyShift[] = [];
        snapshot.forEach((doc) => {
          allShifts.push({ id: doc.id, ...doc.data() } as DutyShift);
        });
        
        // Filter shifts on client side to avoid complex Firestore queries
        const filteredShifts = allShifts.filter(shift => 
          shift.status === "scheduled" || shift.status === "pending_swap"
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setUpcomingShifts(filteredShifts);
        
        // Set next duty (earliest upcoming shift)
        const now = new Date();
        const nextShift = filteredShifts.find(shift => {
          const shiftDate = new Date(`${shift.date} ${shift.startTime}`);
          return shiftDate > now;
        });
        setNextDuty(nextShift || null);
      }, (error) => {
        console.error("Error listening to shifts:", error);
        // Don't show alert for missing collections - just log
        if (error.code === 'permission-denied') {
          console.log("Permission denied - this is expected if collections don't exist yet");
        } else {
          Alert.alert("Error", "Failed to sync duty shifts: " + error.message);
        }
      });

      // Real-time listener for swap requests
      // TLs see all swap requests, Staff see only their own
      // Simplified queries to avoid composite index requirements
      const swapsQuery = isTL 
        ? collection(db, "DutySwaps")
        : query(collection(db, "DutySwaps"), where("requestedByEmail", "==", userEmail));

      const unsubscribeSwaps = onSnapshot(swapsQuery, (snapshot) => {
        console.log("Swap requests snapshot received:", snapshot.size, "documents");
        const swaps: DutySwap[] = [];
        snapshot.forEach((doc) => {
          swaps.push({ id: doc.id, ...doc.data() } as DutySwap);
        });
        
        // Sort swaps by creation date (newest first) on client side
        swaps.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        
        setSwapRequests(swaps);
        console.log("Loaded swap requests:", swaps.length, "for user:", userEmail, "isTL:", isTL);
      }, (error) => {
        console.error("Error listening to swaps:", error);
        // Don't show alert for missing collections - just log
        if (error.code === 'permission-denied') {
          console.log("Permission denied - this is expected if collections don't exist yet");
        } else {
          Alert.alert("Error", "Failed to sync swap requests: " + error.message);
        }
      });

      // Cleanup function
      return () => {
        console.log("Cleaning up real-time listeners");
        unsubscribeShifts();
        unsubscribeSwaps();
      };
    } catch (error) {
      console.error("Error setting up listeners:", error);
      Alert.alert("Error", "Failed to initialize real-time listeners.");
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

  // CRUD Operations
  const createDutyShift = async (shiftData: Omit<DutyShift, "id" | "createdAt" | "updatedAt">) => {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (!userEmail) {
        Alert.alert("Error", "No user session found.");
        return;
      }

      // Get user info
      const usersRef = collection(db, "Users");
      const userQuery = query(usersRef, where("Email", "==", userEmail));
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        Alert.alert("Error", "User profile not found.");
        return;
      }

      const userData = userSnapshot.docs[0].data();
      
      const newShift = {
        ...shiftData,
        userId: auth.currentUser?.uid || "",
        userEmail: userEmail,
        userName: `${userData.firstName} ${userData.lastName}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "DutyShifts"), newShift);
      Alert.alert("Success", "Duty shift created successfully!");
    } catch (error) {
      console.error("Error creating duty shift:", error);
      Alert.alert("Error", "Failed to create duty shift. Please try again.");
    }
  };

  const updateDutyShift = async (shiftId: string, updates: Partial<DutyShift>) => {
    try {
      const shiftRef = doc(db, "DutyShifts", shiftId);
      await updateDoc(shiftRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      Alert.alert("Success", "Duty shift updated successfully!");
    } catch (error) {
      console.error("Error updating duty shift:", error);
      Alert.alert("Error", "Failed to update duty shift. Please try again.");
    }
  };

  const deleteDutyShift = async (shiftId: string) => {
    try {
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete this duty shift?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await deleteDoc(doc(db, "DutyShifts", shiftId));
              Alert.alert("Success", "Duty shift deleted successfully!");
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error deleting duty shift:", error);
      Alert.alert("Error", "Failed to delete duty shift. Please try again.");
    }
  };

  const requestDutySwap = async (shiftId: string, reason: string) => {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (!userEmail) {
        Alert.alert("Error", "No user session found.");
        return;
      }

      // Get user info
      const usersRef = collection(db, "Users");
      const userQuery = query(usersRef, where("Email", "==", userEmail));
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        Alert.alert("Error", "User profile not found.");
        return;
      }

      const userData = userSnapshot.docs[0].data();

      const swapRequest = {
        shiftId: shiftId,
        requestedBy: `${userData.firstName} ${userData.lastName}`,
        requestedByEmail: userEmail,
        requestedByUserId: auth.currentUser?.uid || "",
        reason: reason,
        status: "pending" as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "DutySwaps"), swapRequest);
      
      // Update shift status to pending_swap
      await updateDutyShift(shiftId, { status: "pending_swap" });
      
      Alert.alert("Success", "Swap request submitted successfully!");
    } catch (error) {
      console.error("Error requesting duty swap:", error);
      Alert.alert("Error", "Failed to submit swap request. Please try again.");
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
    Alert.alert(
      "Request Duty Swap",
      `Request a swap for your shift on ${formatDate(shift.date)} (${shift.startTime} - ${shift.endTime})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Swap",
          onPress: () => {
            // Show reason input
            Alert.prompt(
              "Swap Reason",
              "Please provide a reason for requesting this swap:",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Submit Request",
                  onPress: (reason: string | undefined) => {
                    if (reason && reason.trim()) {
                      requestDutySwap(shift.id, reason.trim());
                    } else {
                      Alert.alert("Error", "Please provide a reason for the swap request.");
                    }
                  }
                }
              ],
              "plain-text",
              undefined,
              "default"
            );
          }
        }
      ]
    );
  };


  // TL Management Functions
  const handleAssignDuty = async () => {
    if (!selectedUser || !newDuty.date || !newDuty.startTime || !newDuty.endTime || !newDuty.location) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    try {
      const dutyData = {
        userId: selectedUser.id,
        userEmail: selectedUser.email,
        userName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        date: newDuty.date,
        startTime: newDuty.startTime,
        endTime: newDuty.endTime,
        type: newDuty.type,
        location: newDuty.location,
        notes: newDuty.notes,
        status: "scheduled" as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "DutyShifts"), dutyData);
      
      Alert.alert("Success", `Duty assigned to ${selectedUser.firstName} ${selectedUser.lastName} successfully!`);
      
      // Reset form
      setNewDuty({
        date: "",
        startTime: "",
        endTime: "",
        type: "regular",
        location: "",
        notes: ""
      });
      setSelectedUser(null);
      setAssignDutyModalVisible(false);
      
    } catch (error) {
      console.error("Error assigning duty:", error);
      Alert.alert("Error", "Failed to assign duty. Please try again.");
    }
  };

  const handleEditDuty = async (dutyId: string, updates: Partial<DutyShift>) => {
    try {
      console.log("Updating duty:", dutyId, "with updates:", updates);
      const dutyRef = doc(db, "DutyShifts", dutyId);
      await updateDoc(dutyRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log("Duty updated successfully");
      Alert.alert("Success", "Duty updated successfully!");
    } catch (error) {
      console.error("Error updating duty:", error);
      Alert.alert("Error", "Failed to update duty. Please try again.");
    }
  };

  const handleCompleteDuty = async (dutyId: string, userName: string) => {
    Alert.alert(
      "Mark Duty Complete",
      `Mark ${userName}'s duty as completed?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Complete",
          onPress: () => handleEditDuty(dutyId, { status: "completed" })
        }
      ]
    );
  };

  const handleDeleteDuty = async (dutyId: string, userName: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the duty for ${userName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "DutyShifts", dutyId));
              Alert.alert("Success", "Duty deleted successfully!");
            } catch (error) {
              console.error("Error deleting duty:", error);
              Alert.alert("Error", "Failed to delete duty. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleSwapAction = async (swap: DutySwap, action: "accepted" | "rejected") => {
    if (action === "rejected") {
      // Simple rejection - just update status
      try {
        const swapRef = doc(db, "DutySwaps", swap.id);
        await updateDoc(swapRef, {
          status: "rejected",
          updatedAt: serverTimestamp()
        });
        
        // Reset the shift status back to scheduled
        await updateDutyShift(swap.shiftId, { status: "scheduled" });
        
        Alert.alert("Success", "Swap request rejected. Duty remains assigned to original person.");
      } catch (error) {
        console.error("Error rejecting swap:", error);
        Alert.alert("Error", "Failed to reject swap request. Please try again.");
      }
    } else {
      // Acceptance requires choosing action
      Alert.alert(
        "Accept Swap Request",
        "How would you like to handle this swap?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete Duty",
            style: "destructive",
            onPress: async () => {
              try {
                // Delete the duty
                await deleteDoc(doc(db, "DutyShifts", swap.shiftId));
                
                // Update swap status
                const swapRef = doc(db, "DutySwaps", swap.id);
                await updateDoc(swapRef, {
                  status: "accepted",
                  updatedAt: serverTimestamp()
                });
                
                Alert.alert("Success", "Swap accepted and duty deleted.");
              } catch (error) {
                console.error("Error accepting swap (delete):", error);
                Alert.alert("Error", "Failed to process swap. Please try again.");
              }
            }
          },
          {
            text: "Reassign to Someone",
            onPress: async () => {
              // Load all users if not already loaded
              if (allUsers.length === 0) {
                await loadAllUsers();
              }
              
              // Show user selection dialog
              const userOptions = allUsers
                .filter(u => u.email !== swap.requestedByEmail) // Exclude person requesting swap
                .map(u => ({
                  text: `${u.firstName} ${u.lastName} (${u.role})`,
                  onPress: async () => {
                    try {
                      // Update duty with new user
                      await updateDoc(doc(db, "DutyShifts", swap.shiftId), {
                        userId: u.id,
                        userEmail: u.email,
                        userName: `${u.firstName} ${u.lastName}`,
                        status: "scheduled",
                        updatedAt: serverTimestamp()
                      });
                      
                      // Update swap status
                      const swapRef = doc(db, "DutySwaps", swap.id);
                      await updateDoc(swapRef, {
                        status: "accepted",
                        updatedAt: serverTimestamp()
                      });
                      
                      Alert.alert("Success", `Duty reassigned to ${u.firstName} ${u.lastName}.`);
                    } catch (error) {
                      console.error("Error reassigning duty:", error);
                      Alert.alert("Error", "Failed to reassign duty. Please try again.");
                    }
                  }
                }));
              
              userOptions.unshift({ text: "Cancel", onPress: async () => {} });
              
              Alert.alert(
                "Select New Assignee",
                "Choose who to assign this duty to:",
                userOptions
              );
            }
          }
        ]
      );
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading duty data...</Text>
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
              <IconSymbol size={32} name="building.2.fill" color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                {isTeamLead ? "Duty Management (Team Lead)" : "Duty Management"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isTeamLead ? "Manage team duties and assignments" : "Manage your duty schedule"}
              </Text>
            </View>
          </View>
          
          {/* TL Quick Actions */}
          {isTeamLead && (
            <View style={styles.tlActionsContainer}>
              <TouchableOpacity 
                style={styles.tlActionButton}
                onPress={async () => {
                  // Ensure users are loaded before opening modal
                  if (allUsers.length === 0) {
                    await loadAllUsers();
                  }
                  setAssignDutyModalVisible(true);
                }}
              >
                <IconSymbol size={20} name="plus.circle.fill" color="#fff" />
                <Text style={styles.tlActionText}>Assign Duty</Text>
              </TouchableOpacity>
            </View>
          )}
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
          <Text style={styles.sectionTitle}>
            {upcomingShifts.length > 0 ? "Upcoming Shifts" : "No Upcoming Shifts"}
          </Text>
          {upcomingShifts.length > 0 ? (
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
                    {shift.status === "pending_swap" && (
                      <Text style={styles.shiftStatusBadge}>⏳ Swap Pending</Text>
                    )}
                    {shift.notes && <Text style={styles.shiftNotes}>{shift.notes}</Text>}
                  </View>
                  {shift.status === "scheduled" && shift.userEmail === userEmail && (
                    <TouchableOpacity 
                      style={styles.swapButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRequestSwap(shift);
                      }}
                    >
                      <IconSymbol size={16} name="arrow.left.arrow.right" color="#3b82f6" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol size={48} name="calendar" color="#ccc" />
              <Text style={styles.emptyStateText}>No upcoming shifts assigned</Text>
            </View>
          )}
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
                  <Text style={styles.swapShift}>Shift ID: {swap.shiftId}</Text>
                  
                  {/* TL Actions for pending swaps */}
                  {isTeamLead && swap.status === "pending" && (
                    <View style={styles.swapActions}>
                      <TouchableOpacity 
                        style={[styles.swapActionButton, styles.swapAcceptButton]}
                        onPress={() => handleSwapAction(swap, "accepted")}
                      >
                        <IconSymbol name="checkmark" size={16} color="#fff" />
                        <Text style={styles.swapActionText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.swapActionButton, styles.swapRejectButton]}
                        onPress={() => handleSwapAction(swap, "rejected")}
                      >
                        <IconSymbol name="xmark" size={16} color="#fff" />
                        <Text style={styles.swapActionText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TL: All Team Duties */}
        {isTeamLead && allDuties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Team Duties</Text>
            <View style={styles.allDutiesContainer}>
              {allDuties.map((duty) => (
                <View key={duty.id} style={styles.allDutyCard}>
                  <View style={styles.allDutyHeader}>
                    <View style={styles.allDutyUserInfo}>
                      <Text style={styles.allDutyUserName}>{duty.userName}</Text>
                      <Text style={styles.allDutyDate}>{formatDate(duty.date)}</Text>
                    </View>
                    <View style={styles.allDutyActions}>
                      <TouchableOpacity 
                        style={styles.allDutyActionButton}
                        onPress={() => handleCompleteDuty(duty.id, duty.userName)}
                      >
                        <IconSymbol size={16} name="checkmark.circle" color="#10b981" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.allDutyActionButton}
                        onPress={() => handleDeleteDuty(duty.id, duty.userName)}
                      >
                        <IconSymbol size={16} name="trash" color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.allDutyDetails}>
                    <Text style={styles.allDutyTime}>{duty.startTime} - {duty.endTime}</Text>
                    <Text style={styles.allDutyLocation}>{duty.location}</Text>
                    <View style={[styles.allDutyTypeBadge, { backgroundColor: `${getShiftTypeColor(duty.type)}20` }]}>
                      <Text style={[styles.allDutyTypeText, { color: getShiftTypeColor(duty.type) }]}>
                        {duty.type.charAt(0).toUpperCase() + duty.type.slice(1)}
                      </Text>
                    </View>
                  </View>
                  {duty.notes && <Text style={styles.allDutyNotes}>{duty.notes}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

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
                  {/* Staff can mark their own duties as done */}
                  {!isTeamLead && selectedShift.userEmail === userEmail && selectedShift.status === "scheduled" && (
                    <>
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.modalButtonSuccess]}
                        onPress={() => {
                          setModalVisible(false);
                          Alert.alert(
                            "Mark Duty as Done",
                            "Have you completed this duty?",
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Yes, Mark Done",
                                onPress: () => handleEditDuty(selectedShift.id, { status: "completed" })
                              }
                            ]
                          );
                        }}
                      >
                        <IconSymbol size={20} name="checkmark" color="#fff" />
                        <Text style={[styles.modalButtonText, { color: "#fff" }]}>Mark Done</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.modalButton, styles.modalButtonPrimary]}
                        onPress={() => {
                          setModalVisible(false);
                          handleRequestSwap(selectedShift);
                        }}
                      >
                        <IconSymbol size={20} name="arrow.left.arrow.right" color="#fff" />
                        <Text style={[styles.modalButtonText, { color: "#fff" }]}>Request Swap</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {/* TL can confirm duties */}
                  {isTeamLead && selectedShift.status === "scheduled" && (
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalButtonSuccess]}
                      onPress={() => {
                        setModalVisible(false);
                        handleCompleteDuty(selectedShift.id, selectedShift.userName);
                      }}
                    >
                      <IconSymbol size={20} name="checkmark" color="#fff" />
                      <Text style={[styles.modalButtonText, { color: "#fff" }]}>Confirm Complete</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* TL can delete duties */}
                  {isTeamLead && (
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalButtonDanger]}
                      onPress={() => {
                        setModalVisible(false);
                        handleDeleteDuty(selectedShift.id, selectedShift.userName);
                      }}
                    >
                      <IconSymbol size={20} name="trash" color="#fff" />
                      <Text style={[styles.modalButtonText, { color: "#fff" }]}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Duty Assignment Modal */}
      <Modal
        visible={assignDutyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAssignDutyModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAssignDutyModalVisible(false)}>
          <Pressable style={styles.assignModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.assignModalHeader}>
              <Text style={styles.assignModalTitle}>Assign Duty</Text>
              <TouchableOpacity onPress={() => setAssignDutyModalVisible(false)} style={styles.closeButton}>
                <IconSymbol name="xmark" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.assignModalBody}>
              {/* User Selection */}
              <View style={styles.assignFormSection}>
                <Text style={styles.assignFormLabel}>Select User</Text>
                {allUsers.length === 0 ? (
                  <View style={styles.noUsersContainer}>
                    <Text style={styles.noUsersText}>Loading users...</Text>
                  </View>
                ) : (
                  <View style={styles.userSelectionContainer}>
                    {allUsers.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.userOption,
                          selectedUser?.id === user.id && styles.userOptionSelected
                        ]}
                        onPress={() => {
                          console.log("Selected user:", user);
                          setSelectedUser(user);
                        }}
                      >
                        <Text style={styles.userOptionText}>
                          {user.firstName} {user.lastName}
                        </Text>
                        <Text style={styles.userOptionRole}>{user.role}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {selectedUser && (
                  <Text style={styles.selectedUserText}>
                    Selected: {selectedUser.firstName} {selectedUser.lastName}
                  </Text>
                )}
              </View>

              {/* Date */}
              <View style={styles.assignFormSection}>
                <Text style={styles.assignFormLabel}>Date</Text>
                <View style={styles.dateTimeContainer}>
                  <TextInput
                    style={[styles.assignFormInput, styles.dateInput]}
                    placeholder="YYYY-MM-DD"
                    value={newDuty.date}
                    onChangeText={(text) => setNewDuty({ ...newDuty, date: text })}
                  />
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => {
                      // TODO: Implement date picker
                      const today = new Date();
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const dateString = tomorrow.toISOString().split('T')[0];
                      setNewDuty({ ...newDuty, date: dateString });
                    }}
                  >
                    <IconSymbol name="calendar" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Time */}
              <View style={styles.assignFormRow}>
                <View style={styles.assignFormSection}>
                  <Text style={styles.assignFormLabel}>Start Time</Text>
                  <View style={styles.timeInputContainer}>
                    <TextInput
                      style={[styles.assignFormInput, styles.timeInput]}
                      placeholder="08:00"
                      value={newDuty.startTime}
                      onChangeText={(text) => setNewDuty({ ...newDuty, startTime: text })}
                    />
                    <TouchableOpacity 
                      style={styles.timePickerButton}
                      onPress={() => {
                        // Set common start times
                        const commonTimes = ["08:00", "09:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
                        Alert.alert(
                          "Select Start Time",
                          "Choose a common start time:",
                          commonTimes.map(time => ({
                            text: time,
                            onPress: () => setNewDuty({ ...newDuty, startTime: time })
                          }))
                        );
                      }}
                    >
                      <IconSymbol name="clock" size={16} color="#3b82f6" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.assignFormSection}>
                  <Text style={styles.assignFormLabel}>End Time</Text>
                  <View style={styles.timeInputContainer}>
                    <TextInput
                      style={[styles.assignFormInput, styles.timeInput]}
                      placeholder="16:00"
                      value={newDuty.endTime}
                      onChangeText={(text) => setNewDuty({ ...newDuty, endTime: text })}
                    />
                    <TouchableOpacity 
                      style={styles.timePickerButton}
                      onPress={() => {
                        // Set common end times
                        const commonTimes = ["12:00", "16:00", "18:00", "20:00", "22:00", "00:00"];
                        Alert.alert(
                          "Select End Time",
                          "Choose a common end time:",
                          commonTimes.map(time => ({
                            text: time,
                            onPress: () => setNewDuty({ ...newDuty, endTime: time })
                          }))
                        );
                      }}
                    >
                      <IconSymbol name="clock" size={16} color="#3b82f6" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Type */}
              <View style={styles.assignFormSection}>
                <Text style={styles.assignFormLabel}>Duty Type</Text>
                <View style={styles.typeSelectionContainer}>
                  {([
                    { value: "regular", label: "Regular", description: "Standard duty", icon: "clock" },
                    { value: "overtime", label: "Overtime", description: "Extra hours", icon: "clock.badge.exclamationmark" },
                    { value: "emergency", label: "Emergency", description: "Urgent coverage", icon: "exclamationmark.triangle" }
                  ] as const).map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeOption,
                        newDuty.type === type.value && styles.typeOptionSelected
                      ]}
                      onPress={() => setNewDuty({ ...newDuty, type: type.value as any })}
                    >
                      <IconSymbol 
                        name={type.icon} 
                        size={20} 
                        color={newDuty.type === type.value ? "#fff" : "#3b82f6"} 
                      />
                      <Text style={[
                        styles.typeOptionText,
                        newDuty.type === type.value && styles.typeOptionTextSelected
                      ]}>
                        {type.label}
                      </Text>
                      <Text style={[
                        styles.typeOptionDescription,
                        newDuty.type === type.value && styles.typeOptionDescriptionSelected
                      ]}>
                        {type.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Location */}
              <View style={styles.assignFormSection}>
                <Text style={styles.assignFormLabel}>Location</Text>
                <TextInput
                  style={styles.assignFormInput}
                  placeholder="Enter location"
                  value={newDuty.location}
                  onChangeText={(text) => setNewDuty({ ...newDuty, location: text })}
                />
              </View>

              {/* Notes */}
              <View style={styles.assignFormSection}>
                <Text style={styles.assignFormLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.assignFormInput, styles.assignFormTextArea]}
                  placeholder="Enter any additional notes"
                  value={newDuty.notes}
                  onChangeText={(text) => setNewDuty({ ...newDuty, notes: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.assignModalActions}>
              <TouchableOpacity
                style={[styles.assignModalButton, styles.assignModalButtonCancel]}
                onPress={() => setAssignDutyModalVisible(false)}
              >
                <Text style={styles.assignModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.assignModalButton, styles.assignModalButtonSubmit]}
                onPress={handleAssignDuty}
              >
                <Text style={[styles.assignModalButtonText, { color: "#fff" }]}>Assign Duty</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", paddingBottom: 100 },
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
  shiftStatusBadge: {
    fontSize: 13,
    color: "#f59e0b",
    fontWeight: "600",
    marginTop: 4,
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
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
  swapActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  swapActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  swapAcceptButton: {
    backgroundColor: "#10b981",
  },
  swapRejectButton: {
    backgroundColor: "#ef4444",
  },
  swapActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  
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
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
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
    backgroundColor: "#fff",
  },
  modalButtonPrimary: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  modalButtonSuccess: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  modalButtonDanger: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  modalButtonText: { fontSize: 16, fontWeight: "600", color: "#3b82f6" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },

  // TL Management Styles
  tlActionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  tlActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  tlActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // All Duties for TL
  allDutiesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  allDutyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  allDutyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  allDutyUserInfo: {
    flex: 1,
  },
  allDutyUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  allDutyDate: {
    fontSize: 14,
    color: "#666",
  },
  allDutyActions: {
    flexDirection: "row",
    gap: 8,
  },
  allDutyActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  allDutyDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  allDutyTime: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3b82f6",
  },
  allDutyLocation: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  allDutyTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  allDutyTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  allDutyNotes: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },

  // Assignment Modal Styles
  assignModalContent: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 16,
    maxHeight: "80%",
    minHeight: "60%",
  },
  assignModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  assignModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  assignModalBody: {
    flex: 1,
    padding: 20,
  },
  assignFormSection: {
    marginBottom: 20,
  },
  assignFormRow: {
    flexDirection: "row",
    gap: 12,
  },
  assignFormLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  assignFormInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  assignFormTextArea: {
    height: 80,
    textAlignVertical: "top",
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateInput: {
    flex: 1,
  },
  datePickerButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeInput: {
    flex: 1,
  },
  timePickerButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  userSelectionContainer: {
    gap: 8,
  },
  userOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  userOptionSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#f0f9ff",
  },
  userOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  userOptionRole: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  noUsersContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  noUsersText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  selectedUserText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f0f9ff",
    borderRadius: 6,
  },
  typeSelectionContainer: {
    flexDirection: "row",
    gap: 8,
  },
  typeOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
    gap: 8,
  },
  typeOptionSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#3b82f6",
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  typeOptionTextSelected: {
    color: "#fff",
  },
  typeOptionDescription: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  typeOptionDescriptionSelected: {
    color: "#e0f2fe",
  },
  assignModalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  assignModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  assignModalButtonCancel: {
    backgroundColor: "#f3f4f6",
  },
  assignModalButtonSubmit: {
    backgroundColor: "#3b82f6",
  },
  assignModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
})
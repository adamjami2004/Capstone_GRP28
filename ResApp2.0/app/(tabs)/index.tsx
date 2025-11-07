"use client"
import EventCard from "@/components/events/EventCard";
import EventModal from "@/components/events/EventModal";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/firebase";
import { createEvent, deleteEvent, getAllEvents, updateEvent } from "@/helpers/eventHelper";
import { Event } from "@/types/event";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const [firstName, setFirstName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchEvents();
  }, []);

  const fetchUser = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem("userEmail");
      const emailToQuery = storedEmail || auth.currentUser?.email;

      if (!emailToQuery) return;

      setUserEmail(emailToQuery);

      const usersRef = collection(db, "Users");
      const q = query(usersRef, where("Email", "==", emailToQuery));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setFirstName(userData.firstName || "User");
      } else {
        console.log("No user found with that email in Firestore");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const fetchedEvents = await getAllEvents();
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      // Don't show alert, just log - events will show as empty
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const handleCreateEvent = async (eventData: {
    title: string;
    description: string;
    category: any;
    deadline: Date;
    imageUri: string;
  }) => {
    try {
      await createEvent(eventData, userEmail);
      await fetchEvents();
      Alert.alert("Success", "Event created successfully!");
    } catch (error: any) {
      console.error("Error creating event:", error);
      
      // Provide specific error messages
      let errorMessage = "Failed to create event. ";
      if (error.message?.includes("Storage")) {
        errorMessage += "Firebase Storage needs to be enabled in your Firebase Console.";
      } else if (error.message?.includes("permission")) {
        errorMessage += "Check Firebase Storage security rules.";
      } else {
        errorMessage += error.message || "Please try again.";
      }
      
      Alert.alert("Error", errorMessage);
      throw error;
    }
  };

  const handleUpdateEvent = async (eventData: {
    title: string;
    description: string;
    category: any;
    deadline: Date;
    imageUri: string;
  }) => {
    if (!editingEvent) return;

    try {
      await updateEvent({
        id: editingEvent.id,
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        deadline: eventData.deadline,
        imageUri: eventData.imageUri !== editingEvent.imageUrl ? eventData.imageUri : undefined,
      });
      await fetchEvents();
      setEditingEvent(null);
      Alert.alert("Success", "Event updated successfully!");
    } catch (error: any) {
      console.error("Error updating event:", error);
      
      let errorMessage = "Failed to update event. ";
      if (error.message?.includes("Storage")) {
        errorMessage += "Firebase Storage needs to be enabled in your Firebase Console.";
      } else {
        errorMessage += error.message || "Please try again.";
      }
      
      Alert.alert("Error", errorMessage);
      throw error;
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    try {
      await deleteEvent(event.id, event.imageUrl);
      await fetchEvents();
      Alert.alert("Success", "Event deleted successfully!");
    } catch (error) {
      console.error("Error deleting event:", error);
      Alert.alert("Error", "Failed to delete event");
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingEvent(null);
  };

  const quickAccessItems = [
    { id: 1, title: "To-Do List", icon: "checklist", color: "#3b82f6", route: "/(tabs)/todo-list" },
    { id: 2, title: "Resources", icon: "book", color: "#f59e0b", route: "/(tabs)/resources" },
    { id: 3, title: "Room Reservations", icon: "door.left.hand.open", color: "#8b5cf6", route: "/(tabs)/reservations" },
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Decorative Circle - positioned absolutely in top right */}
      <View style={styles.decorativeCircle} />
      
      {/* Mascot Image - half in circle, half out */}
      <Image 
        source={require('@/assets/images/mascot.png')}
        style={styles.mascotImage}
        resizeMode="contain"
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{firstName || "..."}</Text>
          </View>

          {/* Quick Access - 3 Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickAccessGrid}>
              {quickAccessItems.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.quickAccessCard}
                  onPress={() => item.route && router.push(item.route as any)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                    <IconSymbol size={20} name={item.icon} color="#fff" />
                  </View>
                  <Text style={styles.quickAccessTitle}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Event Feed Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Event Feed</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setModalVisible(true)}
              >
                <IconSymbol name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading events...</Text>
              </View>
            ) : events.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="calendar.badge.exclamationmark" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No events yet</Text>
                <Text style={styles.emptySubtext}>Create your first event to get started!</Text>
              </View>
            ) : (
              <View style={styles.eventsContainer}>
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    currentUserEmail={userEmail}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Event Modal */}
      <EventModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
        editEvent={editingEvent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa",
    overflow: "hidden",
  },
  decorativeCircle: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 170,
    height: 170,
    borderRadius: 100,
    backgroundColor: "#10b981",
    zIndex: 1,
  },
  mascotImage: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 120,
    height: 120,
    zIndex: 2,
  },
  scrollView: {
    flex: 1,
    zIndex: 0,
  },
  content: { 
    paddingTop: 16,
    paddingBottom: 20,
  },
  welcomeSection: { 
    paddingHorizontal: 20, 
    paddingBottom: 16,
    marginTop: 10,
  },
  greeting: { fontSize: 14, color: "#666", marginBottom: 2 },
  name: { fontSize: 26, fontWeight: "700", color: "#000" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#000", marginBottom: 12, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: "#3b82f6",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAccessGrid: { 
    paddingHorizontal: 20, 
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickAccessCard: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  quickAccessTitle: { 
    fontSize: 12, 
    fontWeight: "600", 
    color: "#000",
    flexWrap: "wrap",
  },
  eventsContainer: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 8,
    textAlign: "center",
  },
});
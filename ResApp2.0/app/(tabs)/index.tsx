"use client"
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const [firstName, setFirstName] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem("userEmail");
        const emailToQuery = storedEmail || auth.currentUser?.email;

        if (!emailToQuery) return;

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

    fetchUser();
  }, []);
  const quickAccessItems = [
    { id: 2, title: "To-Do List", icon: "checklist", color: "#3b82f6", route: "/(tabs)/todo-list" },
    { id: 3, title: "Status", icon: "chart.bar.fill", color: "#ec4899", route: "/(tabs)/status" },
    { id: 4, title: "Time Off", icon: "clock.fill", color: "#ef4444" ,  route: "/(tabs)/timeOff"},
    { id: 5, title: "Expense Tracker", icon: "dollarsign.circle.fill", color: "#10b981", route: "/(tabs)/expense-tracker" },
    { id: 6, title: "Room Reservations", icon: "door.left.hand.open", color: "#f59e0b", route: "/(tabs)/reservations" },
    { id: 7, title: "Feedback", icon: "bubble.left.and.bubble.right.fill", color: "#6366f1", route: "/(tabs)/feedback" },
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

      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{firstName || "..."}</Text>
        </View>

        {/* Quick Access - 2x3 Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            {quickAccessItems.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.quickAccessCard}
                onPress={() => {
                  if (item.route) {
                    router.push(item.route as any);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                  <IconSymbol size={24} name={item.icon} color="#fff" />
                </View>
                <Text style={styles.quickAccessTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback Info Section */}
        <View style={styles.infoSection}>
          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => router.push("/(tabs)/feedback")}
            activeOpacity={0.7}
          >
            <IconSymbol name="info.circle.fill" size={18} color="#64748b" />
            <Text style={styles.infoText}>
              Don't hesitate to give feedback using the feedback feature
            </Text>
          </TouchableOpacity>
        </View>

        {/* Next Shift Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Shift</Text>
          <TouchableOpacity
            style={styles.shiftCard}
            onPress={() => router.push("/(tabs)/shifts")}
            activeOpacity={0.7}
          >
            <View style={[styles.shiftColorBar, { backgroundColor: "#10b981" }]} />
            <View style={styles.shiftContent}>
              <View style={styles.shiftHeader}>
                <Text style={styles.shiftDate}>Thu, Dec 19, 2025</Text>
                <View style={[styles.statusBadge, { backgroundColor: "#10b98120" }]}>
                  <Text style={[styles.statusText, { color: "#10b981" }]}>Scheduled</Text>
                </View>
              </View>
              <Text style={styles.shiftTime}>20:00 - 07:00</Text>
              <Text style={styles.shiftLocation}>📍 Rideau</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa",
    overflow: "hidden",
    paddingBottom: 100,
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
  content: { 
    flex: 1,
    zIndex: 0,
    paddingTop: 16,
  },
  welcomeSection: { 
    paddingHorizontal: 20, 
    paddingBottom: 32,
    marginTop:10,
  },
  greeting: { fontSize: 18, color: "#666", marginBottom: 4 },
  name: { fontSize: 34, fontWeight: "700", color: "#000" },
  section: { marginBottom: 20, marginTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#000", marginBottom: 12, paddingHorizontal: 20 },
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
    borderRadius: 16,
    padding: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  quickAccessTitle: { 
    fontSize: 11, 
    fontWeight: "600", 
    color: "#1f2937",
    flexWrap: "wrap",
    lineHeight: 14,
  },
  shiftCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    overflow: "hidden",
    marginHorizontal: 20,
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
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "600" },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
});
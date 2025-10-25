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
    { id: 5, title: "Duty Calendar", icon: "calendar", color: "#8b5cf6", route: "/(tabs)/calendar" },
    { id: 1, title: "To-Do List", icon: "checklist", color: "#3b82f6", route: "/(tabs)/todo-list" },
    { id: 6, title: "Protection", icon: "shield", color: "#ef4444" },
    { id: 2, title: "Deadlines", icon: "clock", color: "#ec4899" },
    { id: 3, title: "Sway", icon: "tv", color: "#10b981" },
    { id: 4, title: "Resources", icon: "book", color: "#f59e0b", route: "/(tabs)/resources" },
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

        {/* Operations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operations</Text>
          <View style={styles.operationsContainer}>
            <TouchableOpacity 
              style={styles.operationCard}
              onPress={() => router.push("/(tabs)/reservations")}
            >
              <View style={[styles.operationIcon, { backgroundColor: "#3b82f6" }]}>
                <IconSymbol size={20} name="door.left.hand.open" color="#fff" />
              </View>
              <View style={styles.operationContent}>
                <Text style={styles.operationTitle}>Room Reservation</Text>
                <Text style={styles.operationSubtitle}>Book study rooms</Text>
              </View>
              <IconSymbol size={18} name="chevron.right" color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.operationCard}>
              <View style={[styles.operationIcon, { backgroundColor: "#8b5cf6" }]}>
                <IconSymbol size={20} name="arrow.left.arrow.right" color="#fff" />
              </View>
              <View style={styles.operationContent}>
                <Text style={styles.operationTitle}>Duty Swaps</Text>
                <Text style={styles.operationSubtitle}>Exchange duty shifts</Text>
              </View>
              <IconSymbol size={18} name="chevron.right" color="#999" />
            </TouchableOpacity>
          </View>
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
    paddingBottom: 16,
    marginTop:10,
  },
  greeting: { fontSize: 14, color: "#666", marginBottom: 2 },
  name: { fontSize: 26, fontWeight: "700", color: "#000" },
  section: { marginBottom: 20 },
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
  operationsContainer: { 
    paddingHorizontal: 20, 
    gap: 10,
  },
  operationCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  operationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  operationContent: { 
    flex: 1 
  },
  operationTitle: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#000", 
    marginBottom: 2,
  },
  operationSubtitle: { 
    fontSize: 13, 
    color: "#666",
  },
});
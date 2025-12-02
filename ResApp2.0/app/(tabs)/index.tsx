"use client"
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/firebase";
import { fetchPosts, formatPostDate } from "@/helpers/feedHelper";
import { Post } from "@/types/feed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const [firstName, setFirstName] = useState<string>("");
  const [latestEvent, setLatestEvent] = useState<Post | null>(null);
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

    const fetchLatestEvent = async () => {
      try {
        const posts = await fetchPosts();
        if (posts.length > 0) {
          setLatestEvent(posts[0]);
        }
      } catch (error) {
        console.error("Error fetching latest event:", error);
      }
    };

    fetchUser();
    fetchLatestEvent();
  }, []);
  const SHAREPOINT_URL = "https://uottawa.sharepoint.com/teams/ResidenceLifeTeam2/_layouts/15/AccessDenied.aspx?Source=https%3A%2F%2Fuottawa%2Esharepoint%2Ecom%2Fteams%2FResidenceLifeTeam2%2F%5Flayouts%2F15%2Fdoc2%2Easpx%3Fsourcedoc%3D%257B58C84AFA%2DA36B%2D46E6%2DA0D2%2DA2CEA378A8CA%257D%26file%3DRideau%5F2025%2D2026%5FBuliding%2520Duty%2520Calendar%2Exlsx%26action%3Ddefault%26mobileredirect%3Dtrue&correlation=9aecdea1%2Df0e0%2Da000%2Ded06%2D1369933a2b39&Type=web&SiteId=7bbde7e7%2D94ca%2D48bf%2Db83e%2D604f7ecb6d0e";

  const quickAccessItems = [
    { id: 1, title: "Duty Calendar", icon: "calendar", color: "#8b5cf6", route: "/(tabs)/calendar" },
    { id: 2, title: "To-Do List", icon: "checklist", color: "#3b82f6", route: "/(tabs)/todo-list" },
    { id: 3, title: "Status", icon: "chart.bar.fill", color: "#ec4899", route: "/(tabs)/status" },
    { id: 4, title: "Time Off", icon: "clock.fill", color: "#ef4444" ,  route: "/(tabs)/timeOff"},
    { id: 5, title: "Sway Resources", icon: "play.tv.fill", color: "#10b981", externalUrl: SHAREPOINT_URL },
    { id: 6, title: "Room Reservations", icon: "door.left.hand.open", color: "#f59e0b", route: "/(tabs)/reservations" },
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
                  if (item.externalUrl) {
                    Linking.openURL(item.externalUrl);
                  } else if (item.route) {
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

        {/* Latest Event Section */}
        {latestEvent && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Event</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/feed")}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.eventCard}
              onPress={() => router.push("/(tabs)/feed")}
              activeOpacity={0.7}
            >
              <View style={styles.eventAccent} />
              <View style={styles.eventHeader}>
                <View style={styles.eventIconContainer}>
                  <IconSymbol name="calendar" size={20} color="#2563eb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle} numberOfLines={2}>
                    {latestEvent.title}
                  </Text>
                  <View style={styles.eventMeta}>
                    <IconSymbol name="person.fill" size={12} color="#6b7280" />
                    <Text style={styles.eventAuthor}>
                      {latestEvent.userName}
                    </Text>
                  </View>
                </View>
                {(latestEvent.likeCount || 0) > 0 && (
                  <View style={styles.likeBadge}>
                    <IconSymbol name="heart.fill" size={14} color="#ef4444" />
                    <Text style={styles.likeBadgeText}>{latestEvent.likeCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.eventDescription} numberOfLines={2}>
                {latestEvent.description}
              </Text>
              <View style={styles.eventFooter}>
                <View style={styles.eventDateBadge}>
                  <IconSymbol name="clock.fill" size={12} color="#2563eb" />
                  <Text style={styles.eventDateText}>
                    {formatPostDate(latestEvent.date)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "600",
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginHorizontal: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
  },
  eventAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#2563eb",
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    paddingBottom: 12,
  },
  eventIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 22,
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventAuthor: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  likeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fee2e2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  likeBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ef4444",
  },
  eventDescription: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  eventDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  eventDateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
  },
});
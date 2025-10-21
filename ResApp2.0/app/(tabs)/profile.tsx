import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/firebase";
import { logOut } from "@/helpers/signOutHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();

  const [userInfo, setUserInfo] = useState({
    fullName: "",
    email: "",
    position: "",
    residence: "",
  });

  function getInitials(fullName: string) {
    if (!fullName) return "";
    return fullName
      .split(" ")                 
      .map(name => name[0].toUpperCase()) 
      .join("");                  
  }

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Logout initiated...");
              
              // Clear AsyncStorage session data FIRST
              await AsyncStorage.removeItem("userEmail");
              console.log("AsyncStorage cleared");
              
              // Sign out from Firebase
              await logOut();
              console.log("Firebase sign out successful");
              
              // Small delay to ensure AsyncStorage is fully cleared
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // Clear navigation stack and navigate to landing page
              router.dismissAll();
              setTimeout(() => {
                router.replace("/");
                console.log("Navigation to landing page triggered");
              }, 100);
              
            } catch (error) {
              console.error("Logout failed:", error);
              // Show alert to user
              Alert.alert(
                "Logout Failed",
                "Unable to logout. Please try again.",
                [{ text: "OK" }]
              );
            }
          }
        }
      ]
    );
  };


  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get email from AsyncStorage first, fallback to current logged-in user
        const storedEmail = await AsyncStorage.getItem("userEmail");
        const emailToQuery = storedEmail || auth.currentUser?.email;

        if (!emailToQuery) return;

        const usersRef = collection(db, "Users");
        const q = query(usersRef, where("Email", "==", emailToQuery));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          setUserInfo({
            fullName: (data.firstName || "") + " " + (data.lastName || ""),
            email: data.email || "",
            position: data.role || "",
            residence: data.residence || "",
          });
        } else {
          console.log("No user found with that email in Firestore");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUser();
  }, []);



  const personalInfo = [
    { id: 1, label: "Full Name", value: userInfo.fullName, icon: "person" },
    { id: 2, label: "Email", value: userInfo.email, icon: "mail" },
    { id: 5, label: "Position", value: userInfo.position, icon: "table" },
    { id: 6, label: "Residence", value:userInfo.residence, icon: "house" },
    // { id: 7, label: "Floor(s)", value: userInfo.fullName, icon: "ruler" },
  ]

  const quickSettings = [
    { id: 1, title: "Edit Profile", icon: "edit", color: "#3b82f6" },
    { id: 2, title: "Notifications", icon: "notifications", color: "#10b981" },
    { id: 3, title: "Privacy", icon: "lock", color: "#8b5cf6" },
    { id: 4, title: "Help", icon: "help", color: "#f59e0b" },
  ]

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Profile Header */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(userInfo.fullName)}</Text>
            </View>
            <View style={styles.statusBadge} />
          </View>
          <Text
            style={[styles.profileName, { maxWidth: 300 }]} // or any value that fits
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {userInfo.fullName}
          </Text>
          <Text style={styles.profileRole}>{userInfo.position}</Text>

          {/* <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View> */}
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            {personalInfo.map((info, index) => (
              <View key={info.id}>
                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <View style={styles.infoIconContainer}>
                      <IconSymbol size={20} name={info.icon} color="#3b82f6" />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>{info.label}</Text>
                      <Text style={styles.infoValue}>{info.value}</Text>
                    </View>
                  </View>
                  <IconSymbol size={18} name="chevron-right" color="#ccc" />
                </View>
                {index < personalInfo.length - 1 && <View style={styles.infoDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
            testID="logout-button"
          >
            <IconSymbol size={20} name="logout" color="#ef4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  content: { flex: 1 },

  // Header Section
  headerSection: {
    backgroundColor: "#fff",
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignContent:'center'
    
  },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#8b5cf6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarText: { fontSize: 36, fontWeight: "700", color: "#fff" },
  statusBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10b981",
    borderWidth: 3,
    borderColor: "#fff",
  },
  profileName: { fontSize: 28, fontWeight: "700", color: "#000", marginBottom: 4 },
  profileRole: { fontSize: 16, color: "#666", marginBottom: 20 },

  // Stats
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "700", color: "#000", marginBottom: 4 },
  statLabel: { fontSize: 13, color: "#666" },
  statDivider: { width: 1, height: 40, backgroundColor: "#e0e0e0" },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
    paddingHorizontal: 20,
  },

  // Info Card
  infoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  infoLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 13, color: "#666", marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: "600", color: "#000" },
  infoDivider: { height: 1, backgroundColor: "#f0f0f0", marginLeft: 52 },

  // About Card
  aboutCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  aboutText: { fontSize: 15, lineHeight: 24, color: "#666" },

  // Settings Grid
  settingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  settingCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  settingTitle: { fontSize: 14, fontWeight: "600", color: "#000", textAlign: "center" },

  // Logout Button
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#fee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#ef4444" },
})

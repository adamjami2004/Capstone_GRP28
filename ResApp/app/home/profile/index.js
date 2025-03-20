// app/home/profile/index.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../config/firebase";
import { getDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        if (!auth.currentUser) {
          console.log("No authenticated user found.");
          return;
        }

        const uid = auth.currentUser.uid;
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setProfile(userSnap.data());
        } else {
          console.log("User profile not found.");
          Alert.alert("Error", "User profile not found.");
        }
      } catch (error) {
        console.log("Error fetching profile:", error);
        Alert.alert("Error", error.toString());
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleEditProfile = () => {
    router.push("/(modal)/editprofile");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      Alert.alert("Logout Error", error.toString());
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* ✅ Added green outline for selected avatar */}
        {profile?.avatar ? (
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {profile?.firstName ? profile.firstName.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
        )}
        <Text style={styles.name}>
          {profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : "Unknown User"}
        </Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={20} color="#555" />
          <Text style={styles.detailText}>{profile.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={20} color="#555" />
          <Text style={styles.detailText}>{profile.phoneNumber || "N/A"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="home-outline" size={20} color="#555" />
          <Text style={styles.detailText}>{profile.residence}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="bed-outline" size={20} color="#555" />
          <Text style={styles.detailText}>{profile.roomNumber}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

// ✅ Styles updated for the avatar outline
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3, // ✅ Added border
    borderColor: "green", // ✅ Changed outline color to green
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 40,
    color: "#fff",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
    color: "#333",
  },
  detailsContainer: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#555",
  },
  editButton: {
    backgroundColor: "#008000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#c0392b",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});


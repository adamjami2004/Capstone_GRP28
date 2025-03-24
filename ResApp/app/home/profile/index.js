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

  // Default bio text if not provided
  const defaultBio = "I really like to party on the weekends but im also very studious on exam season";

  // Prepare bio text, truncating to 400 characters if needed.
  const bioText = (() => {
    let text = (profile && profile.bio) || defaultBio;
    if (text.length > 400) {
      return text.slice(0, 400) + "...";
    }
    return text;
  })();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile?.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile?.firstName ? profile.firstName.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>
          {profile?.firstName && profile?.lastName
            ? `${profile.firstName} ${profile.lastName}`
            : "Unknown User"}
        </Text>
        {profile?.program && <Text style={styles.programText}>{profile.program}</Text>}
      </View>

      {/* Bio Label outside of the card */}
      <Text style={styles.bioLabel}>Bio:</Text>
      {/* Bio Card Section */}
      <View style={styles.bioCard}>
        <Text style={styles.bioText}>{bioText}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FC",
    padding: 20,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 10,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: "#4CAF50",
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  avatarPlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#CCC",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 48,
    color: "#FFF",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  programText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  // Bio label styling (outside of card)
  bioLabel: {
    fontSize: 16,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginLeft: "5%",
    color: "#333",
  },
  // Bio Card styling
  bioCard: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginTop: 8,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  bioText: {
    fontSize: 16,
    color: "#555",
  },
  detailsContainer: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    marginTop: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 12,
    color: "#555",
  },
  editButton: {
    backgroundColor: "#019757",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
    width: "90%",
  },
  editButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#F44336",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    width: "90%",
  },
  logoutButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

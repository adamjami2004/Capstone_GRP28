// app/home/profile.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../config/firebase";
import { getDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const uid = auth.currentUser.uid;
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile(userSnap.data());
        } else {
          Alert.alert("Error", "User profile not found.");
        }
      } catch (error) {
        Alert.alert("Error", error.toString());
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleEditProfile = () => {
    router.push("/home/profile/edit"); // Make sure you have an edit profile screen set up
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
        {profile && profile.photoURL ? (
          <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {profile && profile.firstName ? profile.firstName.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
        )}
        <Text style={styles.name}>
          {profile.firstName} {profile.lastName}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailLabel}>Email:</Text>
        <Text style={styles.detailValue}>{profile.email}</Text>

        <Text style={styles.detailLabel}>Room Number:</Text>
        <Text style={styles.detailValue}>{profile.roomNo}</Text>

        <Text style={styles.detailLabel}>Residence:</Text>
        <Text style={styles.detailValue}>{profile.residence}</Text>

        <Text style={styles.detailLabel}>Joined:</Text>
        <Text style={styles.detailValue}>
          {new Date(parseInt(profile.createdAt, 10) || profile.createdAt).toLocaleDateString()}
        </Text>
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
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
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
    marginTop: 10,
    color: "#333",
  },
  details: {
    marginBottom: 30,
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  detailValue: {
    fontSize: 18,
    color: "#000",
    fontWeight: "500",
  },
  editButton: {
    backgroundColor: "#333",
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

// app/home/profile/index.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../config/firebase";
import { getDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { defaultAvatarConfig, generateAvatarUrl } from "../../config/avatarConfig";

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

  // Use the saved avatar configuration or generate from URL
  const getAvatarSource = () => {
    if (!profile) return null;
    
    // If user has a saved avatar URL, use it directly
    if (profile.avatar) {
      return { uri: profile.avatar };
    }
    
    // If user has a saved avatar configuration, generate URL
    if (profile.avatarConfig) {
      const avatarUrl = generateAvatarUrl(profile.avatarConfig);
      return { uri: avatarUrl };
    }
    
    // Otherwise use default avatar
    const defaultConfig = {
      ...defaultAvatarConfig,
      seed: profile.firstName || "User"
    };
    return { uri: generateAvatarUrl(defaultConfig) };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#019757" />
      </SafeAreaView>
    );
  }

  const defaultBio = "Enter bio here";
  const bioText = (() => {
    let text = (profile && profile.bio) || defaultBio;
    return text.length > 400 ? text.slice(0, 400) + "..." : text;
  })();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e8f5e9" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Avatar */}
        <View style={styles.headerSection}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={getAvatarSource()} 
              style={styles.avatar}
              //defaultSource={require('../../assets/images/default-avatar.png')}
              onError={(e) => console.log("Avatar failed to load:", e.nativeEvent.error)}
            />
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={() => router.push("/(modal)/editavatar")}
            >
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.name}>
            {profile?.firstName && profile?.lastName
              ? `${profile.firstName} ${profile.lastName}`
              : "Unknown User"}
          </Text>
          {profile?.program && (
            <View style={styles.programBadge}>
              <Text style={styles.programText}>{profile.program}</Text>
            </View>
          )}
        </View>

        {/* Bio Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={22} color="#019757" />
            <Text style={styles.sectionTitle}>About Me</Text>
          </View>
          <Text style={styles.bioText}>{bioText}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={22} color="#019757" />
            <Text style={styles.sectionTitle}>Details</Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={20} color="#fff" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailText}>{profile.email}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="call-outline" size={20} color="#fff" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailText}>
                {profile.phoneNumber || "Not provided"}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="home-outline" size={20} color="#fff" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Residence</Text>
              <Text style={styles.detailText}>{profile.residence || "Not provided"}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="bed-outline" size={20} color="#fff" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Room Number</Text>
              <Text style={styles.detailText}>{profile.roomNumber || "Not provided"}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={handleEditProfile}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8f5e9",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
  },
  
  /* Header Section */
  headerSection: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 25,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#f0f0f0",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#019757",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#019757",
    marginBottom: 8,
  },
  programBadge: {
    backgroundColor: "#e0f2e9",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#019757",
  },
  programText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#019757",
  },
  
  /* Cards */
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f2e9",
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#019757",
    marginLeft: 8,
  },
  
  /* Bio */
  bioText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  
  /* Details */
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#019757",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  detailText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  
  /* Buttons */
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  editButton: {
    backgroundColor: "#019757",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#019757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  logoutButton: {
    backgroundColor: "#F44336",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#F44336",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
});
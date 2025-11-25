import { RoomSeeder } from "@/components/admin/RoomSeeder";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/firebase";
import {
  deleteProfilePicture,
  uploadProfilePicture,
} from "@/helpers/profileHelper";
import { logOut } from "@/helpers/signOutHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();

  const [userInfo, setUserInfo] = useState({
    fullName: "",
    email: "",
    position: "",
    residence: "",
    profilePictureUrl: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  function getInitials(fullName: string) {
    if (!fullName) return "";
    return fullName
      .split(" ")
      .map(name => name[0].toUpperCase())
      .join("");
  }

  const pickProfilePicture = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to upload a profile picture"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const uploadResult = await uploadProfilePicture(result.assets[0].uri);
        
        if (uploadResult.success && uploadResult.url) {
          setUserInfo((prev) => ({ ...prev, profilePictureUrl: uploadResult.url || "" }));
          Alert.alert("Success", "Profile picture updated successfully!");
        } else {
          Alert.alert("Error", uploadResult.error || "Failed to upload profile picture");
        }
        setUploadingImage(false);
      }
    } catch (error) {
      console.error("Error picking profile picture:", error);
      Alert.alert("Error", "Failed to pick image");
      setUploadingImage(false);
    }
  };

  const handleRemoveProfilePicture = () => {
    Alert.alert(
      "Remove Profile Picture",
      "Are you sure you want to remove your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setUploadingImage(true);
            const result = await deleteProfilePicture();
            if (result.success) {
              setUserInfo((prev) => ({ ...prev, profilePictureUrl: "" }));
              Alert.alert("Success", "Profile picture removed successfully!");
            } else {
              Alert.alert("Error", result.error || "Failed to remove profile picture");
            }
            setUploadingImage(false);
          },
        },
      ]
    );
  };

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
              await AsyncStorage.removeItem("userEmail");
              await logOut();
              await new Promise(resolve => setTimeout(resolve, 300));
              router.replace("/login");
            } catch (error) {
              console.error("Logout failed:", error);
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
            profilePictureUrl: data.profilePicture || data.profilePictureUrl || "",
          });
          setIsAdmin(data.role === "Admin" || data.role === "Super Admin");
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
    { id: 6, label: "Residence", value: userInfo.residence, icon: "house" },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={pickProfilePicture} disabled={uploadingImage}>
            <View style={styles.avatar}>
              {uploadingImage ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : userInfo.profilePictureUrl ? (
                <Image
                  source={{ uri: userInfo.profilePictureUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>{getInitials(userInfo.fullName)}</Text>
              )}
            </View>
            <View style={styles.editBadge}>
              <IconSymbol name="camera.fill" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.statusBadge} />
        </View>
        {userInfo.profilePictureUrl && !uploadingImage && (
          <TouchableOpacity
            style={styles.removePhotoButton}
            onPress={handleRemoveProfilePicture}
          >
            <Text style={styles.removePhotoText}>Remove Photo</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.profileName} numberOfLines={1} ellipsizeMode="tail">
          {userInfo.fullName}
        </Text>
        <Text style={styles.profileRole}>{userInfo.position}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          {personalInfo.map((info, index) => (
            <View key={info.id}>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={styles.infoIconContainer}>
                    <IconSymbol size={18} name={info.icon} color="#3b82f6" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>{info.label}</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>{info.value}</Text>
                  </View>
                </View>
              </View>
              {index < personalInfo.length - 1 && <View style={styles.infoDivider} />}
            </View>
          ))}
        </View>
      </View>

      {/* {isAdmin && (
        <View style={styles.adminSection}>
          <RoomSeeder />
        </View>
      )} */}

      <View style={styles.bottomSection}>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingBottom: 120,
  },
  headerSection: {
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#8b5cf6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff"
  },
  editBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#fff",
  },
  removePhotoButton: {
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
  },
  removePhotoText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "600",
  },
  statusBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#10b981",
    borderWidth: 3,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
    maxWidth: 300,
  },
  profileRole: {
    fontSize: 14,
    color: "#666"
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoCard: {
    backgroundColor: "#fff",
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
    paddingVertical: 10,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000"
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginLeft: 48
  },
  adminSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#fee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444"
  },
});
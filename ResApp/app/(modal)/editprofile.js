// app/(modal)/editprofile.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../config/firebase";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

export default function EditProfile() {
  const router = useRouter();

  // State variables to store user profile details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [residence, setResidence] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);

  // Pulls the user's profile data from Firestore whenever the component mounts
  useEffect(() => {
    async function fetchProfile() {
      try {
        if (!auth.currentUser) {
          console.log("No user is currently logged in.");
          return;
        }

        const uid = auth.currentUser.uid;
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setEmail(data.email || "");
          setPhoneNumber(data.phoneNumber || "");
          setResidence(data.residence || "");
          setRoomNo(data.roomNumber || "");
          setAvatar(data.avatar || "");
          setBio(data.bio || "");
        } else {
          console.log("Profile document was not found in Firestore.");
          Alert.alert("Error", "User profile not found.");
        }
      } catch (error) {
        console.log("Problem fetching user data:", error);
        Alert.alert("Error", error.toString());
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  // Writes the updated profile info (excluding avatar) to Firestore
  const handleSaveChanges = async () => {
    try {
      if (!auth.currentUser) return;

      const uid = auth.currentUser.uid;
      const userRef = doc(db, "users", uid);

      await updateDoc(userRef, {
        firstName,
        lastName,
        email,
        phoneNumber,
        bio,
      });

      Alert.alert("Success", "Profile updated successfully.");
      router.push("/home/profile");
    } catch (error) {
      Alert.alert("Error", error.toString());
    }
  };

  // If the user wants to discard changes, go back to the profile screen
  const handleCancel = () => {
    router.push("/home/profile");
  };

  // Displays a simple loading screen if the data is still being retrieved
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>

        {/* Display the user's current avatar if it exists */}
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <Text>No avatar set</Text>
        )}

        {/* Tapping this button opens a separate modal to change the avatar */}
        <TouchableOpacity
          style={styles.editAvatarButton}
          onPress={() => router.push("/(modal)/editavatar")}
        >
          <Text style={styles.editAvatarButtonText}>Change Avatar</Text>
        </TouchableOpacity>

        {/* User can update first name here */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#555" />
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First Name"
          />
        </View>

        {/* User can update last name here */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#555" />
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last Name"
          />
        </View>

        {/* Email can be edited if needed */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#555" />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
          />
        </View>

        {/* Phone number can be changed here */}
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color="#555" />
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Phone Number"
            keyboardType="phone-pad"
          />
        </View>

        {/* Residence and room number are locked down, so they're disabled */}
        <View style={styles.inputContainer}>
          <Ionicons name="home-outline" size={20} color="#555" />
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={residence}
            editable={false}
            placeholder="Residence"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="bed-outline" size={20} color="#555" />
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={roomNo}
            editable={false}
            placeholder="Room Number"
          />
        </View>

        {/* A quick text field for the user's personal bio */}
        <View style={styles.bioInputContainer}>
          <Text style={styles.bioLabel}>Bio:</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Enter your bio (max 250 characters)"
            multiline={true}
            maxLength={250}
          />
        </View>

        {/* Confirm or discard changes */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Updated styles with a more human-coded vibe
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 10,
  },
  editAvatarButton: {
    backgroundColor: "#019757",
    padding: 10,
    borderRadius: 5,
    alignSelf: "center",
    marginBottom: 15,
  },
  editAvatarButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  disabledInput: {
    color: "#999",
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  bioInputContainer: {
    marginBottom: 10,
  },
  bioLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  bioInput: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    color: "#333",
    textAlignVertical: "top",
    height: 100,
  },
  saveButton: {
    backgroundColor: "#019757",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#c0392b",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

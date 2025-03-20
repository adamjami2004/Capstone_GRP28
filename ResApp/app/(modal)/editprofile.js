// app/home/profile/editprofile.js
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../config/firebase";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import AvatarSelector from "../../components/ui/AvatarSelector";
import { Ionicons } from "@expo/vector-icons";

export default function EditProfile() {
  const router = useRouter();

  // State variables to store user information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [residence, setResidence] = useState("");
  const [roomNo, setRoomNo] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch user profile data from Firebase Firestore
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
          const data = userSnap.data();
          // Populate the state with user data
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setEmail(data.email || "");
          setPhoneNumber(data.phoneNumber || "");
          setResidence(data.residence || "");
          setRoomNo(data.roomNumber || "");
          setAvatar(data.avatar || "");
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

  // Save the updated user profile data to Firebase
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
        avatar, // Save avatar selection
      });

      Alert.alert("Success", "Profile updated successfully.");
      router.push("/home/profile"); // Navigate back to profile page after saving
    } catch (error) {
      Alert.alert("Error", error.toString());
    }
  };

  // Cancel and return to profile page without saving
  const handleCancel = () => {
    router.push("/home/profile");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      
      {/* Avatar Selection Component */}
      <AvatarSelector selectedAvatar={avatar} onSelect={setAvatar} />

      {/* First Name Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#555" />
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First Name" />
      </View>

      {/* Last Name Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#555" />
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last Name" />
      </View>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#555" />
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
      </View>

      {/* Phone Number Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="call-outline" size={20} color="#555" />
        <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Phone Number" keyboardType="phone-pad" />
      </View>

      {/* Residence (Non-Editable) */}
      <View style={styles.inputContainer}>
        <Ionicons name="home-outline" size={20} color="#555" />
        <TextInput style={[styles.input, styles.disabledInput]} value={residence} editable={false} placeholder="Residence" />
      </View>

      {/* Room Number (Non-Editable) */}
      <View style={styles.inputContainer}>
        <Ionicons name="bed-outline" size={20} color="#555" />
        <TextInput style={[styles.input, styles.disabledInput]} value={roomNo} editable={false} placeholder="Room Number" />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
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
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  disabledInput: {
    color: "#999",
  },
  saveButton: {
    backgroundColor: "#008000",
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
    backgroundColor: "#c0392b", // Styled to match the logout button
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});


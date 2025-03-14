import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useRouter } from "expo-router";
import { signUp } from "../services/authService";
import { createUserProfile } from "../services/userService";
import { SignUpContext } from "../context/SignUpContext";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function SignUpStep2() {
  const router = useRouter();
  const { signUpData } = useContext(SignUpContext);
  const { email, password } = signUpData;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roomNo, setRoomNo] = useState("");

  // Dropdown states for residences
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResidences() {
      try {
        const residencesCol = collection(db, "residences");
        const residencesSnapshot = await getDocs(residencesCol);
        const residencesData = residencesSnapshot.docs.map((doc) => ({
          label: doc.data().name,
          value: doc.data().name,
        }));
        setItems(residencesData);
        if (residencesData.length > 0) {
          setValue(residencesData[0].value);
        }
      } catch (error) {
        console.error("Error fetching residences: ", error);
      } finally {
        setLoading(false);
      }
    }
    fetchResidences();
  }, []);

  const handleSignUp = async () => {
    if (!firstName || !lastName || !roomNo || !value) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }
    try {
      const user = await signUp(email, password);
      await updateProfile(user, { displayName: `${firstName} ${lastName}` });
      await createUserProfile(user.uid, {
        firstName,
        lastName,
        roomNo,
        residence: value,
        email,
        createdAt: new Date().toISOString(),
      });
      router.replace("/home");
    } catch (error) {
      Alert.alert("Sign Up Failed", error.toString());
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up - Step 2</Text>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        placeholderTextColor="#666"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        placeholderTextColor="#666"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="Room Number"
        placeholderTextColor="#666"
        value={roomNo}
        onChangeText={setRoomNo}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#333" style={{ marginBottom: 15 }} />
      ) : (
        <DropDownPicker
          open={open}
          value={value}
          items={items}
          setOpen={setOpen}
          setValue={setValue}
          setItems={setItems}
          containerStyle={styles.dropdownContainer}
          style={styles.dropdown}
          textStyle={styles.dropdownText}
          dropDownContainerStyle={styles.dropdownList}
          placeholder="Select Residence"
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    padding: 20, 
    backgroundColor: "#fff" 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 20, 
    textAlign: "center", 
    color: "#000" 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#f9f9f9",
  },
  dropdownContainer: {
    marginBottom: 15,
    zIndex: 1000, // to ensure the dropdown renders over other elements
  },
  dropdown: {
    borderColor: "#ccc",
    backgroundColor: "#f9f9f9",
  },
  dropdownText: {
    color: "#000",
  },
  dropdownList: {
    borderColor: "#ccc",
    backgroundColor: "#f9f9f9",
  },
  button: { 
    backgroundColor: "#333", 
    padding: 15, 
    borderRadius: 8, 
    alignItems: "center", 
    marginTop: 10 
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16 
  },
});

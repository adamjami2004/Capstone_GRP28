// app/(modal)/editavatar.js
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../config/firebase";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import AvatarSelector from "../../components/ui/AvatarSelector";

// Default avatar configuration used to generate the URL preview
// (This is still used by AvatarSelector to display the current avatar.)
const defaultAvatarConfig = {
  seed: "Chase",
  backgroundType: "circle",
  backgroundColor: "ffffff",
  accessories: "none",
  accessoriesColor: "black",
  clothes: "shirt01",
  clothingColor: "blue",
  eyebrows: "default",
  eyes: "default",
  facialHair: "none",
  facialHairColor: "black",
  hairColor: "brown",
  mouth: "smile",
  nose: "default",
  skinColor: "light",
  top: "NoHair", // This value will change based on the hairstyle selected manually
};

// Helper function to build a DiceBear Avataaars URL from the config.
// (We're using the older API endpoint here for simplicity.)
function generateAvatarUrl(config) {
  const params = new URLSearchParams(config).toString();
  return `https://avatars.dicebear.com/api/avataaars/${config.seed}.svg?${params}`;
}

/* 
  SelectHairstyleModal:
  This sub-modal displays a grid of hairstyle options using local images.
  When a user taps one option, it calls onSelect with the chosen key.
*/
function SelectHairstyleModal({ currentHairstyle, onSelect, onClose }) {
  // Define your hairstyle options manually.
  // Ensure the require paths are correct relative to this file.
  const hairstyleOptions = [
    {
      key: "NoHair",
      label: "No Hair",
      image: require("../../assets/images/hair/top-short1.png"),
    },
    // Uncomment and add more options as you have them:
    // {
    //   key: "Hat",
    //   label: "Hat",
    //   image: require("../../assets/images/hair/Hat.png"),
    // },
    // {
    //   key: "Hijab",
    //   label: "Hijab",
    //   image: require("../../assets/images/hair/Hijab.png"),
    // },
    // {
    //   key: "Turban",
    //   label: "Turban",
    //   image: require("../../assets/images/hair/Turban.png"),
    // },
  ];

  const renderItem = ({ item }) => {
    const isSelected = item.key === currentHairstyle;
    return (
      <TouchableOpacity
        style={[stylesH.itemContainer, isSelected && stylesH.itemSelected]}
        onPress={() => onSelect(item.key)}
      >
        <Image source={item.image} style={stylesH.itemImage} />
        <Text style={stylesH.itemLabel}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={stylesH.modalContainer}>
      <View style={stylesH.header}>
        <Text style={stylesH.headerTitle}>Select Hairstyle</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={stylesH.closeButton}>×</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={hairstyleOptions}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        numColumns={2}
        contentContainerStyle={stylesH.listContainer}
      />
    </View>
  );
}

// Styling for the sub-modal
const stylesH = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 28,
    fontWeight: "bold",
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  itemContainer: {
    flex: 1,
    margin: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    alignItems: "center",
    padding: 10,
  },
  itemSelected: {
    borderWidth: 2,
    borderColor: "#019757",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
  },
  itemLabel: {
    fontSize: 14,
    color: "#333",
  },
});

// --------------------
// Main EditAvatarModal Component
// --------------------
export default function EditAvatarModal() {
  const router = useRouter();

  // State for the avatar URL (used by AvatarSelector)
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // Local state for avatar configuration (which affects URL generation)
  const [avatarConfig, setAvatarConfig] = useState(defaultAvatarConfig);

  // Controls visibility of the hairstyle selection modal
  const [showHairstyleModal, setShowHairstyleModal] = useState(false);

  // Fetch the user's current avatar from Firestore when the component mounts
  useEffect(() => {
    async function fetchAvatar() {
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
          setAvatarUrl(data.avatar || "");
          // You could parse a stored config here if available.
        } else {
          console.log("User profile not found.");
          Alert.alert("Error", "User profile not found.");
        }
      } catch (error) {
        console.log("Error fetching avatar:", error);
        Alert.alert("Error", error.toString());
      } finally {
        setLoading(false);
      }
    }
    fetchAvatar();
  }, []);

  // Whenever the avatar configuration changes, update the avatar URL
  useEffect(() => {
    const newUrl = generateAvatarUrl(avatarConfig);
    setAvatarUrl(newUrl);
  }, [avatarConfig]);

  // Save the new avatar URL to Firestore and then navigate back
  const handleSaveAndGoBack = async () => {
    try {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { avatar: avatarUrl });
      Alert.alert("Success", "Avatar updated successfully.");
      router.back();
    } catch (error) {
      Alert.alert("Error", error.toString());
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading avatar...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.title}>Customize Your Avatar</Text>
          <Text style={styles.subtitle}>Current Avatar:</Text>
          <AvatarSelector selectedAvatar={avatarUrl} onSelect={setAvatarUrl} />

          {/* Button to open the hairstyle modal */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setShowHairstyleModal(true)}
          >
            <Text style={styles.optionButtonText}>Hairstyle</Text>
            <Text style={styles.optionButtonArrow}>&gt;</Text>
          </TouchableOpacity>

          {/* You can add more option buttons for other features here */}
        </ScrollView>

        {/* Fixed footer with Save/Cancel buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndGoBack}>
            <Text style={styles.saveButtonText}>Save & Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Hairstyle selection modal */}
      <Modal
        visible={showHairstyleModal}
        animationType="slide"
        onRequestClose={() => setShowHairstyleModal(false)}
      >
        <SelectHairstyleModal
          currentHairstyle={avatarConfig.top}
          onSelect={(selectedKey) => {
            setAvatarConfig({ ...avatarConfig, top: selectedKey });
            setShowHairstyleModal(false);
          }}
          onClose={() => setShowHairstyleModal(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

// Styles with human-friendly comments
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Semi-transparent background for a modal feel
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120, // Extra padding so nothing gets hidden by the footer
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#333",
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "stretch",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  optionButtonText: {
    fontSize: 16,
    color: "#333",
  },
  optionButtonArrow: {
    fontSize: 20,
    color: "#333",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#fff",
    justifyContent: "space-around",
  },
  saveButton: {
    backgroundColor: "#019757",
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#c0392b",
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

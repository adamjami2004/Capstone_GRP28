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
  ActivityIndicator,
  StatusBar,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../config/firebase";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import {
  defaultAvatarConfig,
  avatarOptions,
  featureLabels,
  generateAvatarUrl,
  extractConfigFromUrl,
  generateRandomAvatar,
} from "../config/avatarConfig";

export default function EditAvatarModal() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState(defaultAvatarConfig);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(null);

  // Fetch user's avatar configuration from Firestore
  useEffect(() => {
    async function fetchAvatarConfig() {
      try {
        if (!auth.currentUser) {
          console.log("No authenticated user found.");
          return;
        }
        
        const uid = auth.currentUser.uid;
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          // If user has avatarConfig stored, use it
          if (userData.avatarConfig) {
            setAvatarConfig(userData.avatarConfig);
          } 
          // If user has avatar URL but no config, extract config from URL
          else if (userData.avatar) {
            const extractedConfig = extractConfigFromUrl(userData.avatar);
            setAvatarConfig(extractedConfig);
          }
          // Otherwise use default config
          else {
            // Use user's name as seed if available
            if (userData.firstName || userData.lastName) {
              const nameSeed = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
              setAvatarConfig({
                ...defaultAvatarConfig,
                seed: nameSeed
              });
            }
          }
        } else {
          console.log("User profile not found.");
          Alert.alert("Error", "User profile not found.");
        }
      } catch (error) {
        console.log("Error fetching avatar config:", error);
        Alert.alert("Error", error.toString());
      } finally {
        setLoading(false);
      }
    }
    
    fetchAvatarConfig();
  }, []);

  // Open modal for specific feature customization
  const openFeatureModal = (feature) => {
    setCurrentFeature(feature);
    setModalVisible(true);
  };
  
  // Update feature and close modal
  const selectFeatureOption = (option) => {
    if (currentFeature) {
      const updatedConfig = { ...avatarConfig, [currentFeature]: option };
      setAvatarConfig(updatedConfig);
    }
    setModalVisible(false);
  };

  // Generate a random avatar
  const handleRandomize = () => {
    const randomConfig = generateRandomAvatar();
    setAvatarConfig(randomConfig);
  };

  // Save avatar configuration to Firestore
  const handleSaveAndGoBack = async () => {
    try {
      setSaving(true);
      
      if (!auth.currentUser) return;
      
      const uid = auth.currentUser.uid;
      const userRef = doc(db, "users", uid);
      
      // Generate avatar URL from config
      const avatarUrl = generateAvatarUrl(avatarConfig);
      
      // Save both the avatar URL and the complete configuration
      await updateDoc(userRef, {
        avatar: avatarUrl,
        avatarConfig: avatarConfig
      });
      
      Alert.alert("Success", "Avatar updated successfully.");
      router.back();
    } catch (error) {
      console.log("Error saving avatar:", error);
      Alert.alert("Error", error.toString());
    } finally {
      setSaving(false);
    }
  };

  // Render a feature option in the modal
  const renderFeatureOption = ({ item }) => {
    const isSelected = avatarConfig[currentFeature] === item;
    
    // Create a preview config with just this option changed
    const previewConfig = { ...avatarConfig, [currentFeature]: item };
    const previewUrl = generateAvatarUrl(previewConfig);
    
    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          isSelected && styles.selectedOption
        ]}
        onPress={() => selectFeatureOption(item)}
      >
        <View style={styles.optionPreviewContainer}>
          <Image 
            source={{ uri: previewUrl }} 
            style={styles.optionPreview}
          />
        </View>
        <Text style={[
          styles.optionText,
          isSelected && styles.selectedOptionText
        ]}>
          {item.replace(/([A-Z])/g, ' $1').trim()}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#019757" />
      </SafeAreaView>
    );
  }

  // Generate avatar URL from current config
  const avatarUrl = generateAvatarUrl(avatarConfig);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#e8f5e9" />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#019757" />
        </TouchableOpacity>
        <Text style={styles.title}>Customize Avatar</Text>
        <View style={styles.backButton} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Avatar Preview */}
          <View style={styles.avatarPreview}>
            <Image 
              source={{ uri: avatarUrl }} 
              style={styles.avatar}
              onError={(e) => console.log("Avatar failed to load:", e.nativeEvent.error)}
            />
            
            <TouchableOpacity 
              style={styles.randomizeButton}
              onPress={handleRandomize}
            >
              <Ionicons name="shuffle" size={18} color="#fff" />
              <Text style={styles.randomizeText}>Randomize</Text>
            </TouchableOpacity>
          </View>
          
          {/* Feature Selection */}
          <Text style={styles.sectionTitle}>Customize Features</Text>
          <View style={styles.featuresContainer}>
            {Object.keys(featureLabels).map((feature) => (
              <TouchableOpacity
                key={feature}
                style={styles.featureButton}
                onPress={() => openFeatureModal(feature)}
              >
                <Text style={styles.featureButtonText}>{featureLabels[feature]}</Text>
                <View style={styles.featureValueContainer}>
                  <Text style={styles.featureValueText}>
                    {avatarConfig[feature]?.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#019757" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSaveAndGoBack}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.saveButtonText}>Save Avatar</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => router.back()}
          disabled={saving}
        >
          <Ionicons name="close-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      
      {/* Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {currentFeature ? featureLabels[currentFeature] : ""}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={currentFeature ? avatarOptions[currentFeature] : []}
              renderItem={renderFeatureOption}
              keyExtractor={(item) => item}
              numColumns={2}
              contentContainerStyle={styles.optionsContainer}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#e8f5e9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#d0e8d0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#019757",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarPreview: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: "#fff",
    marginBottom: 16,
    backgroundColor: "#f0f0f0",
  },
  randomizeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#019757",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  randomizeText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  featuresContainer: {
    width: "100%",
  },
  featureButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  featureButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  featureValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureValueText: {
    fontSize: 14,
    color: "#666",
    marginRight: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#d0e8d0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#019757",
    borderRadius: 12,
    paddingVertical: 14,
    marginRight: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#019757",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F44336",
    borderRadius: 12,
    paddingVertical: 14,
    marginLeft: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#F44336",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  optionsContainer: {
    padding: 12,
  },
  optionItem: {
    flex: 1,
    alignItems: "center",
    margin: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f7f7f7",
    maxWidth: "45%",
  },
  selectedOption: {
    borderColor: "#019757",
    borderWidth: 2,
    backgroundColor: "#e6f7ef",
  },
  optionPreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    marginBottom: 8,
  },
  optionPreview: {
    width: "100%",
    height: "100%",
  },
  optionText: {
    fontSize: 12,
    textAlign: "center",
    color: "#555",
  },
  selectedOptionText: {
    color: "#019757",
    fontWeight: "600",
  },
});
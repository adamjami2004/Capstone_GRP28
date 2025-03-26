import React, { useState, useEffect } from "react";
import { 
  View, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ScrollView, 
  Modal,
  FlatList,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { 
  defaultAvatarConfig, 
  avatarOptions, 
  featureLabels, 
  generateAvatarUrl, 
  extractConfigFromUrl,
  generateRandomAvatar
} from "../../app/config/avatarConfig";

export default function AvatarSelector({ selectedAvatar, onSelect }) {
  // Parse the existing avatar URL or use default config
  const [avatarConfig, setAvatarConfig] = useState(defaultAvatarConfig);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Update avatarConfig when selectedAvatar changes
  useEffect(() => {
    if (selectedAvatar) {
      try {
        const parsedConfig = extractConfigFromUrl(selectedAvatar);
        setAvatarConfig(parsedConfig);
        setImageError(false);
      } catch (error) {
        console.error("Error processing avatar URL:", error);
        setAvatarConfig(defaultAvatarConfig);
      }
    }
  }, [selectedAvatar]);

  // Generate the current avatar URL
  const avatarUrl = generateAvatarUrl(avatarConfig);
  
  // Open modal for specific feature customization
  const openFeatureModal = (feature) => {
    setCurrentFeature(feature);
    setModalVisible(true);
  };
  
  // Update feature and close modal
  const selectFeatureOption = (option) => {
    setLoading(true);
    if (currentFeature) {
      const updatedConfig = { ...avatarConfig, [currentFeature]: option };
      setAvatarConfig(updatedConfig);
      
      // Call the onSelect callback with the new URL
      if (onSelect) {
        const newUrl = generateAvatarUrl(updatedConfig);
        onSelect(newUrl);
      }
    }
    setLoading(false);
    setModalVisible(false);
  };

  // Generate a random avatar
  const handleRandomize = () => {
    setLoading(true);
    const randomConfig = generateRandomAvatar();
    setAvatarConfig(randomConfig);
    
    if (onSelect) {
      const newUrl = generateAvatarUrl(randomConfig);
      onSelect(newUrl);
    }
    setLoading(false);
  };

  // Handle image loading error
  const handleImageError = () => {
    console.log("Avatar image failed to load:", avatarUrl);
    setImageError(true);
    
    // If there's an error, try to use a simpler default avatar
    if (onSelect && imageError) {
      const fallbackUrl = `https://ui-avatars.com/api/?name=${avatarConfig.seed || 'User'}&background=019757&color=fff&size=150`;
      onSelect(fallbackUrl);
    }
  };

  // Render a feature option in the modal
  const renderFeatureOption = ({ item }) => {
    const isSelected = avatarConfig[currentFeature] === item;
    
    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          isSelected && styles.selectedOption
        ]}
        onPress={() => selectFeatureOption(item)}
      >
        <View style={styles.optionPreviewContainer}>
          <Text style={styles.optionPreviewText}>
            {item.charAt(0)}
          </Text>
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

  return (
    <View style={styles.container}>
      {/* Avatar Preview */}
      <View style={styles.previewContainer}>
        <View style={styles.avatarContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#019757" />
          ) : (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              onError={handleImageError}
            />
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.randomizeButton}
          onPress={handleRandomize}
        >
          <Ionicons name="shuffle" size={18} color="#fff" />
          <Text style={styles.randomizeText}>Randomize</Text>
        </TouchableOpacity>
      </View>
      
      {/* Feature Selection Buttons */}
      <View style={styles.featuresContainer}>
        <Text style={styles.sectionTitle}>Customize Your Avatar</Text>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.featureButtonsContainer}
        >
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
        </ScrollView>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: "#019757",
    backgroundColor: "#f7f7f7",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
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
  featuresContainer: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  featureButtonsContainer: {
    paddingBottom: 20,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#019757",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  optionPreviewText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
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
import React, { useState, useEffect } from "react";
import { View, Image, StyleSheet, TouchableOpacity, Text, ScrollView, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Default avatar configuration
const defaultAvatarConfig = {
  seed: "Chase",
  topType: "ShortHairShortFlat",
  clotheType: "ShirtCrewNeck",
  eyebrowType: "Default",
  eyeType: "Default",
  facialHairType: "Blank",
  mouthType: "Smile",
  skinColor: "light",
  hairColor: "Brown",
  facialHairColor: "Black",
  clothesColor: "Blue",
};

// Available options for each customizable feature
const avatarOptions = {
  topType: [
    "NoHair", "Eyepatch", "Hat", "Hijab", "Turban", "WinterHat1", "WinterHat2", "WinterHat3", "WinterHat4",
    "LongHairBigHair", "LongHairBob", "LongHairBun", "LongHairCurly", "LongHairCurvy", "LongHairDreads",
    "LongHairFrida", "LongHairFro", "LongHairFroBand", "LongHairNotTooLong", "LongHairShavedSides",
    "LongHairMiaWallace", "LongHairStraight", "LongHairStraight2", "LongHairStraightStrand",
    "ShortHairDreads01", "ShortHairDreads02", "ShortHairFrizzle", "ShortHairShaggyMullet", 
    "ShortHairShortCurly", "ShortHairShortFlat", "ShortHairShortRound", "ShortHairShortWaved", 
    "ShortHairSides", "ShortHairTheCaesar", "ShortHairTheCaesarSidePart"
  ],
  clotheType: [
    "BlazerShirt", "BlazerSweater", "CollarSweater", "GraphicShirt", "Hoodie", "Overall", 
    "ShirtCrewNeck", "ShirtScoopNeck", "ShirtVNeck"
  ],
  eyebrowType: [
    "Angry", "AngryNatural", "Default", "DefaultNatural", "FlatNatural", "RaisedExcited", 
    "RaisedExcitedNatural", "SadConcerned", "SadConcernedNatural", "UnibrowNatural", "UpDown", "UpDownNatural"
  ],
  eyeType: [
    "Close", "Cry", "Default", "Dizzy", "EyeRoll", "Happy", "Hearts", "Side", "Squint", "Surprised", "Wink", "WinkWacky"
  ],
  facialHairType: [
    "Blank", "BeardMedium", "BeardLight", "BeardMajestic", "MoustacheFancy", "MoustacheMagnum"
  ],
  mouthType: [
    "Concerned", "Default", "Disbelief", "Eating", "Grimace", "Sad", "ScreamOpen", "Serious", 
    "Smile", "Tongue", "Twinkle", "Vomit"
  ],
  skinColor: [
    "light", "yellow", "pale", "tanned", "brown", "darkBrown", "black"
  ],
  hairColor: [
    "Auburn", "Black", "Blonde", "BlondeGolden", "Brown", "BrownDark", "PastelPink", 
    "Platinum", "Red", "SilverGray"
  ],
  facialHairColor: [
    "Auburn", "Black", "Blonde", "BlondeGolden", "Brown", "BrownDark", "Platinum", "Red"
  ],
  clothesColor: [
    "Black", "Blue01", "Blue02", "Blue03", "Gray01", "Gray02", "Heather", "PastelBlue", 
    "PastelGreen", "PastelOrange", "PastelRed", "PastelYellow", "Pink", "Red", "White"
  ]
};

// Helper function to generate DiceBear avatar URL from config
function generateAvatarUrl(config) {
  let paramString = `seed=${config.seed}`;
  
  if (config.topType) paramString += `&topType=${config.topType}`;
  if (config.clotheType) paramString += `&clotheType=${config.clotheType}`;
  if (config.eyebrowType) paramString += `&eyebrowType=${config.eyebrowType}`;
  if (config.eyeType) paramString += `&eyeType=${config.eyeType}`;
  if (config.facialHairType) paramString += `&facialHairType=${config.facialHairType}`;
  if (config.mouthType) paramString += `&mouthType=${config.mouthType}`;
  if (config.skinColor) paramString += `&skinColor=${config.skinColor}`;
  if (config.hairColor) paramString += `&hairColor=${config.hairColor}`;
  if (config.facialHairColor) paramString += `&facialHairColor=${config.facialHairColor}`;
  if (config.clothesColor) paramString += `&clothesColor=${config.clothesColor}`;
  
  return `https://api.dicebear.com/7.x/avataaars/png?${paramString}`;
}

// Helper function to extract config from an existing avatar URL
function extractConfigFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    // Start with default config
    const extractedConfig = {...defaultAvatarConfig};
    
    // Override with parameters from URL
    if (params.get('seed')) extractedConfig.seed = params.get('seed');
    if (params.get('skinColor')) extractedConfig.skinColor = params.get('skinColor');
    if (params.get('topType')) extractedConfig.topType = params.get('topType');
    if (params.get('clotheType')) extractedConfig.clotheType = params.get('clotheType');
    if (params.get('eyebrowType')) extractedConfig.eyebrowType = params.get('eyebrowType');
    if (params.get('eyeType')) extractedConfig.eyeType = params.get('eyeType');
    if (params.get('facialHairType')) extractedConfig.facialHairType = params.get('facialHairType');
    if (params.get('mouthType')) extractedConfig.mouthType = params.get('mouthType');
    if (params.get('hairColor')) extractedConfig.hairColor = params.get('hairColor');
    if (params.get('facialHairColor')) extractedConfig.facialHairColor = params.get('facialHairColor');
    if (params.get('clothesColor')) extractedConfig.clothesColor = params.get('clothesColor');
    
    return extractedConfig;
  } catch (error) {
    console.log("Error parsing avatar URL:", error);
    return defaultAvatarConfig;
  }
}

// Define user-friendly feature names
const featureLabels = {
  topType: "Hairstyle",
  clotheType: "Clothes",
  eyebrowType: "Eyebrows",
  eyeType: "Eyes",
  facialHairType: "Facial Hair",
  mouthType: "Mouth",
  skinColor: "Skin Tone",
  hairColor: "Hair Color",
  facialHairColor: "Facial Hair Color",
  clothesColor: "Clothes Color"
};

export default function AvatarSelector({ selectedAvatar, onSelect }) {
  // Parse the existing avatar URL or use default config
  const [avatarConfig, setAvatarConfig] = useState(defaultAvatarConfig);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(null);
  
  // Update avatarConfig when selectedAvatar changes
  useEffect(() => {
    if (selectedAvatar) {
      const parsedConfig = extractConfigFromUrl(selectedAvatar);
      setAvatarConfig(parsedConfig);
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
    if (currentFeature) {
      const updatedConfig = { ...avatarConfig, [currentFeature]: option };
      setAvatarConfig(updatedConfig);
      
      // Call the onSelect callback with the new URL
      if (onSelect) {
        onSelect(generateAvatarUrl(updatedConfig));
      }
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Avatar Preview */}
      <TouchableOpacity onPress={() => {}} style={styles.avatarContainer}>
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
          onError={(e) => {
            console.log("Avatar image failed to load:", e.nativeEvent.error);
          }}
        />
      </TouchableOpacity>
      
      {/* Feature Selection Buttons */}
      <View style={styles.featuresContainer}>
        <Text style={styles.sectionTitle}>Customize Your Avatar</Text>
        <ScrollView contentContainerStyle={styles.featureButtonsContainer}>
          {Object.keys(featureLabels).map((feature) => (
            <TouchableOpacity
              key={feature}
              style={styles.featureButton}
              onPress={() => openFeatureModal(feature)}
            >
              <Text style={styles.featureButtonText}>{featureLabels[feature]}</Text>
              <Ionicons name="chevron-forward" size={20} color="#555" />
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
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.optionsContainer}>
              {currentFeature && avatarOptions[currentFeature]?.map((option) => {
                // Create a preview config with just this option changed
                const previewConfig = { ...avatarConfig, [currentFeature]: option };
                const previewUrl = generateAvatarUrl(previewConfig);
                
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionContainer,
                      avatarConfig[currentFeature] === option && styles.selectedOption
                    ]}
                    onPress={() => selectFeatureOption(option)}
                  >
                    <Image source={{ uri: previewUrl }} style={styles.optionPreview} />
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
    marginBottom: 20,
  },
  avatarContainer: {
    borderRadius: 75,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#019757",
    marginBottom: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    backgroundColor: "#f0f0f0", // Background while loading
  },
  featuresContainer: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  featureButtonsContainer: {
    alignItems: "stretch",
  },
  featureButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  featureButtonText: {
    fontSize: 16,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding:.15,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 10,
  },
  optionContainer: {
    alignItems: "center",
    margin: 10,
    width: 100,
    padding: 5,
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: "#e6f7ef",
    borderWidth: 2,
    borderColor: "#019757",
  },
  optionPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 5,
    backgroundColor: "#f0f0f0", // Background while loading
  },
  optionText: {
    fontSize: 12,
    textAlign: "center",
    color: "#555",
  },
});
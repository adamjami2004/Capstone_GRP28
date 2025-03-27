"use client"

import { useState, useEffect } from "react"
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
} from "react-native"
import { useRouter } from "expo-router"
import { auth, db } from "../config/firebase"
import { getDoc, doc, updateDoc } from "firebase/firestore"
import { Ionicons } from "@expo/vector-icons"
import RemoteSvg from "../../components/ui/RemoteSvg"
import {
  defaultAvatarConfig,
  avatarOptions,
  featureLabels,
  extractConfigFromUrl,
  getColorName,
  getFeatureDescription,
} from "../config/avatarConfig"
import { generateAvatarUrl } from "../services/avatarService"

// Add this debugging function near the top of the component
const debugAvatarUrl = (config) => {
  try {
    // Generate a test URL with all parameters
    const baseUrl = "https://api.dicebear.com/7.x/avataaars/svg"

    // Build query string with all parameters
    const queryParams = Object.entries(config)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&")

    const url = `${baseUrl}?${queryParams}`
    console.log("Debug URL with all parameters:", url)

    // Test the URL with a fetch
    fetch(url)
      .then((response) => {
        console.log("Debug URL response status:", response.status)
        if (!response.ok) {
          return response.text().then((text) => {
            console.error("Debug URL error:", text)
          })
        }
        console.log("Debug URL successful")
      })
      .catch((error) => {
        console.error("Debug URL fetch error:", error)
      })

    return url
  } catch (error) {
    console.error("Error in debugAvatarUrl:", error)
    return null
  }
}

export default function EditAvatarModal() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarConfig, setAvatarConfig] = useState(defaultAvatarConfig)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentFeature, setCurrentFeature] = useState(null)
  const [avatarLocalUri, setAvatarLocalUri] = useState(null)
  const [updatingFeature, setUpdatingFeature] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [useSvg, setUseSvg] = useState(true) // Flag to determine if we should use SVG

  // Fetch user's avatar configuration from Firestore
  useEffect(() => {
    async function fetchAvatarConfig() {
      try {
        if (!auth.currentUser) {
          console.log("No authenticated user found.")
          return
        }

        const uid = auth.currentUser.uid
        const userRef = doc(db, "users", uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const userData = userSnap.data()

          // If user has avatarConfig stored, use it
          if (userData.avatarConfig) {
            setAvatarConfig(userData.avatarConfig)
            // Add this line:
            debugAvatarUrl(userData.avatarConfig)
            // Generate SVG URL directly
            const svgUrl = generateAvatarUrl(userData.avatarConfig, "svg")
            setAvatarLocalUri(svgUrl)
          }
          // If user has avatar URL but no config, extract config from URL
          else if (userData.avatar) {
            const extractedConfig = extractConfigFromUrl(userData.avatar)
            setAvatarConfig(extractedConfig)
            setAvatarLocalUri(userData.avatar)
          }
          // Otherwise use default config
          else {
            // Use user's name as seed if available
            if (userData.firstName || userData.lastName) {
              const nameSeed = `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
              const newConfig = {
                ...defaultAvatarConfig,
                seed: nameSeed,
              }
              setAvatarConfig(newConfig)
              const svgUrl = generateAvatarUrl(newConfig, "svg")
              setAvatarLocalUri(svgUrl)
            } else {
              const svgUrl = generateAvatarUrl(defaultAvatarConfig, "svg")
              setAvatarLocalUri(svgUrl)
            }
          }
        } else {
          console.log("User profile not found.")
          Alert.alert("Error", "User profile not found.")
          const svgUrl = generateAvatarUrl(defaultAvatarConfig, "svg")
          setAvatarLocalUri(svgUrl)
        }
      } catch (error) {
        console.log("Error fetching avatar config:", error)
        setErrorMessage(error.message)
        Alert.alert("Error", error.toString())

        // Use SVG URL as fallback
        const svgUrl = generateAvatarUrl(defaultAvatarConfig, "svg")
        setAvatarLocalUri(svgUrl)
      } finally {
        setLoading(false)
      }
    }

    fetchAvatarConfig()
  }, [])

  // Open modal for specific feature customization
  const openFeatureModal = (feature) => {
    setCurrentFeature(feature)
    setModalVisible(true)
  }

  // Update feature and close modal
  const selectFeatureOption = async (option) => {
    if (!currentFeature) return

    try {
      setUpdatingFeature(true)

      // Create updated configuration
      const updatedConfig = {
        ...avatarConfig,
        [currentFeature]: option,
      }

      console.log(`Updating ${currentFeature} to ${option}`)
      console.log("Updated config:", updatedConfig)

      // Debug the URL before updating state
      debugAvatarUrl(updatedConfig)

      // Update state with new config
      setAvatarConfig(updatedConfig)

      // Generate a new avatar URL with the updated config
      const svgUrl = generateAvatarUrl(updatedConfig, "svg")
      console.log("Generated SVG URL:", svgUrl)

      // Set the avatar URI immediately
      setAvatarLocalUri(svgUrl)

      // Close the modal
      setModalVisible(false)
    } catch (error) {
      console.error("Error updating feature:", error)
      Alert.alert("Error", "Failed to update avatar feature. Please try again.")
    } finally {
      setUpdatingFeature(false)
    }
  }

  // Generate a random avatar
  const handleRandomize = async () => {
    try {
      setUpdatingFeature(true)
      setErrorMessage(null)

      // Generate a random config
      const randomConfig = {}

      // For each feature in avatarOptions, select a random option
      Object.keys(avatarOptions).forEach((feature) => {
        const options = avatarOptions[feature]
        const randomIndex = Math.floor(Math.random() * options.length)
        randomConfig[feature] = options[randomIndex]
      })

      // Add a random seed
      randomConfig.seed = Math.random().toString(36).substring(2, 10)

      // Update state with new config
      setAvatarConfig(randomConfig)

      // Generate SVG URL
      const svgUrl = generateAvatarUrl(randomConfig, "svg")
      setAvatarLocalUri(svgUrl)
    } catch (error) {
      console.error("Error generating random avatar:", error)
      setErrorMessage(error.message)

      // Generate a basic random config as fallback
      const fallbackConfig = {
        ...defaultAvatarConfig,
        seed: Math.random().toString(36).substring(2, 10),
      }

      setAvatarConfig(fallbackConfig)
      setAvatarLocalUri(generateAvatarUrl(fallbackConfig, "svg"))

      Alert.alert("Error", "Failed to generate random avatar. Using a basic avatar instead.")
    } finally {
      setUpdatingFeature(false)
    }
  }

  // Save avatar configuration to Firestore
  const handleSaveAndGoBack = async () => {
    try {
      setSaving(true)
      setErrorMessage(null)

      if (!auth.currentUser) {
        Alert.alert("Error", "You must be logged in to save your avatar.")
        return
      }

      const uid = auth.currentUser.uid
      const userRef = doc(db, "users", uid)

      // Generate a direct SVG URL from DiceBear
      const svgUrl = generateAvatarUrl(avatarConfig, "svg")
      console.log("Using direct SVG URL:", svgUrl)

      // Save both the avatar URL and configuration to Firestore
      await updateDoc(userRef, {
        avatar: svgUrl,
        avatarConfig: avatarConfig,
      })

      console.log("Avatar saved to Firestore successfully")
      Alert.alert("Success", "Avatar updated successfully.")
      router.back()
    } catch (error) {
      console.error("Error in handleSaveAndGoBack:", error)
      setErrorMessage(error.message)
      Alert.alert("Error", `Failed to save avatar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Get display name for a feature value
  const getFeatureDisplayValue = (feature, value) => {
    // For color features, try to get a friendly name
    if (feature.includes("Color") && value) {
      return getColorName(value)
    }

    // For other features, get the friendly description
    return getFeatureDescription(feature, value)
  }

  // Render a feature option in the modal
  const renderFeatureOption = ({ item }) => {
    const isSelected = avatarConfig[currentFeature] === item

    // Get the display name based on feature type
    const displayName = currentFeature?.includes("Color")
      ? getColorName(item)
      : getFeatureDescription(currentFeature, item)

    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          isSelected && styles.selectedOption,
          currentFeature?.includes("Color") && {
            backgroundColor: `#${item}`,
            borderColor: isSelected ? "#019757" : "#e0e0e0",
          },
        ]}
        onPress={() => selectFeatureOption(item)}
        disabled={updatingFeature}
      >
        {updatingFeature && avatarConfig[currentFeature] === item ? (
          <ActivityIndicator size="small" color="#019757" style={styles.optionLoading} />
        ) : (
          <>
            <View
              style={[
                styles.optionPreviewContainer,
                currentFeature?.includes("Color") && { backgroundColor: `#${item}` },
              ]}
            >
              <Text style={[styles.optionPreviewText, currentFeature?.includes("Color") && { color: "#fff" }]}>
                {displayName.charAt(0)}
              </Text>
            </View>
            <Text
              style={[
                styles.optionText,
                isSelected && styles.selectedOptionText,
                currentFeature?.includes("Color") && { color: "#000" },
              ]}
            >
              {displayName}
            </Text>
          </>
        )}
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#019757" />
      </SafeAreaView>
    )
  }

  // Determine if the URL is an SVG
  const isSvgUrl = avatarLocalUri?.toLowerCase().endsWith(".svg") || avatarLocalUri?.includes("/svg")

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#e8f5e9" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#019757" />
        </TouchableOpacity>
        <Text style={styles.title}>Customize Avatar</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#F44336" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Avatar Preview */}
          <View style={styles.avatarPreview}>
            {updatingFeature || avatarLocalUri === null ? (
              <View style={styles.avatar}>
                <ActivityIndicator size="large" color="#019757" />
                <Text style={styles.loadingText}>Updating avatar...</Text>
              </View>
            ) : isSvgUrl ? (
              <View style={styles.avatar}>
                <RemoteSvg uri={avatarLocalUri} width={150} height={150} />
              </View>
            ) : (
              <Image
                source={{ uri: avatarLocalUri }}
                style={styles.avatar}
                onError={(e) => {
                  console.log("Avatar failed to load:", e.nativeEvent.error)
                  // Fall back to a simple avatar with initials
                  const fallbackUrl = `https://ui-avatars.com/api/?name=${avatarConfig.seed || "User"}&background=019757&color=fff&size=150`
                  setAvatarLocalUri(fallbackUrl)
                  setUseSvg(false)
                }}
              />
            )}

            <TouchableOpacity
              style={styles.randomizeButton}
              onPress={handleRandomize}
              disabled={updatingFeature || saving}
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
                disabled={updatingFeature || saving}
              >
                <Text style={styles.featureButtonText}>{featureLabels[feature]}</Text>
                <View style={styles.featureValueContainer}>
                  <Text style={styles.featureValueText}>{getFeatureDisplayValue(feature, avatarConfig[feature])}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#019757" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndGoBack} disabled={saving || updatingFeature}>
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
          disabled={saving || updatingFeature}
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
        onRequestClose={() => !updatingFeature && setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {currentFeature ? featureLabels[currentFeature] : ""}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => !updatingFeature && setModalVisible(false)}
                disabled={updatingFeature}
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
  )
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
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#F44336",
    marginLeft: 8,
    flex: 1,
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
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  loadingText: {
    marginTop: 10,
    color: "#019757",
    fontSize: 14,
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
    minHeight: 120,
    justifyContent: "center",
  },
  optionLoading: {
    marginVertical: 20,
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
    overflow: "hidden",
    backgroundColor: "#019757",
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
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
})


"use client"

// app/(modal)/editprofile.js
import { useState, useEffect } from "react"
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
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native"
import { useRouter } from "expo-router"
import { auth, db } from "../config/firebase"
import { getDoc, doc, updateDoc } from "firebase/firestore"
import { Ionicons } from "@expo/vector-icons"
import { defaultAvatarConfig, generateAvatarUrl } from "../config/avatarConfig"
import RemoteSvg from "../../components/ui/RemoteSvg"

export default function EditProfile() {
  const router = useRouter()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [residence, setResidence] = useState("")
  const [roomNo, setRoomNo] = useState("")
  const [avatar, setAvatar] = useState("")
  const [avatarConfig, setAvatarConfig] = useState(null)
  const [bio, setBio] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        if (!auth.currentUser) {
          console.log("No user is currently logged in.")
          return
        }
        const uid = auth.currentUser.uid
        const userRef = doc(db, "users", uid)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const data = userSnap.data()
          setFirstName(data.firstName || "")
          setLastName(data.lastName || "")
          setEmail(data.email || "")
          setPhoneNumber(data.phoneNumber || "")
          setResidence(data.residence || "")
          setRoomNo(data.roomNumber || "")
          setAvatar(data.avatar || "")
          setAvatarConfig(data.avatarConfig || null)
          setBio(data.bio || "")
        } else {
          console.log("Profile document was not found in Firestore.")
          Alert.alert("Error", "User profile not found.")
        }
      } catch (error) {
        console.log("Problem fetching user data:", error)
        Alert.alert("Error", error.toString())
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSaveChanges = async () => {
    try {
      setSaving(true)
      if (!auth.currentUser) return
      const uid = auth.currentUser.uid
      const userRef = doc(db, "users", uid)
      await updateDoc(userRef, {
        firstName,
        lastName,
        email,
        phoneNumber,
        bio,
      })
      Alert.alert("Success", "Profile updated successfully.")
      router.push("/home/profile")
    } catch (error) {
      Alert.alert("Error", error.toString())
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push("/home/profile")
  }

  // Update the getAvatarSource function to better handle SVG images
  const getAvatarSource = () => {
    // If user has a saved avatar URL, use it directly
    if (avatar) {
      return { uri: avatar }
    }

    // If user has a saved avatar configuration, generate URL
    if (avatarConfig) {
      const avatarUrl = generateAvatarUrl(avatarConfig)
      return { uri: avatarUrl }
    }

    // Otherwise use default avatar
    const defaultConfig = {
      ...defaultAvatarConfig,
      seed: firstName || "User",
    }
    return { uri: generateAvatarUrl(defaultConfig) }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#019757" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#e8f5e9" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
              <Ionicons name="chevron-back" size={24} color="#019757" />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
            <View style={styles.backButton} />
          </View>

          {/* Replace the avatar section in the render part with this improved version */}
          {/* Find the <View style={styles.avatarSection}> and replace its contents with: */}
          <View style={styles.avatarSection}>
            {avatar && avatar.includes("/svg") ? (
              <View style={styles.avatarContainer}>
                <RemoteSvg uri={avatar} width={120} height={120} />
              </View>
            ) : (
              <Image
                source={getAvatarSource()}
                style={styles.avatar}
                onError={(e) => {
                  console.log("Avatar failed to load:", e.nativeEvent.error)
                  // Fallback to a simple avatar with initials
                  const fallbackUrl = `https://ui-avatars.com/api/?name=${firstName || "User"}&background=019757&color=fff&size=120`
                  setAvatar(fallbackUrl)
                }}
              />
            )}
            <TouchableOpacity style={styles.changeAvatarButton} onPress={() => router.push("/(modal)/editavatar")}>
              <Ionicons name="person-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.changeAvatarText}>Change Avatar</Text>
            </TouchableOpacity>
          </View>

          {/* Personal Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-circle-outline" size={22} color="#019757" />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#019757" />
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter your first name"
                  placeholderTextColor="#aaa"
                />
              </View>

              <Text style={styles.inputLabel}>Last Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#019757" />
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter your last name"
                  placeholderTextColor="#aaa"
                />
              </View>

              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#019757" />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  placeholderTextColor="#aaa"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#019757" />
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#aaa"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Residence Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="home-outline" size={22} color="#019757" />
              <Text style={styles.sectionTitle}>Residence Information</Text>
              <View style={styles.readOnlyBadge}>
                <Text style={styles.readOnlyText}>Read Only</Text>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Residence</Text>
              <View style={[styles.inputContainer, styles.disabledContainer]}>
                <Ionicons name="home-outline" size={20} color="#888" />
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={residence}
                  editable={false}
                  placeholder="Residence"
                  placeholderTextColor="#aaa"
                />
              </View>

              <Text style={styles.inputLabel}>Room Number</Text>
              <View style={[styles.inputContainer, styles.disabledContainer]}>
                <Ionicons name="bed-outline" size={20} color="#888" />
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={roomNo}
                  editable={false}
                  placeholder="Room Number"
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>
          </View>

          {/* Bio Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={22} color="#019757" />
              <Text style={styles.sectionTitle}>About Me</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Bio <Text style={styles.charCount}>{bio.length}/250</Text>
              </Text>
              <View style={styles.bioInputContainer}>
                <TextInput
                  style={styles.bioInput}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#aaa"
                  multiline={true}
                  maxLength={250}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={saving}>
              <Ionicons name="close-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Discard Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e8f5e9",
  },
  container: {
    padding: 16,
    backgroundColor: "#e8f5e9",
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingVertical: 8,
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

  /* Avatar Section */
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
    marginBottom: 16,
    backgroundColor: "#f0f0f0",
  },
  changeAvatarButton: {
    backgroundColor: "#019757",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#019757",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  changeAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  /* Cards */
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f2e9",
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#019757",
    marginLeft: 8,
    flex: 1,
  },
  readOnlyBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readOnlyText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },

  /* Input Fields */
  inputGroup: {
    width: "100%",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  disabledContainer: {
    backgroundColor: "#f0f0f0",
    borderColor: "#e0e0e0",
  },
  disabledInput: {
    color: "#888",
  },
  bioInputContainer: {
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 16,
  },
  bioInput: {
    fontSize: 16,
    color: "#333",
    padding: 16,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: "#888",
    fontWeight: "normal",
  },

  /* Buttons */
  buttonContainer: {
    marginTop: 8,
  },
  saveButton: {
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
  cancelButton: {
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
    marginBottom: 16,
    backgroundColor: "#f0f0f0",
    overflow: "hidden", // This is important to clip the SVG
    justifyContent: "center",
    alignItems: "center",
  },
})


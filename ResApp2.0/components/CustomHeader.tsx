"use client"

import { useEffect, useState } from "react"
import { StyleSheet, TouchableOpacity, View, Text, Alert, Animated } from "react-native"
import { IconSymbol } from "@/components/ui/icon-symbol"
import { useRouter } from "expo-router"
import Modal from "react-native-modal"
import { getAuth } from "firebase/auth"
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/firebase"

export function CustomHeader() {
  const router = useRouter()
  const [role, setRole] = useState<"TL" | "Admin" | null>(null)
  const [docsCheck, setDocsCheck] = useState<boolean>(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalMode, setModalMode] = useState<"TL" | "Admin" | null>(null)
  const [pulseAnim] = useState(new Animated.Value(1))

  const auth = getAuth()
  const user = auth.currentUser

  useEffect(() => {
    if (role === "TL" && docsCheck) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start()
    } else {
      pulseAnim.setValue(1)
    }
  }, [role, docsCheck])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        console.log("No user found")
        return
      }
      try {
        const userRef = doc(db, "Users", user.uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          const data = userSnap.data()
          console.log("Full user data:", data)
          console.log("Raw role value:", data.role)
          const userRole = data.role?.trim()
          console.log("Trimmed role:", userRole)
          setRole(userRole === "TL" || userRole === "Admin" ? userRole : null)
          setDocsCheck(data.docsCheck ?? false)
        } else {
          console.log("User document does not exist")
        }
      } catch (e) {
        console.error("Error fetching user data:", e)
      }
    }
    fetchUserData()
  }, [user])

  const handleTLAction = () => {
    setModalMessage(
      docsCheck
        ? "You have documents to pick up from the RC. Please do it as soon as possible."
        : "You have no pending documents to pick up.",
    )
    setModalMode("TL")
    setModalVisible(true)
  }

  const markAsPickedUp = () => {
    Alert.alert("Confirm", "Are you sure you have picked up the items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          if (!user) return
          try {
            await updateDoc(doc(db, "Users", user.uid), { docsCheck: false })
            setDocsCheck(false)
            setModalVisible(false)
            Alert.alert("Done", "Documents marked as picked up!")
          } catch (err) {
            console.error(err)
          }
        },
      },
    ])
  }

  const handleAdminAction = () => {
    setModalMessage("Notify all Team Leads about new documents to pick up?")
    setModalMode("Admin")
    setModalVisible(true)
  }

  const notifyAllTLs = () => {
    Alert.alert("Confirm", "Are you sure you want to notify all TLs?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            const q = query(collection(db, "Users"), where("role", "==", "TL"))
            const snapshot = await getDocs(q)
            const updates = snapshot.docs.map((docSnap) => updateDoc(docSnap.ref, { docsCheck: true }))
            await Promise.all(updates)
            setModalVisible(false)
            Alert.alert("Success", "All Team Leads have been notified!")
          } catch (err) {
            console.error(err)
          }
        },
      },
    ])
  }

  const handleBellAction = () => {
    console.log("Bell clicked, current role:", role)
    if (role === "TL") {
      handleTLAction()
    } else if (role === "Admin") {
      handleAdminAction()
    } else {
      Alert.alert("Notifications", "No notifications at this time.")
    }
  }

  const isTLorAdmin = role === "TL" || role === "Admin"

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/Sidebar")}>
          <IconSymbol size={24} name="line.horizontal.3" color="#000" />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {isTLorAdmin && (
            <TouchableOpacity style={styles.iconButton} onPress={role === "TL" ? handleTLAction : handleAdminAction}>
              <IconSymbol size={24} name={role === "TL" ? "archive" : "cloud-upload"} color="#007AFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.iconButton} onPress={handleBellAction}>
            <View>
              <Animated.View style={{ transform: [{ scale: role === "TL" && docsCheck ? pulseAnim : 1 }] }}>
                <IconSymbol size={24} name="bell.fill" color={role === "TL" && docsCheck ? "#FF3B30" : "#000"} />
              </Animated.View>
              {role === "TL" && docsCheck && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>1</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <IconSymbol size={24} name="gearshape.fill" color="#000" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/(tabs)/profile")}>
            <IconSymbol size={24} name="person.circle.fill" color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        animationIn="zoomIn"
        animationOut="zoomOut"
        backdropOpacity={0.5}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalIconContainer,
              modalMode === "Admin" ? styles.adminIconBg : docsCheck ? styles.warningIconBg : styles.successIconBg,
            ]}
          >
            <IconSymbol
              size={56}
              name={
                modalMode === "Admin"
                  ? "paperplane.fill"
                  : docsCheck
                    ? "exclamationmark.triangle.fill"
                    : "checkmark.circle.fill"
              }
              color="#fff"
            />
          </View>

          <Text style={styles.modalTitle}>
            {modalMode === "Admin" ? "Send Notification" : docsCheck ? "Action Required" : "All Clear"}
          </Text>

          <Text style={styles.modalMessage}>{modalMessage}</Text>

          <View style={styles.modalButtonContainer}>
            {modalMode === "TL" && docsCheck && (
              <TouchableOpacity style={[styles.modalButton, styles.primaryButton]} onPress={markAsPickedUp}>
                <IconSymbol size={20} name="checkmark.circle" color="#fff" />
                <Text style={styles.primaryButtonText}>Mark as Picked Up</Text>
              </TouchableOpacity>
            )}

            {modalMode === "Admin" && (
              <TouchableOpacity style={[styles.modalButton, styles.primaryButton]} onPress={notifyAllTLs}>
                <IconSymbol size={20} name="paperplane.fill" color="#fff" />
                <Text style={styles.primaryButtonText}>Send to All TLs</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.secondaryButtonText}>
                {(modalMode === "TL" && docsCheck) || modalMode === "Admin" ? "Cancel" : "Close"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  adminIconBg: {
    backgroundColor: "#007AFF",
  },
  warningIconBg: {
    backgroundColor: "#FF9500",
  },
  successIconBg: {
    backgroundColor: "#34C759",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    color: "#6C6C70",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  modalButtonContainer: {
    width: "100%",
    gap: 12,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#F2F2F7",
  },
  secondaryButtonText: {
    color: "#3C3C43",
    fontWeight: "600",
    fontSize: 16,
  },
})
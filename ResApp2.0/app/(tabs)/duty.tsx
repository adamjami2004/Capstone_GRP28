"use client"

import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Modal, Linking, Animated, Pressable } from "react-native"
import { useState, useRef, useEffect } from "react"
import { ThemedView } from "@/components/themed-view"
import { IconSymbol } from "@/components/ui/icon-symbol"
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

export default function ResourcesScreen() {
  const [qrModalVisible, setQrModalVisible] = useState(false)
  const [roommateQrVisible, setRoommateQrVisible] = useState(false)
  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  const [protectionUrgent, setProtectionUrgent] = useState("");
  const [protectionNonUrgent, setProtectionNonUrgent] = useState("");
  const [reception, setReception] = useState("");
  const [cordoOnCall, setCordoOnCall] = useState("");

  useEffect(() => {
    const fetchNumbers = async () => {
      try {
        const numbersRef = collection(db, "Numbers");
        const snapshot = await getDocs(numbersRef);

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          // Assuming your document IDs match the state keys
          switch (doc.id) {
            case "protectionUrgent":
              setProtectionUrgent(data.number);
              break;
            case "protectionNonUrgent":
              setProtectionNonUrgent(data.number);
              break;
            case "reception":
              setReception(data.number);
              break;
            case "cordoOnCall":
              setCordoOnCall(data.number);
              break;
            default:
              break;
          }
        });
      } catch (error) {
        console.error("Error fetching Numbers collection:", error);
      }
    };
    fetchNumbers();
  }, []);


  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`)
  }

  const handleWebsite = (url: string) => {
    Linking.openURL(url)
  }

  const showQrModal = (setter: (value: boolean) => void) => {
    setter(true)
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const hideQrModal = (setter: (value: boolean) => void) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setter(false)
      scaleAnim.setValue(0)
      fadeAnim.setValue(0)
    })
  }

  useEffect(() => {
    if (!qrModalVisible && !roommateQrVisible) {
      scaleAnim.setValue(0)
      fadeAnim.setValue(0)
    }
  }, [qrModalVisible, roommateQrVisible])

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconContainer}>
              <IconSymbol size={32} name="folder.fill" color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Duty Pocket</Text>
              <Text style={styles.headerSubtitle}>Quick access to essential services</Text>
            </View>
          </View>
        </View>

        {/* Emergency Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}> Protection Services</Text>
          <View style={styles.contactContainer}>
            <TouchableOpacity 
              style={styles.contactCard} 
              onPress={() => handleCall(protectionUrgent)}
            >
              <View style={[styles.contactIcon, { backgroundColor: "#dc2626" }]}>
                <IconSymbol size={24} name="phone.fill" color="#fff" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Protection - Urgent</Text>
                <Text style={styles.contactSubtitle}>Emergency line</Text>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactCard} 
              onPress={() => handleCall(protectionNonUrgent)}
            >
              <View style={[styles.contactIcon, { backgroundColor: "#b91c1c" }]}>
                <IconSymbol size={24} name="phone.fill" color="#fff" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Protection - Non-Urgent</Text>
                <Text style={styles.contactSubtitle}>General support</Text>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* QR Codes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR Codes</Text>
          <View style={styles.contactContainer}>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => showQrModal(setQrModalVisible)}
            >
              <View style={[styles.contactIcon, { backgroundColor: "#8b5cf6" }]}>
                <IconSymbol size={24} name="qrcode" color="#fff" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Main QR Code</Text>
                <Text style={styles.contactSubtitle}>Tap to view</Text>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#999" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => showQrModal(setRoommateQrVisible)}
            >
              <View style={[styles.contactIcon, { backgroundColor: "#3b82f6" }]}>
                <IconSymbol size={24} name="doc.text.fill" color="#fff" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Guest Register</Text>
                <Text style={styles.contactSubtitle}>Tap to view QR</Text>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contactContainer}>
            <TouchableOpacity style={styles.contactCard} onPress={() => handleCall(cordoOnCall)}>
              <View style={[styles.contactIcon, { backgroundColor: "#10b981" }]}>
                <IconSymbol size={24} name="phone.fill" color="#fff" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Cordo On-Call</Text>
                <Text style={styles.contactSubtitle}>24/7 Support</Text>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard} onPress={() => handleCall(reception)}>
              <View style={[styles.contactIcon, { backgroundColor: "#f59e0b" }]}>
                <IconSymbol size={24} name="building.2.fill" color="#fff" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Reception</Text>
                <Text style={styles.contactSubtitle}>Front desk</Text>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Websites Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Websites</Text>
          <View style={styles.websiteContainer}>
            <TouchableOpacity style={styles.websiteCard} onPress={() => handleWebsite("https://www.youtube.com/")}>
              <View style={[styles.websiteIcon, { backgroundColor: "#ec4899" }]}>
                <IconSymbol size={24} name="globe" color="#fff" />
              </View>
              <View style={styles.websiteInfo}>
                <Text style={styles.websiteTitle}>Archibus</Text>
                <Text style={styles.websiteSubtitle}>Facility management</Text>
              </View>
              <IconSymbol size={20} name="arrow.up.right" color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.websiteCard} onPress={() => handleWebsite("https://www.youtube.com/")}>
              <View style={[styles.websiteIcon, { backgroundColor: "#06b6d4" }]}>
                <IconSymbol size={24} name="globe" color="#fff" />
              </View>
              <View style={styles.websiteInfo}>
                <Text style={styles.websiteTitle}>Erez</Text>
                <Text style={styles.websiteSubtitle}>Resident portal</Text>
              </View>
              <IconSymbol size={20} name="arrow.up.right" color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Main QR Code Modal */}
      <Modal
        visible={qrModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => hideQrModal(setQrModalVisible)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => hideQrModal(setQrModalVisible)}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Main QR Code</Text>
              <TouchableOpacity onPress={() => hideQrModal(setQrModalVisible)} style={styles.closeButton}>
                <IconSymbol size={24} name="xmark" color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.qrCodeContainer}>
              {/* Placeholder for QR code - replace with actual QR code component */}
              <View style={styles.qrCodePlaceholder}>
                <IconSymbol size={120} name="qrcode" color="#8b5cf6" />
                <Text style={styles.qrPlaceholderText}>QR Code will appear here</Text>
              </View>
            </View>
            <Text style={styles.modalDescription}>Scan this code to access main resources</Text>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Roommate Agreement QR Modal */}
      <Modal
        visible={roommateQrVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => hideQrModal(setRoommateQrVisible)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => hideQrModal(setRoommateQrVisible)}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Roommate Agreement</Text>
              <TouchableOpacity onPress={() => hideQrModal(setRoommateQrVisible)} style={styles.closeButton}>
                <IconSymbol size={24} name="xmark" color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.qrCodeContainer}>
              {/* Placeholder for QR code - replace with actual QR code component */}
              <View style={styles.qrCodePlaceholder}>
                <IconSymbol size={120} name="qrcode" color="#3b82f6" />
                <Text style={styles.qrPlaceholderText}>QR Code will appear here</Text>
              </View>
            </View>
            <Text style={styles.modalDescription}>Scan to access the roommate agreement form</Text>
          </Animated.View>
        </Pressable>
      </Modal>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  content: { flex: 1 },
  headerSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  headerTitleContainer: { flexDirection: "row", alignItems: "center", gap: 16 },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#000", marginBottom: 2 },
  headerSubtitle: { fontSize: 14, color: "#666" },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#000", marginBottom: 16, paddingHorizontal: 20 },

  emergencyContainer: { paddingHorizontal: 20, flexDirection: "row", gap: 12 },
  emergencyButton: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  emergencyButton1: { backgroundColor: "#dc2626" },
  emergencyButton2: { backgroundColor: "#b91c1c" },
  emergencyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emergencyButtonText: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 4 },
  emergencyButtonNumber: { fontSize: 15, fontWeight: "600", color: "rgba(255, 255, 255, 0.9)" },

  // QR Codes Section
  qrContainer: { paddingHorizontal: 20, flexDirection: "row", gap: 12 },
  resourceCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#fff", textAlign: "center", marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: "rgba(255, 255, 255, 0.8)", textAlign: "center" },

  // Contact Section
  contactContainer: { paddingHorizontal: 20, gap: 12 },
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 2 },
  contactSubtitle: { fontSize: 14, color: "#666" },

  // Websites Section
  websiteContainer: { paddingHorizontal: 20, gap: 12 },
  websiteCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  websiteIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  websiteInfo: { flex: 1 },
  websiteTitle: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 2 },
  websiteSubtitle: { fontSize: 14, color: "#666" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 24, fontWeight: "700", color: "#000" },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  qrCodeContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  qrCodePlaceholder: {
    width: 240,
    height: 240,
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  qrPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
})

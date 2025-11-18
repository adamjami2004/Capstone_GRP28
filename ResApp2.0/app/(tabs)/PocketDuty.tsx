import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, ScrollView } from "react-native"
import { useState } from "react"
import { IconSymbol } from "@/components/ui/icon-symbol"

export default function DutyPocketScreen() {
  const [qrRoommateVisible, setQrRoommateVisible] = useState(false)
  const [qrGuestVisible, setQrGuestVisible] = useState(false)

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      
      {/* HEADER */}
      <Text style={styles.header}>Duty Pocket</Text>
      <Text style={styles.subheader}>Contacts and quick campus tools</Text>

      {/* CALL OPTIONS */}
      <Text style={styles.sectionTitle}>Call Options</Text>

      <View style={styles.cardGroup}>
        <TouchableOpacity style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: "#EFF6FF" }]}>
            <IconSymbol name="phone.fill" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.cardText}>Protection (URGENT)</Text>
          <IconSymbol name="arrow.up.right" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: "#EFF6FF" }]}>
            <IconSymbol name="phone.fill" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.cardText}>Protection (Non-Urgent)</Text>
          <IconSymbol name="arrow.up.right" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: "#F0FDF4" }]}>
            <IconSymbol name="bell.fill" size={20} color="#22C55E" />
          </View>
          <Text style={styles.cardText}>Reception</Text>
          <IconSymbol name="arrow.up.right" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: "#F5F3FF" }]}>
            <IconSymbol name="person.crop.circle.fill" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.cardText}>Coordinator On-Call</Text>
          <IconSymbol name="arrow.up.right" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* QR SECTION */}
      <Text style={styles.sectionTitle}>QR Codes</Text>

      <View style={styles.cardGroup}>
        <TouchableOpacity style={styles.card} onPress={() => setQrRoommateVisible(true)}>
          <View style={[styles.iconBox, { backgroundColor: "#FFFBEB" }]}>
            <IconSymbol name="qrcode" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.cardText}>Roommate Agreement</Text>
          <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => setQrGuestVisible(true)}>
          <View style={[styles.iconBox, { backgroundColor: "#FFFBEB" }]}>
            <IconSymbol name="qrcode" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.cardText}>Guest Registry</Text>
          <IconSymbol name="chevron.right" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* REDIRECTS */}
      <Text style={styles.sectionTitle}>Quick Access</Text>

      <View style={styles.cardGroup}>
        <TouchableOpacity style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: "#EEF2FF" }]}>
            <IconSymbol name="globe" size={20} color="#6366F1" />
          </View>
          <Text style={styles.cardText}>Erez Platform</Text>
          <IconSymbol name="arrow.up.right" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: "#F8FAFC" }]}>
            <IconSymbol name="building.2.fill" size={20} color="#64748B" />
          </View>
          <Text style={styles.cardText}>Archibus</Text>
          <IconSymbol name="arrow.up.right" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* QR MODALS */}
      <Modal visible={qrRoommateVisible} transparent animationType="fade">
        <View style={styles.modalWrapper}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setQrRoommateVisible(false)}
          />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Roommate Agreement</Text>
            <View style={styles.qrContainer}>
              <Image source={require("@/assets/images/icon.png")} style={styles.qrImage} />
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setQrRoommateVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={qrGuestVisible} transparent animationType="fade">
        <View style={styles.modalWrapper}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setQrGuestVisible(false)}
          />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Guest Registry</Text>
            <View style={styles.qrContainer}>
              <Image source={require("@/assets/images/icon.png")} style={styles.qrImage} />
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setQrGuestVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
    paddingTop: 40,
  },

  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },

  subheader: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 20,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  cardGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  cardText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },

  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modalBox: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    color: "#111827",
    letterSpacing: -0.3,
  },

  qrContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  qrImage: {
    width: 160,
    height: 160,
  },

  closeButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: "100%",
  },

  closeButtonText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },
})

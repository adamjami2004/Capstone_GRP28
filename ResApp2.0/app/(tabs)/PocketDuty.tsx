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
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrapper}>
                <IconSymbol name="qrcode" size={24} color="#F59E0B" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Roommate Agreement</Text>
            <Text style={styles.modalSubtitle}>Scan this code to access the form</Text>

            <View style={styles.qrContainer}>
              <View style={styles.qrInnerBorder}>
                <Image source={require("@/assets/images/icon.png")} style={styles.qrImage} />
              </View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setQrRoommateVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={qrGuestVisible} transparent animationType="fade">
        <View style={styles.modalWrapper}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setQrGuestVisible(false)} />
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrapper}>
                <IconSymbol name="qrcode" size={24} color="#F59E0B" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Guest Registry</Text>
            <Text style={styles.modalSubtitle}>Scan this code to register your guest</Text>

            <View style={styles.qrContainer}>
              <View style={styles.qrInnerBorder}>
                <Image source={require("@/assets/images/icon.png")} style={styles.qrImage} />
              </View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setQrGuestVisible(false)}>
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
    padding: 20,
  },

  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  modalBox: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },

  modalHeader: {
    marginBottom: 16,
  },

  modalIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFBEB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FEF3C7",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111827",
    letterSpacing: -0.4,
    textAlign: "center",
  },

  modalSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 18,
  },

  qrContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },

  qrInnerBorder: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FEFCE8",
    borderWidth: 2,
    borderColor: "#FEF3C7",
    borderStyle: "dashed",
  },

  qrImage: {
    width: 180,
    height: 180,
    borderRadius: 8,
  },

  closeButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  closeButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
})

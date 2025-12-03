import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SHAREPOINT_URL = "https://uottawa.sharepoint.com/teams/ResidenceLifeTeam2/_layouts/15/";

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const router = useRouter()
  const slideAnim = useRef(new Animated.Value(-380)).current

  const features = [
    { id: 7, name: "Duty Pocket", icon: "gearshape.fill", route: "/PocketDuty" },
    { id: 1, name: "SharePoint", icon: "folder.fill", externalUrl: SHAREPOINT_URL },
    { id: 2, name: "Room Reservations", icon: "calendar", route: "/reservations" },
    { id: 3, name: "News", icon: "star.fill" , route: "/announcements"},
    { id: 6, name: "Settings", icon: "gearshape.fill", route: "/settings" },
  ]

  const handlePress = (item: any) => {
    if (item.externalUrl) {
      Linking.openURL(item.externalUrl);
    } else if (item.route) {
      router.push(item.route as any);
    }
    onClose();
  }

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -380,
      duration: 280,
      useNativeDriver: true,
    }).start()
  }, [visible])

  return (
    <>
      {visible && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />}

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.headerArea}>
          <Text style={styles.headerTitle}>Menu</Text>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={{ fontSize: 24, fontWeight: "600", color: "#2C3E50" }}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            {features.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => handlePress(item)}
              >
                <View style={styles.iconBox}>
                  <IconSymbol name={item.icon} size={22} color="#C76846" />
                </View>

                <Text style={styles.rowText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 380,
    height: "100%",
    backgroundColor: "#F8F6F3",
    paddingTop: 70,
    borderTopRightRadius: 26,
    borderBottomRightRadius: 26,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
  },

  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(44, 62, 80, 0.25)",
    zIndex: 999,
  },

  headerArea: {
    paddingHorizontal: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2C3E50",
  },

  closeBtn: {
    padding: 6,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 20,
  },

  section: {
    marginTop: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E3DC",
  },

  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    backgroundColor: "#EDE8E0",
  },

  rowText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34495E",
  },
})

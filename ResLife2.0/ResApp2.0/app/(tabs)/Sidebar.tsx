import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import { ThemedView } from "@/components/themed-view"
import { IconSymbol } from "@/components/ui/icon-symbol"

export default function MoreScreen() {
  const features = [
    { id: 1, name: "SharePoint", icon: "folder.fill", color: "#0078D4" },
    { id: 2, name: "Room Reservations", icon: "calendar", color: "#7C3AED" },
    { id: 3, name: "Events", icon: "star.fill", color: "#F59E0B" },
    { id: 4, name: "Documents", icon: "doc.fill", color: "#10B981" },
    { id: 5, name: "Community", icon: "person.3.fill", color: "#EC4899" },
    { id: 6, name: "Settings", icon: "gearshape.fill", color: "#6B7280" },
  ]

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: "#8B5CF6" }]}>
              <IconSymbol name="square.grid.2x2.fill" size={24} color="#fff" />
            </View>
            <Text style={styles.title}>More Features</Text>
          </View>
          <Text style={styles.subtitle}>Additional tools and resources</Text>
        </View>

        {/* Features Grid */}
        <View style={styles.grid}>
          {features.map((feature) => (
            <TouchableOpacity key={feature.id} style={styles.featureCard} activeOpacity={0.7}>
              <View style={[styles.featureIconContainer, { backgroundColor: feature.color }]}>
                <IconSymbol name={feature.icon} size={28} color="#fff" />
              </View>
              <Text style={styles.featureName}>{feature.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 52,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  featureName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
})

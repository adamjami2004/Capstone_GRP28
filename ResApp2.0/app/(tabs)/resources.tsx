import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function ResourcesScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <IconSymbol name="book" size={32} color="#f59e0b" />
            </View>
            <Text style={styles.title}>Resources</Text>
            <Text style={styles.subtitle}>Access helpful information and documents</Text>
          </View>

          {/* Coming Soon Section */}
          <View style={styles.emptyContainer}>
            <IconSymbol name="doc.text" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Resources Coming Soon</Text>
            <Text style={styles.emptySubtext}>
              This section will contain helpful resources, documents, and reference materials.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#999",
    marginTop: 20,
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#bbb",
    textAlign: "center",
    lineHeight: 20,
  },
});



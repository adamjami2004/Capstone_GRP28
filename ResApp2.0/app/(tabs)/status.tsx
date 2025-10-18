"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, Switch } from "react-native"
import { ThemedView } from "@/components/themed-view"
import { IconSymbol } from "@/components/ui/icon-symbol"

export default function StatusScreen() {
  const [printerStatus, setPrinterStatus] = useState<"up" | "down">("up")
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [updatedBy, setUpdatedBy] = useState("Admin")

  const handleStatusToggle = (value: boolean) => {
    setPrinterStatus(value ? "up" : "down")
    setLastUpdated(new Date())
    setUpdatedBy("Tachfine")
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: "#10b981" }]}>
              <IconSymbol name="tv" size={24} color="#fff" />
            </View>
            <Text style={styles.title}>Status Monitor</Text>
          </View>
        </View>

        {/* Printer Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.printerInfo}>
              <View
                style={[
                  styles.printerIconContainer,
                  {
                    backgroundColor: printerStatus === "up" ? "#10b981" : "#ef4444",
                  },
                ]}
              >
                <IconSymbol name="printer" size={32} color="#fff" />
              </View>
              <View style={styles.printerDetails}>
                <Text style={styles.printerName}>Main Printer</Text>
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: printerStatus === "up" ? "#10b981" : "#ef4444",
                    },
                  ]}
                >
                  {printerStatus === "up" ? "● Online" : "● Offline"}
                  
                </Text>
                <Text>{printerStatus === "up" ? "Printer is working" : "Printer is not working"}</Text>
              </View>
            </View>

            <Switch
              value={printerStatus === "up"}
              onValueChange={handleStatusToggle}
              trackColor={{ false: "#ef4444", true: "#10b981" }}
              thumbColor="#fff"
              ios_backgroundColor="#ef4444"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.metaInfo}>
            <View style={styles.metaRow}>
              <IconSymbol name="clock" size={16} color="#6b7280" />
              <Text style={styles.metaLabel}>Last Updated:</Text>
              <Text style={styles.metaValue}>{formatDate(lastUpdated)}</Text>
            </View>
            <View style={styles.metaRow}>
              <IconSymbol name="person" size={16} color="#6b7280" />
              <Text style={styles.metaLabel}>Updated By:</Text>
              <Text style={styles.metaValue}>{updatedBy}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
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
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  printerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  printerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  printerDetails: {
    gap: 4,
  },
  printerName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  metaInfo: {
    gap: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  metaValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
})

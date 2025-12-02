"use client"

import { ThemedView } from "@/components/themed-view"
import { IconSymbol } from "@/components/ui/icon-symbol"
import { useState } from "react"
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native"

type StatusItem = {
  id: string
  name: string
  icon: string
  status: "up" | "down"
  description: string
  lastUpdated: Date
  updatedBy: string
}

export default function StatusScreen() {
  const [statusItems, setStatusItems] = useState<StatusItem[]>([
    {
      id: "printer",
      name: "Main Printer",
      icon: "printer",
      status: "up",
      description: "Printer is working",
      lastUpdated: new Date(),
      updatedBy: "Adam Jami",
    },
    {
      id: "network",
      name: "Archibus",
      icon: "network",
      status: "up",
      description: "Archibus is active",
      lastUpdated: new Date(),
      updatedBy: "Tachfine Bihya",
    },
    {
      id: "server",
      name: "Server",
      icon: "server.rack",
      status: "up",
      description: "Server is running",
      lastUpdated: new Date(),
      updatedBy: "Admin",
    },
    
  ])

  const handleStatusToggle = (id: string, value: boolean, currentStatus: "up" | "down") => {
    const item = statusItems.find((item) => item.id === id)
    if (!item) return

    const newStatus = value ? "up" : "down"
    const action = newStatus === "up" ? "bring online" : "take offline"

    // Temporarily update the state so the switch moves
    setStatusItems((prev) =>
      prev.map((statusItem) =>
        statusItem.id === id
          ? { ...statusItem, status: newStatus }
          : statusItem
      )
    )

    Alert.alert(
      "Confirm Status Change",
      `Are you sure you want to ${action} "${item.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            // Revert the switch by updating state back to original
            setStatusItems((prev) =>
              prev.map((statusItem) =>
                statusItem.id === id
                  ? { ...statusItem, status: currentStatus }
                  : statusItem
              )
            )
          },
        },
        {
          text: "Confirm",
          style: "default",
          onPress: () => {
            // Confirm the change and update metadata
            setStatusItems((prev) =>
              prev.map((statusItem) =>
                statusItem.id === id
                  ? {
                      ...statusItem,
                      status: newStatus,
                      lastUpdated: new Date(),
                      updatedBy: "Tachfine",
                    }
                  : statusItem
              )
            )
          },
        },
      ]
    )
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
        <View style={styles.headerSection}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconContainer}>
              <IconSymbol size={26} name="chart.bar.fill" color="#3b82f6" />
            </View>
            <Text style={styles.headerTitle}>Status Monitor</Text>
          </View>
        </View>

        {/* Status Cards */}
        {statusItems.map((item) => (
          <View key={item.id} style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.printerInfo}>
                <View
                  style={[
                    styles.printerIconContainer,
                    {
                      backgroundColor: item.status === "up" ? "#3b82f6" : "#ef4444",
                    },
                  ]}
                >
                  <IconSymbol name={item.icon as any} size={24} color="#fff" />
                </View>
                <View style={styles.printerDetails}>
                  <Text style={styles.printerName}>{item.name}</Text>
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: item.status === "up" ? "#10b981" : "#ef4444",
                      },
                    ]}
                  >
                    {item.status === "up" ? "● Online" : "● Offline"}
                  </Text>
                  <Text style={styles.descriptionText}>
                    {item.status === "up" ? item.description : `${item.name} is not working`}
                  </Text>
                </View>
              </View>

              <Switch
                value={item.status === "up"}
                onValueChange={(value) => handleStatusToggle(item.id, value, item.status)}
                trackColor={{ false: "#ef4444", true: "#10b981" }}
                thumbColor="#fff"
                ios_backgroundColor="#ef4444"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.metaInfo}>
              <View style={styles.metaRow}>
                <IconSymbol name="clock" size={12} color="#6b7280" />
                <Text style={styles.metaLabel}>Last Updated:</Text>
                <Text style={styles.metaValue}>{formatDate(item.lastUpdated)}</Text>
              </View>
              <View style={styles.metaRow}>
                <IconSymbol name="person" size={12} color="#6b7280" />
                <Text style={styles.metaLabel}>Updated By:</Text>
                <Text style={styles.metaValue}>{item.updatedBy}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingBottom: 100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 0,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
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
    gap: 12,
  },
  printerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  printerDetails: {
    gap: 3,
  },
  printerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  descriptionText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  metaInfo: {
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  metaValue: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },
})

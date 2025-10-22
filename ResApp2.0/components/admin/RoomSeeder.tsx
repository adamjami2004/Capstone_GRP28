"use client";
import { seedRooms } from "@/scripts/seedRooms";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * Admin component to seed the database with sample rooms
 * This should only be accessible to administrators
 */
export function RoomSeeder() {
  const [loading, setLoading] = useState(false);

  const handleSeedRooms = async () => {
    Alert.alert(
      "Seed Rooms",
      "This will add sample rooms to the database. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await seedRooms();
              if (result.success) {
                if (result.count > 0) {
                  Alert.alert("Success", `Added ${result.count} rooms to the database`);
                } else {
                  Alert.alert("Info", "Database already has rooms. No new rooms added.");
                }
              } else {
                Alert.alert("Error", result.error || "Failed to seed rooms");
              }
            } catch (error) {
              console.error("Error seeding rooms:", error);
              Alert.alert("Error", "An unexpected error occurred");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Database Management</Text>
      <Text style={styles.description}>
        Use this tool to populate the database with sample room data.
      </Text>
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSeedRooms}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Seed Rooms</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});


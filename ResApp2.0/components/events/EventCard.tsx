import { IconSymbol } from "@/components/ui/icon-symbol";
import { Event } from "@/types/event";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  currentUserEmail: string;
}

const categoryColors = {
  Cat1: "#3b82f6",
  Cat2: "#10b981",
  Cat3: "#f59e0b",
};

export default function EventCard({ event, onEdit, onDelete, currentUserEmail }: EventCardProps) {
  const isOwner = event.createdBy === currentUserEmail;
  const deadlineDate = new Date(event.deadline);
  const isExpired = deadlineDate < new Date();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(event),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Event Image */}
      <View style={styles.imageContainer}>
        {!event.imageUrl || event.imageUrl === "" ? (
          <View style={styles.imageErrorContainer}>
            <IconSymbol name="photo" size={48} color="#ccc" />
            <Text style={styles.imageErrorText}>No image</Text>
            <Text style={styles.imageErrorSubtext}>Storage not enabled</Text>
          </View>
        ) : imageError ? (
          <View style={styles.imageErrorContainer}>
            <IconSymbol name="photo" size={48} color="#ccc" />
            <Text style={styles.imageErrorText}>Image unavailable</Text>
          </View>
        ) : (
          <>
            {imageLoading && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            )}
            <Image 
              source={{ uri: event.imageUrl }} 
              style={styles.image}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={(e) => {
                console.error("Image load error:", e.nativeEvent.error);
                setImageError(true);
                setImageLoading(false);
              }}
              resizeMode="cover"
            />
          </>
        )}
      </View>

      {/* Category Badge */}
      <View style={[styles.categoryBadge, { backgroundColor: categoryColors[event.category] }]}>
        <Text style={styles.categoryText}>{event.category}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {event.description}
        </Text>

        {/* Deadline */}
        <View style={styles.deadlineContainer}>
          <IconSymbol name="calendar" size={16} color={isExpired ? "#ef4444" : "#666"} />
          <Text style={[styles.deadlineText, isExpired && styles.deadlineExpired]}>
            {deadlineDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.authorContainer}>
            <IconSymbol name="person.circle" size={16} color="#999" />
            <Text style={styles.authorText} numberOfLines={1}>
              {event.createdBy}
            </Text>
          </View>

          {/* Action Buttons - Only show for owner */}
          {isOwner && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit(event)}
              >
                <IconSymbol name="pencil" size={18} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <IconSymbol name="trash" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  image: {
    width: "100%",
    height: 200,
  },
  imageLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    zIndex: 1,
  },
  imageErrorContainer: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  imageErrorText: {
    marginTop: 8,
    fontSize: 12,
    color: "#999",
  },
  imageErrorSubtext: {
    marginTop: 4,
    fontSize: 10,
    color: "#bbb",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    padding: 16,
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
    lineHeight: 20,
    marginBottom: 12,
  },
  deadlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  deadlineText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  deadlineExpired: {
    color: "#ef4444",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  authorText: {
    fontSize: 12,
    color: "#999",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 6,
  },
});


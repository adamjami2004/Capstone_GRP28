"use client";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function FeedbackScreen() {
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert("Error", "Please enter your feedback");
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Please log in to submit feedback");
        setSubmitting(false);
        return;
      }

      // Get user info
      const usersRef = collection(db, "Users");
      const userQuery = query(usersRef, where("uid", "==", user.uid));
      const userSnapshot = await getDocs(userQuery);

      let userName = "Anonymous";
      let userEmail = user.email || "";

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.Email || "Anonymous";
        userEmail = userData.Email || user.email || "";
      }

      // Submit feedback
      const feedbackRef = collection(db, "Feedback");
      await addDoc(feedbackRef, {
        userId: user.uid,
        userName,
        userEmail,
        feedback: feedback.trim(),
        createdAt: serverTimestamp(),
        status: "new",
      });

      Alert.alert("Success", "Thank you for your feedback!", [
        {
          text: "OK",
          onPress: () => setFeedback(""),
        },
      ]);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
              <IconSymbol size={26} name="bubble.left.and.bubble.right.fill" color="#3b82f6" />
            </View>
            <Text style={styles.headerTitle}>Feedback</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <IconSymbol name="info.circle.fill" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Share your thoughts, suggestions, or report issues. We value your feedback!
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Your Feedback</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Tell us what you think..."
              placeholderTextColor="#9ca3af"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>{feedback.length}/1000</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !feedback.trim()}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <IconSymbol name="paperplane.fill" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 160,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "right",
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});


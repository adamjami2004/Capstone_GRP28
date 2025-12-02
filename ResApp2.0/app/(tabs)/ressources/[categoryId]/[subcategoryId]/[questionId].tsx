"use client";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function QuestionAnswerScreen() {
  const { question, answer, attachments } = useLocalSearchParams<{ 
    question: string; 
    answer: string; 
    attachments?: string;
  }>();
  const router = useRouter();

  const parsedAttachments = attachments ? JSON.parse(attachments) : [];

  const openAttachment = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Unable to open", "This link cannot be opened on your device.");
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Answer</Text>
        </View>

        {/* Question */}
        <View style={styles.contentSection}>
          <View style={styles.questionBox}>
            <View style={styles.questionBoxIcon}>
              <IconSymbol name="questionmark.circle.fill" size={24} color="#6366f1" />
            </View>
            <Text style={styles.questionBoxText}>{question}</Text>
          </View>

          {/* Answer */}
          <View style={styles.answerBox}>
            <View style={styles.answerHeader}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#10b981" />
              <Text style={styles.answerLabel}>Answer</Text>
            </View>
            <Text style={styles.answerText}>{answer}</Text>
          </View>

          {/* Attachments */}
          {parsedAttachments && parsedAttachments.length > 0 && (
            <View style={styles.attachmentsSection}>
              <Text style={styles.sectionLabel}>Attachments</Text>
              <View style={styles.attachmentsContainer}>
                {parsedAttachments.map((att: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.attachmentButton}
                    onPress={() => openAttachment(att.url)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.attachmentIcon,
                        { backgroundColor: att.type === "pdf" ? "#fef2f2" : "#eff6ff" },
                      ]}
                    >
                      <IconSymbol
                        name={att.type === "pdf" ? "doc.fill" : "link"}
                        size={22}
                        color={att.type === "pdf" ? "#dc2626" : "#2563eb"}
                      />
                    </View>
                    <View style={styles.attachmentInfo}>
                      <Text style={styles.attachmentLabel}>{att.label}</Text>
                      <Text style={styles.attachmentHint}>Tap to open</Text>
                    </View>
                    <IconSymbol name="arrow.up.right" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
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
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: "#fff",
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  contentSection: {
    padding: 20,
    gap: 20,
  },
  questionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#eef2ff",
    padding: 20,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  questionBoxIcon: {
    marginTop: 2,
  },
  questionBoxText: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#4338ca",
    lineHeight: 26,
  },
  answerBox: {
    backgroundColor: "#f8fafc",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  answerText: {
    fontSize: 16,
    color: "#334155",
    lineHeight: 26,
    fontWeight: "400",
  },
  attachmentsSection: {
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  attachmentsContainer: {
    gap: 10,
  },
  attachmentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  attachmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  attachmentHint: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
});


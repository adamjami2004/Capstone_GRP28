"use client";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth } from "@/firebase";
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  formatRelativeTime,
  isUserAdmin,
  toggleRead,
  updateAnnouncement,
  uploadAttachment,
} from "@/helpers/announcementHelper";
import { Announcement } from "@/types/announcement";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<"urgent" | "normal">("normal");
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const adminStatus = await isUserAdmin();
    setIsAdmin(adminStatus);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error("Error loading announcements:", error);
      Alert.alert("Error", "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateAnnouncement = () => {
    setTitle("");
    setContent("");
    setTag("normal");
    setAttachmentUri(null);
    setAttachmentName(null);
    setShowCreateModal(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setTag(announcement.tag);
    setAttachmentUri(announcement.attachmentUrl || null);
    setAttachmentName(announcement.attachmentName || null);
    setShowEditModal(true);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "*/*"],
        copyToCacheDirectory: true,
      });

      console.log("Document picker result:", result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log("Selected document:", result.assets[0]);
        setAttachmentUri(result.assets[0].uri);
        setAttachmentName(result.assets[0].name || "document.pdf");
        Alert.alert("Document Selected", `File: ${result.assets[0].name}`);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const removeAttachment = () => {
    setAttachmentUri(null);
    setAttachmentName(null);
  };

  const handleSubmitCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (!content.trim()) {
      Alert.alert("Error", "Please enter content");
      return;
    }

    setSubmitting(true);
    try {
      // First create the announcement
      const result = await createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        tag,
      });

      if (!result.success) {
        Alert.alert("Error", result.error || "Failed to create announcement");
        return;
      }

      // If there's an attachment, upload it and update the announcement
      if (attachmentUri && attachmentName && result.announcementId) {
        console.log("Uploading attachment:", attachmentUri, attachmentName);
        const uploadResult = await uploadAttachment(attachmentUri, attachmentName, result.announcementId);
        console.log("Upload result:", uploadResult);
        
        if (uploadResult.success && uploadResult.url) {
          const updateResult = await updateAnnouncement(result.announcementId, {
            attachmentUrl: uploadResult.url,
            attachmentName: attachmentName,
          });
          console.log("Update result:", updateResult);
          
          if (!updateResult.success) {
            Alert.alert("Warning", "Announcement created but attachment failed to save");
          }
        } else {
          Alert.alert("Warning", uploadResult.error || "Announcement created but attachment upload failed");
        }
      }

      Alert.alert("Success", "Announcement created successfully!");
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error("Error creating announcement:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitUpdate = async () => {
    if (!selectedAnnouncement) return;

    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (!content.trim()) {
      Alert.alert("Error", "Please enter content");
      return;
    }

    setSubmitting(true);
    try {
      let finalAttachmentUrl = attachmentUri;
      let finalAttachmentName = attachmentName;

      // If there's a new attachment (local URI), upload it
      if (attachmentUri && !attachmentUri.startsWith("http")) {
        const uploadResult = await uploadAttachment(attachmentUri, attachmentName || "attachment", selectedAnnouncement.id);
        if (uploadResult.success && uploadResult.url) {
          finalAttachmentUrl = uploadResult.url;
        }
      }

      const result = await updateAnnouncement(selectedAnnouncement.id, {
        title: title.trim(),
        content: content.trim(),
        tag,
        attachmentUrl: finalAttachmentUrl || undefined,
        attachmentName: finalAttachmentName || undefined,
      }, true); // Check ownership

      if (result.success) {
        Alert.alert("Success", "Announcement updated successfully!");
        setShowEditModal(false);
        loadData();
      } else {
        Alert.alert("Error", result.error || "Failed to update announcement");
      }
    } catch (error) {
      console.error("Error updating announcement:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = (announcement: Announcement) => {
    Alert.alert(
      "Delete Announcement",
      "Are you sure you want to delete this announcement?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deleteAnnouncement(announcement.id);
              if (result.success) {
                Alert.alert("Success", "Announcement deleted!");
                loadData();
              } else {
                Alert.alert("Error", result.error || "Failed to delete");
              }
            } catch (error) {
              console.error("Error deleting:", error);
              Alert.alert("Error", "An unexpected error occurred");
            }
          },
        },
      ]
    );
  };

  const handleReadPress = async (announcement: Announcement) => {
    try {
      const result = await toggleRead(announcement.id, announcement.readBy || []);
      if (result.success) {
        // Update local state immediately
        setAnnouncements((prev) =>
          prev.map((a) => {
            if (a.id === announcement.id) {
              const currentUserId = auth.currentUser?.uid;
              const currentReadBy = a.readBy || [];
              const hasRead = currentReadBy.includes(currentUserId || "");
              const newReadBy = hasRead
                ? currentReadBy.filter((id) => id !== currentUserId)
                : [...currentReadBy, currentUserId || ""];
              return {
                ...a,
                readBy: newReadBy,
                readCount: newReadBy.length,
              };
            }
            return a;
          })
        );
      }
    } catch (error) {
      console.error("Error toggling read:", error);
    }
  };

  const openAttachment = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this attachment");
      }
    } catch (error) {
      console.error("Error opening attachment:", error);
      Alert.alert("Error", "Failed to open attachment");
    }
  };

  const renderAnnouncement = (announcement: Announcement) => {
    const hasRead = (announcement.readBy || []).includes(auth.currentUser?.uid || "");
    const isUrgent = announcement.tag === "urgent";
    const isPublisher = announcement.publisherId === auth.currentUser?.uid;
    
    // Debug log to check attachment
    console.log("Announcement:", announcement.title, "Attachment URL:", announcement.attachmentUrl);

    return (
      <View key={announcement.id} style={[styles.card, isUrgent && styles.cardUrgent]}>
        {/* Urgent Banner */}
        {isUrgent && (
          <View style={styles.urgentBanner}>
            <IconSymbol name="exclamationmark.triangle.fill" size={14} color="#fff" />
            <Text style={styles.urgentBannerText}>URGENT</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.publisherInfo}>
            <View style={[styles.avatar, isUrgent && styles.avatarUrgent]}>
              {announcement.publisherProfilePicture ? (
                <Image
                  source={{ uri: announcement.publisherProfilePicture }}
                  style={styles.avatarImage}
                />
              ) : (
                <IconSymbol name="person.fill" size={18} color="#fff" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.publisherName}>{announcement.publisherName}</Text>
              <View style={styles.metaRow}>
                <IconSymbol name="clock.fill" size={11} color="#9ca3af" />
                <Text style={styles.timestamp}>
                  {formatRelativeTime(announcement.createdAt)}
                </Text>
              </View>
            </View>
          </View>
          {isPublisher && (
            <View style={styles.adminActions}>
              <TouchableOpacity
                onPress={() => handleEditAnnouncement(announcement)}
                style={styles.actionButton}
              >
                <IconSymbol name="pencil" size={16} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteAnnouncement(announcement)}
                style={[styles.actionButton, { backgroundColor: "#fee2e2" }]}
              >
                <IconSymbol name="trash" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{announcement.title}</Text>
          <Text style={styles.cardText}>{announcement.content}</Text>

          {/* Attachment - Prominent Document Card */}
          {announcement.attachmentUrl && (
            <TouchableOpacity
              style={styles.documentCard}
              onPress={() => openAttachment(announcement.attachmentUrl!)}
              activeOpacity={0.7}
            >
              <View style={styles.documentIconContainer}>
                <IconSymbol name="doc.fill" size={28} color="#ef4444" />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName} numberOfLines={1}>
                  {announcement.attachmentName || "Document"}
                </Text>
                <Text style={styles.documentType}>PDF Document</Text>
              </View>
              <View style={styles.documentAction}>
                <IconSymbol name="arrow.down.circle.fill" size={28} color="#3b82f6" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[styles.readButton, hasRead && styles.readButtonActive]}
            onPress={() => handleReadPress(announcement)}
          >
            <IconSymbol
              name={hasRead ? "checkmark.circle.fill" : "checkmark.circle"}
              size={18}
              color={hasRead ? "#10b981" : "#9ca3af"}
            />
            <Text style={[styles.readCount, hasRead && styles.readCountActive]}>
              {(announcement.readCount || 0) > 0 ? `${announcement.readCount} read` : "Mark as read"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => (isEdit ? setShowEditModal(false) : setShowCreateModal(false))}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {isEdit ? "Edit Announcement" : "New Announcement"}
              </Text>
              <Text style={styles.modalSubtitle}>
                {isEdit ? "Update the announcement details" : "Create an announcement for everyone"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => (isEdit ? setShowEditModal(false) : setShowCreateModal(false))}
              style={styles.closeButton}
            >
              <IconSymbol name="xmark" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Tag Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.tagContainer}>
                <TouchableOpacity
                  style={[styles.tagButton, tag === "normal" && styles.tagButtonActive]}
                  onPress={() => setTag("normal")}
                >
                  <IconSymbol
                    name="bell.fill"
                    size={16}
                    color={tag === "normal" ? "#3b82f6" : "#9ca3af"}
                  />
                  <Text style={[styles.tagText, tag === "normal" && styles.tagTextActive]}>
                    Normal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tagButton,
                    tag === "urgent" && styles.tagButtonUrgent,
                  ]}
                  onPress={() => setTag("urgent")}
                >
                  <IconSymbol
                    name="exclamationmark.triangle.fill"
                    size={16}
                    color={tag === "urgent" ? "#ef4444" : "#9ca3af"}
                  />
                  <Text style={[styles.tagText, tag === "urgent" && styles.tagTextUrgent]}>
                    Urgent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter announcement title"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Content */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Content *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Write your announcement..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={6}
              />
            </View>

            {/* Attachment */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Attachment (Optional)</Text>
              {attachmentName ? (
                <View style={styles.attachmentPreview}>
                  <View style={styles.attachmentIcon}>
                    <IconSymbol name="doc.fill" size={20} color="#3b82f6" />
                  </View>
                  <Text style={styles.attachmentPreviewName} numberOfLines={1}>
                    {attachmentName}
                  </Text>
                  <TouchableOpacity onPress={removeAttachment}>
                    <IconSymbol name="xmark.circle.fill" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.attachmentPicker} onPress={pickDocument}>
                  <View style={styles.attachmentPickerIcon}>
                    <IconSymbol name="doc.badge.plus" size={24} color="#3b82f6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attachmentPickerText}>Add Document</Text>
                    <Text style={styles.attachmentPickerSubtext}>PDF or Word document</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={isEdit ? handleSubmitUpdate : handleSubmitCreate}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconSymbol
                    name={isEdit ? "checkmark.circle.fill" : "paperplane.fill"}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.submitButtonText}>
                    {isEdit ? "Update Announcement" : "Publish Announcement"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Announcements</Text>
            <Text style={styles.headerSubtitle}>
              {announcements.length} {announcements.length === 1 ? "announcement" : "announcements"}
            </Text>
          </View>
        </View>

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <IconSymbol name="megaphone.fill" size={40} color="#3b82f6" />
            </View>
            <Text style={styles.emptyText}>No announcements yet</Text>
            <Text style={styles.emptySubtext}>
              {isAdmin
                ? "Tap the + button to create the first announcement"
                : "Check back later for updates"}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {announcements.map(renderAnnouncement)}
          </View>
        )}
      </ScrollView>

      {/* FAB for Admin */}
      {isAdmin && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateAnnouncement}>
          <IconSymbol name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modals */}
      {renderModal(false)}
      {renderModal(true)}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardUrgent: {
    borderWidth: 2,
    borderColor: "#fecaca",
  },
  urgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    gap: 6,
  },
  urgentBannerText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 12,
  },
  publisherInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarUrgent: {
    backgroundColor: "#ef4444",
  },
  publisherName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: "#9ca3af",
  },
  adminActions: {
    flexDirection: "row",
    gap: 6,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
  },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: "#fecaca",
  },
  documentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  documentType: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  documentAction: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  cardFooter: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  readButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  readButtonActive: {
    backgroundColor: "#d1fae5",
    borderColor: "#a7f3d0",
  },
  readCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
  },
  readCountActive: {
    color: "#10b981",
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  textArea: {
    height: 140,
    textAlignVertical: "top",
  },
  tagContainer: {
    flexDirection: "row",
    gap: 12,
  },
  tagButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  tagButtonActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
  },
  tagButtonUrgent: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  tagTextActive: {
    color: "#3b82f6",
  },
  tagTextUrgent: {
    color: "#ef4444",
  },
  attachmentPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  attachmentPreviewName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  attachmentPicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  attachmentPickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentPickerText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  attachmentPickerSubtext: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});


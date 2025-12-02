"use client";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth } from "@/firebase";
import {
  createPost,
  deletePost,
  fetchPosts,
  formatPostDate,
  formatPostTime,
  formatRelativeTime,
  toggleLike,
  updatePost,
  uploadPostImage,
} from "@/helpers/feedHelper";
import { Post } from "@/types/feed";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await fetchPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
      Alert.alert("Error", "Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleCreatePost = () => {
    setTitle("");
    setDescription("");
    setDate(new Date());
    // Set default start time to current time rounded to next hour
    const defaultStart = new Date();
    defaultStart.setMinutes(0, 0, 0);
    defaultStart.setHours(defaultStart.getHours() + 1);
    setStartTime(defaultStart);
    // Set default end time to 1 hour after start
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(defaultEnd.getHours() + 1);
    setEndTime(defaultEnd);
    setSelectedImage(null);
    setShowCreateModal(true);
  };

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setTitle(post.title);
    setDescription(post.description);
    setDate(new Date(post.date));
    setStartTime(post.startTime ? new Date(post.startTime) : new Date());
    setEndTime(post.endTime ? new Date(post.endTime) : new Date());
    setSelectedImage(post.imageUrl || null);
    setShowEditModal(true);
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to upload images"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const handleDeletePost = (post: Post) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deletePost(post.id);
              if (result.success) {
                Alert.alert("Success", "Event deleted successfully!");
                loadPosts();
              } else {
                Alert.alert("Error", result.error || "Failed to delete event");
              }
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert("Error", "An unexpected error occurred");
            }
          },
        },
      ]
    );
  };

  const handleLikePress = async (post: Post) => {
    try {
      const result = await toggleLike(post.id, post.likes || []);
      if (result.success) {
        // Update local state immediately for smooth UX
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === post.id) {
              const currentUserId = auth.currentUser?.uid;
              const currentLikes = p.likes || [];
              const hasLiked = currentLikes.includes(currentUserId || "");
              const newLikes = hasLiked
                ? currentLikes.filter((id) => id !== currentUserId)
                : [...currentLikes, currentUserId || ""];
              return {
                ...p,
                likes: newLikes,
                likeCount: newLikes.length,
              };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSubmitCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    setSubmitting(true);
    setUploadingImage(true);
    try {
      let imageUrl: string | undefined = undefined;

      // First create the post to get the post ID
      const result = await createPost({
        title: title.trim(),
        description: description.trim(),
        date: date.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });

      if (!result.success) {
        Alert.alert("Error", result.error || "Failed to create event");
        return;
      }

      // If there's an image, upload it and update the post
      if (selectedImage && result.postId) {
        const uploadResult = await uploadPostImage(selectedImage, result.postId);
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
          // Update the post with the image URL
          await updatePost(result.postId, { imageUrl });
        }
      }

      Alert.alert("Success", "Event created successfully!");
      setShowCreateModal(false);
      setSelectedImage(null);
      loadPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  const handleSubmitUpdate = async () => {
    if (!selectedPost) return;

    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    setSubmitting(true);
    setUploadingImage(true);
    try {
      let imageUrl: string | undefined = selectedImage || undefined;

      // If there's a new image (local URI), upload it
      if (selectedImage && !selectedImage.startsWith("http")) {
        const uploadResult = await uploadPostImage(selectedImage, selectedPost.id);
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
        }
      }

      const result = await updatePost(selectedPost.id, {
        title: title.trim(),
        description: description.trim(),
        date: date.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        imageUrl,
      });

      if (result.success) {
        Alert.alert("Success", "Event updated successfully!");
        setShowEditModal(false);
        setSelectedImage(null);
        loadPosts();
      } else {
        Alert.alert("Error", result.error || "Failed to update event");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setStartTime(selectedTime);
      // If end time is before start time, adjust it
      if (selectedTime >= endTime) {
        const newEndTime = new Date(selectedTime);
        newEndTime.setHours(newEndTime.getHours() + 1);
        setEndTime(newEndTime);
      }
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const renderPost = (post: Post) => {
    const isOwnPost = post.userId === auth.currentUser?.uid;
    const hasLiked = (post.likes || []).includes(auth.currentUser?.uid || "");

    // Calculate days until event
    const eventDate = new Date(post.date);
    const today = new Date();
    const daysUntil = Math.ceil(
      (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <View key={post.id} style={styles.postCard}>
        {/* Gradient Background Accent */}
        <View style={styles.gradientAccent} />

        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.postUserInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {post.userProfilePicture ? (
                  <Image
                    source={{ uri: post.userProfilePicture }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <IconSymbol name="person.fill" size={20} color="#fff" />
                )}
              </View>
              <View style={styles.activeIndicator} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.postUserName}>{post.userName}</Text>
              <View style={styles.postMetaRow}>
                <IconSymbol name="clock.fill" size={11} color="#9ca3af" />
                <Text style={styles.postTime}>
                  {formatRelativeTime(post.createdAt)}
                </Text>
              </View>
            </View>
          </View>
          {isOwnPost && (
            <View style={styles.postActions}>
              <TouchableOpacity
                onPress={() => handleEditPost(post)}
                style={styles.actionButton}
              >
                <IconSymbol name="pencil" size={16} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeletePost(post)}
                style={[styles.actionButton, { backgroundColor: "#fee2e2" }]}
              >
                <IconSymbol name="trash" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Post Content */}
        <View style={styles.postContent}>
          <View style={styles.titleRow}>
            <Text style={styles.postTitle}>{post.title}</Text>
            {daysUntil >= 0 && daysUntil <= 7 && (
              <View
                style={[
                  styles.urgencyBadge,
                  daysUntil <= 2
                    ? styles.urgencyBadgeHigh
                    : styles.urgencyBadgeMedium,
                ]}
              >
                <IconSymbol
                  name="clock.fill"
                  size={10}
                  color={daysUntil <= 2 ? "#ef4444" : "#f59e0b"}
                />
                <Text
                  style={[
                    styles.urgencyText,
                    daysUntil <= 2
                      ? styles.urgencyTextHigh
                      : styles.urgencyTextMedium,
                  ]}
                >
                  {daysUntil === 0
                    ? "Today"
                    : daysUntil === 1
                    ? "Tomorrow"
                    : `${daysUntil}d`}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.postDescription}>{post.description}</Text>

          {/* Post Image */}
          {post.imageUrl && (
            <View style={styles.postImageContainer}>
              <Image
                source={{ uri: post.imageUrl }}
                style={styles.postImage}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Event Date & Time Card */}
          <View style={styles.eventDateCard}>
            <View style={styles.dateIconContainer}>
              <IconSymbol name="calendar" size={18} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>Event Date</Text>
              <Text style={styles.dateValue}>{formatPostDate(post.date)}</Text>
            </View>
          </View>

          {/* Event Time Card */}
          {post.startTime && post.endTime && (
            <View style={styles.eventDateCard}>
              <View style={styles.dateIconContainer}>
                <IconSymbol name="clock" size={18} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateLabel}>Event Time</Text>
                <Text style={styles.dateValue}>
                  {formatPostTime(post.startTime)} - {formatPostTime(post.endTime)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Post Footer with Like Button */}
        <View style={styles.postFooter}>
          <TouchableOpacity
            style={[styles.likeButton, hasLiked && styles.likeButtonActive]}
            onPress={() => handleLikePress(post)}
            activeOpacity={0.7}
          >
            <IconSymbol
              name={hasLiked ? "heart.fill" : "heart"}
              size={18}
              color={hasLiked ? "#ef4444" : "#9ca3af"}
            />
            <Text style={[styles.likeCount, hasLiked && styles.likeCountActive]}>
              {(post.likeCount || 0) > 0 ? post.likeCount : "Like"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPostModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() =>
        isEdit ? setShowEditModal(false) : setShowCreateModal(false)
      }
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {isEdit ? "Edit Event" : "Create New Event"}
              </Text>
              <Text style={styles.modalSubtitle}>
                Share an event with your community
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                isEdit ? setShowEditModal(false) : setShowCreateModal(false)
              }
              style={styles.closeButton}
            >
              <IconSymbol name="xmark" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter event title"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Description Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="What's this event about?"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Date Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Event Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.dateButtonIcon}>
                  <IconSymbol name="calendar" size={18} color="#3b82f6" />
                </View>
                <Text style={styles.dateButtonText}>
                  {formatPostDate(date.toISOString())}
                </Text>
                <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
              </TouchableOpacity>
              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onDateChange}
                    minimumDate={new Date()}
                    themeVariant="light"
                    accentColor="#2563eb"
                    textColor="#111827"
                    locale="en-US"
                  />
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      style={styles.datePickerDoneButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Start Time Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Start Time <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <View style={styles.timeButtonIcon}>
                  <IconSymbol name="clock" size={18} color="#10b981" />
                </View>
                <Text style={styles.timeButtonText}>
                  {formatPostTime(startTime.toISOString())}
                </Text>
                <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
              </TouchableOpacity>
              {showStartTimePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onStartTimeChange}
                    themeVariant="light"
                    accentColor="#10b981"
                    textColor="#111827"
                  />
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      style={[styles.datePickerDoneButton, { backgroundColor: "#10b981" }]}
                      onPress={() => setShowStartTimePicker(false)}
                    >
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* End Time Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                End Time <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.timeButton, styles.timeButtonEnd]}
                onPress={() => setShowEndTimePicker(true)}
              >
                <View style={[styles.timeButtonIcon, styles.timeButtonIconEnd]}>
                  <IconSymbol name="clock" size={18} color="#ef4444" />
                </View>
                <Text style={styles.timeButtonText}>
                  {formatPostTime(endTime.toISOString())}
                </Text>
                <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
              </TouchableOpacity>
              {showEndTimePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onEndTimeChange}
                    themeVariant="light"
                    accentColor="#ef4444"
                    textColor="#111827"
                  />
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      style={[styles.datePickerDoneButton, { backgroundColor: "#ef4444" }]}
                      onPress={() => setShowEndTimePicker(false)}
                    >
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Image Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Event Image (Optional)</Text>
              {selectedImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={removeImage}
                  >
                    <IconSymbol name="xmark.circle.fill" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={pickImage}
                >
                  <View style={styles.imagePickerIcon}>
                    <IconSymbol name="photo" size={24} color="#3b82f6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.imagePickerText}>Add Event Image</Text>
                    <Text style={styles.imagePickerSubtext}>
                      Choose from your photo library
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={isEdit ? handleSubmitUpdate : handleSubmitCreate}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconSymbol
                    name={isEdit ? "checkmark.circle.fill" : "plus.circle.fill"}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.submitButtonText}>
                    {isEdit ? "Update Event" : "Create Event"}
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
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Events Feed</Text>
            <Text style={styles.headerSubtitle}>
              {posts.length} {posts.length === 1 ? "event" : "events"} shared
            </Text>
          </View>
        </View>

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <IconSymbol
                name="calendar.badge.exclamationmark"
                size={40}
                color="#3b82f6"
              />
            </View>
            <Text style={styles.emptyText}>No events yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to share an event with your community!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleCreatePost}
            >
              <Text style={styles.emptyButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.postsContainer}>
            {posts.map((post) => renderPost(post))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreatePost}>
        <IconSymbol name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      {renderPostModal(false)}
      {renderPostModal(true)}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  postsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    position: "relative",
  },
  gradientAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#3b82f6",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 18,
    paddingBottom: 12,
  },
  postUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
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
  activeIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    borderWidth: 2,
    borderColor: "#fff",
  },
  postUserName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  postMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  postTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  postActions: {
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
  postContent: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 26,
    flex: 1,
  },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  urgencyBadgeHigh: {
    backgroundColor: "#fee2e2",
  },
  urgencyBadgeMedium: {
    backgroundColor: "#fef3c7",
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: "700",
  },
  urgencyTextHigh: {
    color: "#ef4444",
  },
  urgencyTextMedium: {
    color: "#f59e0b",
  },
  postDescription: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 16,
  },
  eventDateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  dateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
    marginTop: 2,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  likeButton: {
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
  likeButtonActive: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
  },
  likeCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
  },
  likeCountActive: {
    color: "#ef4444",
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
  required: {
    color: "#ef4444",
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
    height: 120,
    textAlignVertical: "top",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dateButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  timeButtonEnd: {
    backgroundColor: "#f9fafb",
  },
  timeButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
  },
  timeButtonIconEnd: {
    backgroundColor: "#fee2e2",
  },
  timeButtonText: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },
  datePickerContainer: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  datePickerDoneButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  datePickerDoneText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
  postImageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  postImage: {
    width: "100%",
    height: 200,
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  imagePickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePickerText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },
  imagePickerSubtext: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 14,
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

"use client";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  addComment,
  createPost,
  deletePost,
  fetchComments,
  fetchPosts,
  formatPostDate,
  formatPostTime,
  formatRelativeTime,
  toggleLike,
  updatePost,
  uploadPostImage,
} from "@/helpers/feedHelper";
import { Comment, Post } from "@/types/feed";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
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
  
  // Comment state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUserProfilePicture, setCurrentUserProfilePicture] = useState<string>("");
  const [replyingToComment, setReplyingToComment] = useState<Comment | null>(null);
  
  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");

  useEffect(() => {
    loadPosts();
    loadCurrentUserProfile();
  }, []);

  const loadCurrentUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const usersRef = collection(db, "Users");
      const q = query(usersRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const profilePicture = userData.profilePicture || userData.profilePictureUrl || "";
        setCurrentUserProfilePicture(profilePicture);
      }
    } catch (error) {
      console.error("Error loading current user profile:", error);
    }
  };

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

  const openCommentsModal = async (post: Post) => {
    setSelectedPostForComments(post);
    setCommentModalVisible(true);
    setCommentText("");
    
    // Fetch comments if not already loaded
    if (!post.comments || post.comments.length === 0) {
      const fetchedComments = await fetchComments(post.id);
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === post.id
            ? { ...p, comments: fetchedComments, commentCount: fetchedComments.length }
            : p
        )
      );
      // Update selected post with comments
      setSelectedPostForComments({ ...post, comments: fetchedComments, commentCount: fetchedComments.length });
    }
  };

  const closeCommentsModal = () => {
    setCommentModalVisible(false);
    setSelectedPostForComments(null);
    setCommentText("");
    setReplyingToComment(null);
  };

  const handleReplyToComment = (comment: Comment) => {
    setReplyingToComment(comment);
    setCommentText(`@${comment.userName} `);
  };

  const cancelReply = () => {
    setReplyingToComment(null);
    setCommentText("");
  };

  const handleSubmitComment = async () => {
    if (!selectedPostForComments || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const textToSubmit = replyingToComment 
        ? commentText.replace(`@${replyingToComment.userName} `, "").trim()
        : commentText.trim();
      
      if (!textToSubmit) {
        Alert.alert("Error", "Please enter a comment");
        setSubmittingComment(false);
        return;
      }

      const result = await addComment(
        selectedPostForComments.id, 
        textToSubmit,
        replyingToComment?.id
      );
      if (result.success) {
        // Refresh comments
        const fetchedComments = await fetchComments(selectedPostForComments.id);
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === selectedPostForComments.id
              ? {
                  ...p,
                  comments: fetchedComments,
                  commentCount: fetchedComments.length,
                }
              : p
          )
        );
        // Update selected post with new comments
        setSelectedPostForComments({
          ...selectedPostForComments,
          comments: fetchedComments,
          commentCount: fetchedComments.length,
        });
        // Clear comment text and reply state
        setCommentText("");
        setReplyingToComment(null);
      } else {
        Alert.alert("Error", result.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSubmittingComment(false);
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
      <View key={post.id} style={styles.postCardWrapper}>
        <View style={styles.postCard}>
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
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.postUserName}>{post.userName}</Text>
                <View style={styles.postMetaRow}>
                  <Text style={styles.postTime}>
                    {formatRelativeTime(post.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
            {isOwnPost && (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Post Options",
                    "Choose an action",
                    [
                      {
                        text: "Edit",
                        onPress: () => handleEditPost(post),
                      },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => handleDeletePost(post),
                      },
                      { text: "Cancel", style: "cancel" },
                    ]
                  );
                }}
                style={styles.postMenuButton}
              >
                <IconSymbol name="ellipsis" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Post Image - Full width */}
          {post.imageUrl && (
            <TouchableOpacity
              style={styles.postImageContainer}
              onPress={() => {
                setSelectedImageUrl(post.imageUrl || "");
                setImageViewerVisible(true);
              }}
              activeOpacity={0.95}
            >
              <Image
                source={{ uri: post.imageUrl }}
                style={styles.postImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}

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

            {/* Event Date & Time - Better layout */}
            <View style={styles.eventDateTimeContainer}>
              <View style={styles.eventDateTimeItem}>
                <View style={styles.eventIconContainer}>
                  <IconSymbol name="calendar" size={14} color="#3b82f6" />
                </View>
                <Text style={styles.eventDateTimeText}>{formatPostDate(post.date)}</Text>
              </View>
              {post.startTime && post.endTime && (
                <View style={styles.eventDateTimeItem}>
                  <View style={[styles.eventIconContainer, styles.eventTimeIconContainer]}>
                    <IconSymbol name="clock" size={14} color="#10b981" />
                  </View>
                  <Text style={styles.eventDateTimeText}>
                    {formatPostTime(post.startTime)} - {formatPostTime(post.endTime)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Post Footer with Like and Comment Buttons */}
          <View style={styles.postFooter}>
            <TouchableOpacity
              style={styles.footerActionButton}
              onPress={() => handleLikePress(post)}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={hasLiked ? "heart.fill" : "heart"}
                size={22}
                color={hasLiked ? "#ef4444" : "#262626"}
              />
              {(post.likeCount || 0) > 0 && (
                <Text style={[styles.footerActionText, hasLiked && styles.likeCountActive]}>
                  {(post.likeCount || 0).toLocaleString()}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.footerActionButton}
              onPress={() => openCommentsModal(post)}
              activeOpacity={0.7}
            >
              <IconSymbol
                name="bubble.left.and.bubble.right"
                size={22}
                color="#262626"
              />
              {(post.commentCount || 0) > 0 && (
                <Text style={styles.footerActionText}>
                  {(post.commentCount || 0).toLocaleString()}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderImageViewer = () => {
    if (!selectedImageUrl) return null;

    return (
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setImageViewerVisible(false);
          setSelectedImageUrl("");
        }}
      >
        <TouchableOpacity
          style={styles.imageViewerOverlay}
          activeOpacity={1}
          onPress={() => {
            setImageViewerVisible(false);
            setSelectedImageUrl("");
          }}
        >
          <View style={styles.imageViewerContainer}>
            <Image
              source={{ uri: selectedImageUrl }}
              style={styles.imageViewerImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={[styles.imageViewerCloseButton, { top: insets.top + 20 }]}
              onPress={() => {
                setImageViewerVisible(false);
                setSelectedImageUrl("");
              }}
            >
              <IconSymbol name="xmark.circle.fill" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderCommentsModal = () => {
    if (!selectedPostForComments) return null;

    return (
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeCommentsModal}
      >
        <View style={styles.commentsModalOverlay}>
          <TouchableOpacity
            style={styles.commentsModalBackdrop}
            activeOpacity={1}
            onPress={closeCommentsModal}
          />
          <View style={[styles.commentsModalContent, { paddingBottom: insets.bottom }]}>
            {/* Modal Header */}
            <View style={styles.commentsModalHeader}>
              <View style={styles.commentsModalHeaderLine} />
              <View style={styles.commentsModalHeaderContent}>
                <Text style={styles.commentsModalTitle}>Comments</Text>
                <TouchableOpacity
                  onPress={closeCommentsModal}
                  style={styles.commentsModalCloseButton}
                >
                  <IconSymbol name="xmark" size={20} color="#111827" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments List */}
            <ScrollView
              style={styles.commentsModalList}
              showsVerticalScrollIndicator={true}
            >
              {selectedPostForComments.comments && selectedPostForComments.comments.length > 0 ? (
                selectedPostForComments.comments.map((comment: Comment) => (
                  <View key={comment.id}>
                    <View style={styles.commentItem}>
                      <View style={styles.commentAvatar}>
                        {comment.userProfilePicture ? (
                          <Image
                            source={{ uri: comment.userProfilePicture }}
                            style={styles.commentAvatarImage}
                          />
                        ) : (
                          <View style={styles.commentAvatarPlaceholder}>
                            <IconSymbol name="person.fill" size={14} color="#fff" />
                          </View>
                        )}
                      </View>
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.commentUserName}>{comment.userName}</Text>
                          <Text style={styles.commentTime}>
                            {formatRelativeTime(comment.createdAt)}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>{comment.text}</Text>
                        <TouchableOpacity
                          onPress={() => handleReplyToComment(comment)}
                          style={styles.replyButton}
                        >
                          <Text style={styles.replyButtonText}>Reply</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <View style={styles.repliesContainer}>
                        {comment.replies.map((reply: Comment) => (
                          <View key={reply.id} style={styles.replyItem}>
                            <View style={styles.replyAvatar}>
                              {reply.userProfilePicture ? (
                                <Image
                                  source={{ uri: reply.userProfilePicture }}
                                  style={styles.replyAvatarImage}
                                />
                              ) : (
                                <View style={styles.replyAvatarPlaceholder}>
                                  <IconSymbol name="person.fill" size={12} color="#fff" />
                                </View>
                              )}
                            </View>
                            <View style={styles.replyContent}>
                              <View style={styles.commentHeader}>
                                <Text style={styles.commentUserName}>{reply.userName}</Text>
                                <Text style={styles.commentTime}>
                                  {formatRelativeTime(reply.createdAt)}
                                </Text>
                              </View>
                              <Text style={styles.commentText}>{reply.text}</Text>
                              <TouchableOpacity
                                onPress={() => handleReplyToComment(comment)}
                                style={styles.replyButton}
                              >
                                <Text style={styles.replyButtonText}>Reply</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.commentsEmptyContainer}>
                  <IconSymbol
                    name="bubble.left.and.bubble.right"
                    size={40}
                    color="#d1d5db"
                  />
                  <Text style={styles.commentsEmptyText}>No comments yet</Text>
                  <Text style={styles.commentsEmptySubtext}>
                    Be the first to comment!
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Reply Indicator */}
            {replyingToComment && (
              <View style={styles.replyIndicator}>
                <View style={styles.replyIndicatorContent}>
                  <Text style={styles.replyIndicatorText}>
                    Replying to <Text style={styles.replyIndicatorName}>{replyingToComment.userName}</Text>
                  </Text>
                  <TouchableOpacity onPress={cancelReply} style={styles.replyIndicatorClose}>
                    <IconSymbol name="xmark" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Comment Input - Fixed at bottom */}
            <View style={[styles.commentInputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <View style={styles.commentInputAvatar}>
                {currentUserProfilePicture ? (
                  <Image
                    source={{ uri: currentUserProfilePicture }}
                    style={styles.commentInputAvatarImage}
                  />
                ) : (
                  <View style={styles.commentInputAvatarPlaceholder}>
                    <IconSymbol name="person.fill" size={12} color="#fff" />
                  </View>
                )}
              </View>
              <TextInput
                style={styles.commentInput}
                placeholder={replyingToComment ? `Reply to ${replyingToComment.userName}...` : "Add a comment..."}
                placeholderTextColor="#9ca3af"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.commentSubmitButton,
                  (!commentText.trim() || submittingComment) &&
                    styles.commentSubmitButtonDisabled,
                ]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim() || submittingComment}
                activeOpacity={0.7}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconSymbol name="arrow.up.circle.fill" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

      {/* Comments Modal */}
      {renderCommentsModal()}

      {/* Full Screen Image Viewer */}
      {renderImageViewer()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
    backgroundColor: "#ffffff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8e8e8e",
    marginTop: 4,
    fontWeight: "400",
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
    paddingBottom: 120,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  postCardWrapper: {
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: -0.2,
  },
  postMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  postTime: {
    fontSize: 12,
    color: "#8e8e8e",
    fontWeight: "400",
  },
  postMenuButton: {
    padding: 8,
    marginRight: -8,
  },
  postContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 10,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    lineHeight: 22,
    flex: 1,
    letterSpacing: -0.2,
  },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
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
    fontSize: 14,
    color: "#262626",
    lineHeight: 20,
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  eventDateTimeContainer: {
    flexDirection: "column",
    gap: 8,
    marginTop: 4,
  },
  eventDateTimeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  eventIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  eventTimeIconContainer: {
    backgroundColor: "#ecfdf5",
  },
  eventDateTimeText: {
    fontSize: 13,
    color: "#262626",
    fontWeight: "500",
    flex: 1,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#efefef",
    gap: 24,
  },
  footerActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  footerActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#262626",
  },
  likeCountActive: {
    color: "#262626",
  },
  commentsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  commentsModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  commentsModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "90%",
    minHeight: "60%",
    flexDirection: "column",
    overflow: "hidden",
  },
  commentsModalHeader: {
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  commentsModalHeaderLine: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  commentsModalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  commentsModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  commentsModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  commentsModalList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  commentsEmptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  commentsEmptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
  },
  commentsEmptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
    paddingVertical: 4,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#3b82f6",
  },
  commentAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },
  commentContent: {
    flex: 1,
    paddingTop: 2,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  commentTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  commentText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  replyButton: {
    marginTop: 6,
    paddingVertical: 4,
  },
  replyButtonText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  repliesContainer: {
    marginLeft: 48,
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#e5e7eb",
  },
  replyItem: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 10,
    paddingVertical: 4,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#3b82f6",
  },
  replyAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  replyAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },
  replyContent: {
    flex: 1,
    paddingTop: 2,
  },
  replyIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  replyIndicatorContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  replyIndicatorText: {
    fontSize: 13,
    color: "#6b7280",
  },
  replyIndicatorName: {
    fontWeight: "600",
    color: "#111827",
  },
  replyIndicatorClose: {
    padding: 4,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#fff",
    minHeight: 70,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#3b82f6",
    marginBottom: 4,
  },
  commentInputAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInputAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    maxHeight: 100,
    minHeight: 40,
  },
  commentSubmitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: "#d1d5db",
    opacity: 0.5,
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
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  postImage: {
    width: "100%",
    height: 450,
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
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  imageViewerImage: {
    width: "100%",
    height: "100%",
  },
  imageViewerCloseButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

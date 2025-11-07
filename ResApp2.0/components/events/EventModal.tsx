import { IconSymbol } from "@/components/ui/icon-symbol";
import { Event, EventCategory } from "@/types/event";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface EventModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    category: EventCategory;
    deadline: Date;
    imageUri: string;
  }) => Promise<void>;
  editEvent?: Event | null;
}

export default function EventModal({ visible, onClose, onSubmit, editEvent }: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EventCategory>("Cat1");
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [imageUri, setImageUri] = useState("");
  const [loading, setLoading] = useState(false);

  // Load edit data
  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setDescription(editEvent.description);
      setCategory(editEvent.category);
      setDeadline(new Date(editEvent.deadline));
      setImageUri(editEvent.imageUrl);
    } else {
      resetForm();
    }
  }, [editEvent, visible]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Cat1");
    setDeadline(new Date());
    setImageUri("");
  };

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      console.log("Permission result:", permissionResult);
      
      if (permissionResult.status !== "granted") {
        Alert.alert(
          "Permission Required", 
          "Please allow access to your photo library in Settings to select images.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
          ]
        );
        return;
      }

      console.log("Launching image picker...");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"] as any,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log("Selected image URI:", selectedImage.uri);
        setImageUri(selectedImage.uri);
      } else {
        console.log("Image selection cancelled or no image selected");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert("Validation Error", "Please enter a title");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Validation Error", "Please enter a description");
      return;
    }
    if (!imageUri) {
      Alert.alert("Validation Error", "Please select an image");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        deadline,
        imageUri,
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error submitting event:", error);
      Alert.alert("Error", "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editEvent ? "Edit Event" : "Create Event"}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <IconSymbol name="xmark" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter event title"
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter event description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryContainer}>
                {(["Cat1", "Cat2", "Cat3"] as EventCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.categoryButtonActive,
                    ]}
                    onPress={() => setCategory(cat)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat && styles.categoryTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Deadline Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Deadline *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <IconSymbol name="calendar" size={20} color="#3b82f6" />
                <Text style={styles.dateText}>
                  {deadline.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={deadline}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Image Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Image *</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickImage}
                disabled={loading}
                activeOpacity={0.7}
              >
                {imageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={{ uri: imageUri }} 
                      style={styles.selectedImage}
                      resizeMode="cover"
                      onError={(e) => {
                        console.error("Preview image error:", e.nativeEvent.error);
                      }}
                    />
                    <View style={styles.changeImageOverlay}>
                      <IconSymbol name="photo" size={24} color="#fff" />
                      <Text style={styles.changeImageText}>Tap to change</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <IconSymbol name="photo" size={40} color="#999" />
                    <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editEvent ? "Update Event" : "Create Event"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#000",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  categoryContainer: {
    flexDirection: "row",
    gap: 10,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  categoryButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  categoryTextActive: {
    color: "#fff",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 10,
  },
  dateText: {
    fontSize: 15,
    color: "#000",
  },
  imagePickerButton: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  imagePreviewContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  selectedImage: {
    width: "100%",
    height: 200,
  },
  changeImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  changeImageText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
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


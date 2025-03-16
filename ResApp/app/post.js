import React, { useState } from 'react';
import { 
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from './config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function NewPost() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Launch image picker for selecting an image
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick image");
    }
  };

  // Handle post submission
  const handlePost = async () => {
    // Dismiss keyboard on submit
    Keyboard.dismiss();

    if (!title.trim() && !content.trim() && !imageUri) {
      Alert.alert("Error", "Please provide a title, content, or image for your post.");
      return;
    }
    setUploading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }
      // Create post object
      const postData = {
        title,
        content,
        image: imageUri || null,
        likes: 0,
        createdAt: serverTimestamp(),
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email,
        },
      };
      // Add post to Firestore's "posts" collection
      await addDoc(collection(db, "posts"), postData);
      Alert.alert("Success", "Post created successfully!");
      router.replace("/home"); // Redirect to the Home screen
    } catch (error) {
      console.error("Error creating post: ", error);
      Alert.alert("Error", error.toString());
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Dismiss keyboard when tapping outside inputs */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.header}>Create a New Post</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Content"
            placeholderTextColor="#666"
            value={content}
            onChangeText={setContent}
            multiline
          />
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>
              {imageUri ? "Change Image" : "Add Image"}
            </Text>
          </TouchableOpacity>
          {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

          {uploading ? (
            <ActivityIndicator size="large" color="#333" style={{ marginTop: 20 }} />
          ) : (
            <TouchableOpacity style={styles.postButton} onPress={handlePost}>
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#fff" 
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#f9f9f9",
  },
  imageButton: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  imageButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  postButton: {
    backgroundColor: "#27ae60",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  postButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

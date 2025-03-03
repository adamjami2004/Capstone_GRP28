import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function Post() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);

  // Function to select an image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = () => {
    if (!content.trim() && !image) {
      Alert.alert('Error', 'Post must have either text or an image.');
      return;
    }

    Keyboard.dismiss(); // Close keyboard before navigating

    const newPost = {
      id: Date.now().toString(),
      user: 'You',
      content: content,
      image: image,
      likes: 0,
    };

    router.push({
      pathname: '/home/',
      params: { newPost: JSON.stringify(newPost) },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>Create a Post</Text>
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            multiline
            value={content}
            onChangeText={setContent}
          />

          {/* Button to Select Image */}
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>📷 Select an Image</Text>
          </TouchableOpacity>

          {/* Show Selected Image */}
          {image && <Image source={{ uri: image }} style={styles.image} />}

          <TouchableOpacity style={styles.postButton} onPress={handlePost}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, fontSize: 16, height: 120, textAlignVertical: 'top' },
  imageButton: { backgroundColor: '#666', padding: 12, borderRadius: 8, alignItems: 'center', marginVertical: 10 },
  imageButtonText: { color: '#fff', fontSize: 14 },
  image: { width: '100%', height: 200, borderRadius: 10, marginTop: 10 },
  postButton: { backgroundColor: '#333', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  postButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});


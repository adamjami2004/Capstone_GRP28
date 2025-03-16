// app/comments/[postId].js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export default function PostComments() {
  const { postId } = useLocalSearchParams();   // postId from the dynamic route
  const router = useRouter();
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  // 1) Listen to real-time comments for this post
  useEffect(() => {
    if (!postId) return;

    const commentsRef = collection(db, 'posts', postId, 'comments');
    const unsubscribe = onSnapshot(
      commentsRef,
      (snapshot) => {
        const commentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(commentsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching comments:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [postId]);

  // 2) Add a new comment to Firestore
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Comment cannot be empty.');
      return;
    }
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated.');
        return;
      }
      // Create a new comment doc in the subcollection
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text: newComment,
        createdAt: serverTimestamp(),
        user: {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email,
        },
      });
      setNewComment(''); // Clear input
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', error.toString());
    }
  };

  // 3) Render each comment in a FlatList
  const renderComment = ({ item }) => (
    <View style={styles.comment}>
      <Text style={styles.commentUser}>
      {item.user?.displayName || item.user?.email || "Unknown"}
      </Text>
      <Text style={styles.commentText}>{item.text}</Text>
    </View>
  );

  // 4) UI
  return (
    <View style={styles.container}>
      {/* Header row with a back button */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quit</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Comments</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#333" style={{ marginVertical: 20 }} />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Input for adding new comments */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#666"
          value={newComment}
          onChangeText={setNewComment}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: '#ccc',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 15,
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  comment: {
    marginVertical: 8,
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },
  commentUser: {
    fontWeight: 'bold',
    color: '#333',
  },
  commentText: {
    marginTop: 4,
    color: '#555',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 10,
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

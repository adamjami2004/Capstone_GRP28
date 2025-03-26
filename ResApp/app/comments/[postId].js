import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const { width } = Dimensions.get('window');

export default function PostComments() {
  const { postId } = useLocalSearchParams();   
  const router = useRouter();
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

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
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text: newComment,
        createdAt: serverTimestamp(),
        user: {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email,
          photoURL: currentUser.photoURL || 'https://via.placeholder.com/40',
        },
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', error.toString());
    }
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      <Image 
        source={{ uri: item.user?.photoURL || 'https://via.placeholder.com/40' }} 
        style={styles.profileImage} 
      />
      <View style={styles.commentContent}>
        <Text style={styles.commentUser}>
          {item.user?.displayName || "Unknown"}
        </Text>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Instagram-style Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#333" style={styles.loader} />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          contentContainerStyle={styles.commentsList}
          ListEmptyComponent={
            <Text style={styles.emptyComments}>No comments yet</Text>
          }
        />
      )}

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        <Image 
          source={{ 
            uri: auth.currentUser?.photoURL || 'https://via.placeholder.com/40' 
          }} 
          style={styles.currentUserImage} 
        />
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#888"
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={handleAddComment}
          disabled={!newComment.trim()}
        >
          <Text style={[
            styles.sendButtonText, 
            { color: newComment.trim() ? '#0095f6' : '#b2dffc' }
          ]}>
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'white' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15
  },
  loader: { 
    marginVertical: 20 
  },
  commentsList: {
    paddingHorizontal: 15,
    paddingTop: 15
  },
  emptyComments: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  commentContent: {
    flex: 1
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 14
  },
  commentText: {
    fontSize: 14,
    color: '#333'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  currentUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#000'
  },
  sendButton: {
    marginLeft: 10
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600'
  }
});
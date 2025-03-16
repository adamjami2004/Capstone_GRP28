// app/home/index.js
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  increment, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Toggle Like: if user has liked, we unlike; otherwise, we like
  const handleToggleLike = async (post) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const postRef = doc(db, "posts", post.id);

      // Check if current user has already liked this post
      const isLiked = post.likedBy?.includes(currentUser.uid);

      if (isLiked) {
        // UNLIKE: remove user from likedBy array, decrement likes
        await updateDoc(postRef, {
          likedBy: arrayRemove(currentUser.uid),
          likes: increment(-1),
        });
      } else {
        // LIKE: add user to likedBy array, increment likes
        await updateDoc(postRef, {
          likedBy: arrayUnion(currentUser.uid),
          likes: increment(1),
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const renderPost = ({ item }) => {
    const currentUser = auth.currentUser;
    const isLiked = currentUser && item.likedBy?.includes(currentUser.uid);
    const heartIcon = isLiked ? '❤️' : '🤍';  // Red heart if liked, white/empty if not

    return (
      <View style={styles.post}>
        <Text style={styles.user}>
          {item.user?.displayName || item.user?.email || "Unknown"}
        </Text>
        <Text style={styles.title}>{item.title}</Text>
        {item.content ? <Text style={styles.content}>{item.content}</Text> : null}
        {item.image ? <Image source={{ uri: item.image }} style={styles.image} /> : null}
        
        <View style={styles.actions}>
          {/* Like/Unlike Button */}
          <TouchableOpacity style={styles.actionButton} onPress={() => handleToggleLike(item)}>
            <Text style={styles.actionText}>
              {heartIcon} {item.likes || 0}
            </Text>
          </TouchableOpacity>

          {/* Comments Button */}
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => router.push(`/comments/${item.id}`)}
          >
            <Text style={styles.actionText}>💬 Comments</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
      />
      <TouchableOpacity
        style={styles.newPostButton}
        onPress={() => router.push('/post')}
      >
        <Text style={styles.newPostText}>+ New Post</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  post: { backgroundColor: '#fff', padding: 15, marginVertical: 8, borderRadius: 10, elevation: 2 },
  user: { fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 18, fontWeight: '600', marginVertical: 4 },
  content: { marginTop: 5, fontSize: 14 },
  image: { width: '100%', height: 200, borderRadius: 10, marginTop: 10 },
  actions: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' },
  actionButton: { padding: 5 },
  actionText: { fontSize: 16, color: '#333' },
  newPostButton: { backgroundColor: '#333', padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 20 },
  newPostText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

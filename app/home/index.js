import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet
} from 'react-native';

const initialPosts = [
  {
    id: '1',
    user: 'Alice',
    content: 'Hey everyone! Excited for the upcoming event? 🎉',
    image: null,
    likes: 5,
  },
  {
    id: '2',
    user: 'Bob',
    content: 'Does anyone know when the laundry room is free?',
    image: null,
    likes: 2,
  },
];

export default function Home() {
  const router = useRouter();
  const { newPost } = useLocalSearchParams();
  const [posts, setPosts] = useState(initialPosts);

  useEffect(() => {
    if (newPost) {
      try {
        const parsedPost = JSON.parse(newPost);
        setPosts((prevPosts) => [parsedPost, ...prevPosts]);
      } catch (error) {
        console.error('Error parsing new post:', error);
      }
    }
  }, [newPost]);

  const renderPost = ({ item }) => (
    <View style={styles.post}>
      <Text style={styles.user}>{item.user}</Text>
      <Text style={styles.content}>{item.content}</Text>

      {/* Show Image If Available */}
      {item.image && <Image source={{ uri: item.image }} style={styles.image} />}

      <Text style={styles.likes}>❤️ {item.likes} Likes</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList data={posts} keyExtractor={(item) => item.id} renderItem={renderPost} />

      {/* New Post Button */}
      <TouchableOpacity style={styles.newPostButton} onPress={() => router.push('/post')}>
        <Text style={styles.newPostText}>+ New Post</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 10 },
  post: { backgroundColor: '#fff', padding: 15, marginVertical: 8, borderRadius: 10, elevation: 2 },
  user: { fontWeight: 'bold', fontSize: 16 },
  content: { marginTop: 5, fontSize: 14 },
  likes: { marginTop: 8, color: 'gray', fontSize: 12 },
  image: { width: '100%', height: 200, borderRadius: 10, marginTop: 10 },
  newPostButton: { backgroundColor: '#333', padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 20 },
  newPostText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

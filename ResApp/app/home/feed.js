import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
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

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const imageUris = [
    'https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3R1ZGVudCUyMGV2ZW50fGVufDB8fDB8fHww',
    'https://images.unsplash.com/photo-1597893311798-9911ea4af043?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ];
  
  const getRandomImageUri = () => {
    return imageUris[Math.floor(Math.random() * imageUris.length)];
  };

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

  const handleToggleLike = async (post) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const postRef = doc(db, "posts", post.id);
      const isLiked = post.likedBy?.includes(currentUser.uid);

      if (isLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(currentUser.uid),
          likes: increment(-1),
        });
      } else {
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

    return (
      <View style={styles.postContainer}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          
          <View style={styles.post_id}>
            <Image 
              source={{ uri: item.user?.photoURL || 'https://th.bing.com/th/id/OIP.abbHwUGf7cWF1KrClYxa5AHaHa?w=182&h=182&c=7&r=0&o=5&dpr=1.3&pid=1.7' }} 
              style={styles.profileImage} 
            />
            <Text style={styles.username}>
              {item.user?.displayName || "Unknown"}
            </Text>
          </View>
          <Ionicons name="ellipsis-horizontal-outline" size={32} color="black"  />


        </View>

        {/* Post Image */}
        {item.image && (
          <Image 
            source={{ uri: getRandomImageUri() }} 
            style={styles.postImage} 
            resizeMode="cover"
          />
        )}

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity onPress={() => handleToggleLike(item)}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={isLiked ? "red" : "black"} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/comments/${item.id}`)}>
            <Ionicons name="chatbubble-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* Post Details */}
        <View style={styles.postDetails}>
          <Text style={styles.likesCount}>{item.likes || 0} likes</Text>
          <Text style={styles.postContent}>
            <Text style={styles.username}>{item.user?.displayName || "Unknown"} </Text>
            {item.content}
          </Text>
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
      {/* Instagram-like Header */}
      <View style={styles.header}>
        <View style={styles.logo_res}>
          <Ionicons name="leaf" size={32} color="#009757" />
          <Text style={styles.headerTitle}>Res App Feed</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/post')}>
          <Ionicons name="add-circle-outline" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft:10
  },
  logo_res:{
    flexDirection:'row'
    ,alignItems:'center'
  },
  post_id:{
    flexDirection:'row'
    ,alignItems:'center'
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  postContainer: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    justifyContent:'space-between'
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  username: {
    fontWeight: 'bold'
  },
  postImage: {
    width: width,
    height: width,
  },
  postActions: {
    flexDirection: 'row',
    padding: 10,
    gap: 15
  },
  postDetails: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    marginBottom:20,
  },
  likesCount: {
    fontWeight: 'bold',
    marginBottom: 5
  },
  postContent: {
    fontSize: 14
  }
});
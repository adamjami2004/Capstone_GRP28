// app/home/chat/index.js
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ChatList() {
  const router = useRouter();
  // Dummy data for existing chats
  const [chats, setChats] = useState([
    { id: '1', partner: 'Adam', lastMessage: 'I am gay' },
    { id: '2', partner: 'Tachfine', lastMessage: 'Fine requirements ?' },
  ]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() =>
        router.push(`/home/chat/${item.id}?partner=${encodeURIComponent(item.partner)}`)
      }
    >
      <Text style={styles.partnerName}>{item.partner}</Text>
      <Text style={styles.lastMessage}>{item.lastMessage}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chats</Text>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => router.push('/home/chat/new-chat')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 15,
    backgroundColor: '#f5f5f5',
    textAlign: 'center',
  },
  chatItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  partnerName: { fontSize: 18, fontWeight: 'bold' },
  lastMessage: { fontSize: 14, color: '#777', marginTop: 5 },
  newChatButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { getUserChats } from "../../services/ChatService";
import { auth } from "../../config/firebase";

export default function ChatList() {
  const router = useRouter();
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const fetchChats = async () => {
      const userChats = await getUserChats(auth.currentUser.uid);
      setChats(userChats);
    };
    fetchChats();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chats</Text>
      <FlatList data={chats} keyExtractor={(item) => item.id} renderItem={({ item }) => (
        <TouchableOpacity style={styles.chatItem} onPress={() => router.push(`/home/chat/${item.id}`)}>
          <Text style={styles.partnerName}>{item.participants.join(", ")}</Text>
        </TouchableOpacity>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: "bold", padding: 15, backgroundColor: "#f5f5f5", textAlign: "center" },
  chatItem: { padding: 15, borderBottomWidth: 1, borderColor: "#eee" },
  partnerName: { fontSize: 18, fontWeight: "bold" },
});

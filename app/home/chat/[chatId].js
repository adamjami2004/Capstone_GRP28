// app/home/chat/[chatId].js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function ChatConversation() {
  const router = useRouter();
  const { chatId, partner } = useLocalSearchParams();
  const partnerName = partner ? decodeURIComponent(partner) : 'Chat Partner';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSendText = () => {
    if (input.trim() === '') return;
    const newMessage = {
      id: Date.now().toString(),
      type: 'text',
      text: input,
      sender: 'You',
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput('');
  };

  const handleSendImage = async () => {
    // Launch image picker to select an image
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      const newMessage = {
        id: Date.now().toString(),
        type: 'image',
        imageUri,
        sender: 'You',
      };
      setMessages((prev) => [...prev, newMessage]);
    }
  };

  const renderItem = ({ item }) => {
    if (item.type === 'text') {
      return (
        <View
          style={[
            styles.messageBubble,
            item.sender === 'You' ? styles.myMessage : styles.theirMessage,
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
      );
    } else if (item.type === 'image') {
      return (
        <View
          style={[
            styles.messageBubble,
            item.sender === 'You' ? styles.myMessage : styles.theirMessage,
          ]}
        >
          <Image source={{ uri: item.imageUri }} style={styles.messageImage} />
        </View>
      );
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Custom Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{partnerName}</Text>
      </View>
      <FlatList
        style={styles.messagesList}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10, flexGrow: 1 }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.iconButton} onPress={handleSendImage}>
          <Ionicons name="image-outline" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton} onPress={handleSendText}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  headerText: { fontSize: 20, fontWeight: 'bold' },
  messagesList: { flex: 1 },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '80%',
  },
  myMessage: { backgroundColor: '#dcf8c6', alignSelf: 'flex-end' },
  theirMessage: { backgroundColor: '#eee', alignSelf: 'flex-start' },
  messageText: { fontSize: 16 },
  messageImage: { width: 200, height: 200, borderRadius: 10 },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
  },
  iconButton: {
    padding: 8,
    marginRight: 5,
  },
  sendButton: {
    backgroundColor: '#333',
    borderRadius: 25,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

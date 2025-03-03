import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

// Dummy list of connected residents
const dummyResidents = [
  { id: '1', name: 'Alice Johnson' },
  { id: '2', name: 'Bob Smith' },
  { id: '3', name: 'Charlie Brown' },
  { id: '4', name: 'Diana Prince' },
  { id: '5', name: 'Ethan Hunt' },
  // ... add more residents as needed
];

export default function NewChat() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter the residents based on the search query
  const filteredResidents = dummyResidents.filter((resident) =>
    resident.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectResident = (resident) => {
    // Generate a new chat ID (using the current timestamp for demo purposes)
    const newChatId = Date.now().toString();
    // Navigate to the chat conversation screen with the selected resident
    router.push(`/home/chat/${newChatId}?partner=${encodeURIComponent(resident.name)}`);
  };

  const renderResident = ({ item }) => (
    <TouchableOpacity style={styles.residentItem} onPress={() => handleSelectResident(item)}>
      <Text style={styles.residentName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Start a New Chat</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Search residents..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredResidents}
        keyExtractor={(item) => item.id}
        renderItem={renderResident}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  residentItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  residentName: {
    fontSize: 18,
  },
});

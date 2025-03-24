//app/(modal)/selecthairstyle.js
import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";


export default function SelectHairstyleModal({ currentHairstyle, onSelect, onClose }) {
  // Renders each hairstyle option in a grid/list
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.optionContainer}
      onPress={() => onSelect(item.key)}
    >
      <Image source={item.image} style={styles.optionImage} />
      <Text style={styles.optionLabel}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.modalContainer}>
      {/* Title row */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Hairstyle</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={hairstyleOptions}
        renderItem={renderItem}
        numColumns={2} // for a 2-column grid, adjust as you like
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 24,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 20,
  },
  optionContainer: {
    flex: 1,
    alignItems: "center",
    margin: 10,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    paddingVertical: 15,
  },
  optionImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
  },
  optionLabel: {
    fontSize: 14,
    color: "#333",
  },
});

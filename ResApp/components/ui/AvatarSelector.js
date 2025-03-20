import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";

const avatarOptions = [
    {
      uri: "https://api.dicebear.com/7.x/avataaars/png?topType=ShortHairDreads01&clotheType=BlazerShirt&accessoriesType=Blank",
    },
    {
      uri: "https://api.dicebear.com/7.x/avataaars/png?topType=LongHairStraight&clotheType=Hoodie&accessoriesType=Sunglasses",
    },
    {
      uri: "https://api.dicebear.com/7.x/avataaars/png?topType=Hat&clotheType=GraphicShirt&accessoriesType=Round",
    },
  ];
  
  export default function AvatarSelector({ selectedAvatar, onSelect }) {
    return (
      <View style={styles.container}>
        {avatarOptions.map((option, index) => (
          <TouchableOpacity key={index} onPress={() => onSelect(option.uri)}>
            <Image
              source={{ uri: option.uri }}
              style={[styles.avatar, selectedAvatar === option.uri ? styles.selectedAvatar : null]}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }
  

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 10,
    borderWidth: 2,
    borderColor: "transparent",

  },
  selectedAvatar: {
    borderColor: "green",
  },
});

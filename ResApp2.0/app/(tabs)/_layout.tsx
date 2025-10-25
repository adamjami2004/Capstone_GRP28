import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";




function CustomHeader() {
  const router = useRouter();

  const handleProfile= () => {
    router.push("/(tabs)/profile"); 
  };




  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/Sidebar")}>
        <IconSymbol size={24} name="line.horizontal.3" color="#000" />
      </TouchableOpacity>


      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconButton} >
          <IconSymbol size={24} name="gearshape.fill" color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleProfile} >
          <IconSymbol size={24} name="person.circle.fill" color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <>
      <CustomHeader />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#000",
          tabBarInactiveTintColor: "#666",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#e5e5e5",
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >

        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        
        <Tabs.Screen
          name="duty"
          options={{
            title: "Duty",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="building.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="alarm.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="status"
          options={{
            title: "Status",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="printer.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="resources"
          options={{
            title: "Resources",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="reservations"
          options={{
            href: null, 
          }}
        />

        <Tabs.Screen
          name="todo-list"
          options={{
            href: null, 
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            href: null, 
          }}
        />

        <Tabs.Screen
          name="Sidebar"
          options={{
            href: null, 
          }}
        />
        
      </Tabs>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerRight: {
    flexDirection: "row",
    gap: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
    navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 60,
    backgroundColor: "#fff",
  },
  
})

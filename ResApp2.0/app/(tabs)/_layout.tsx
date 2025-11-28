import { CustomHeader } from "@/components/CustomHeader";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";





export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <>
      <CustomHeader />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#2563eb",
          tabBarInactiveTintColor: "#94a3b8",
          tabBarStyle: {
            position: "absolute",
            bottom: 12,
            left: 20,
            right: 20,
            backgroundColor: "#ffffff",
            borderTopWidth: 0,
            height: 70,
            paddingTop: 8,
            paddingBottom: 8,
            paddingHorizontal: 20,
            borderRadius: 24,
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.12,
            shadowRadius: 15,
            borderWidth: 1,
            borderColor: "#f1f5f9",
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
            marginBottom: 0,
          },
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
                <IconSymbol 
                  size={22} 
                  name="house.fill" 
                  color={focused ? "#2563eb" : color} 
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="feed"
          options={{
            title: "Feed",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
                <IconSymbol 
                  size={22} 
                  name="list.bullet.rectangle.fill" 
                  color={focused ? "#2563eb" : color} 
                />
              </View>
            ),
          }}
        />

        {/* Unified Shift Management */}
        <Tabs.Screen
          name="shifts"
          options={{
            title: "Shifts",
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
                <IconSymbol 
                  size={22} 
                  name="calendar" 
                  color={focused ? "#2563eb" : color} 
                />
              </View>
            ),
          }}
        />

        {/* Hide old tabs */}
        <Tabs.Screen
          name="duty"
          options={{
            href: null,
          }}
        />

        
        
        <Tabs.Screen
          name="my-shifts"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="covers"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="approvals"
          options={{
            href: null,
          }}
        />

        

        <Tabs.Screen
          name="status"
          options={{
            href: null, 
          }}
        />

        <Tabs.Screen
          name="ressources"
          options={{
            title: "Ressources",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Ops Calendar",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
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
        <Tabs.Screen
          name="timeOff"
          options={{
            href: null, 
          }}
        />
        <Tabs.Screen
          name="PocketDuty"
          options={{
            href: null, 
          }}
        />
        <Tabs.Screen
          name="SidebarAnim"
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
  tabIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
})

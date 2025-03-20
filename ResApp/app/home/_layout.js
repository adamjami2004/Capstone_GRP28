// app/home/_layout.js
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function HomeLayout() {
  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#333',
          tabBarInactiveTintColor: '#999',
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 1, 
            borderTopColor: 'black', 
          },
        }}
      >

        
        <Tabs.Screen
          name="homepage"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Feed',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index" 
          options={{
           title: 'Profile',
           tabBarIcon: ({ color, size }) => (
             <Ionicons name="person-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'notifications',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="notifications-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}

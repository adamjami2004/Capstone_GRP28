import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Homepage() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;


  const slideAnim = useRef(new Animated.Value(-250)).current;
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    Animated.timing(slideAnim, {
      toValue: menuOpen ? -250 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setMenuOpen(!menuOpen);
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        {/* Side Menu Button */}
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>

        {/* Logo in the Center */}
        <Ionicons name="leaf" size={32} color="#009757" />

        {/* Profile Button */}
        <TouchableOpacity style={styles.profileButton} onPress={() => router.replace('/profile')}>
          <Ionicons name="person" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <Animated.View style={[styles.sideMenu, { left: slideAnim }]}>
        <Text style={styles.menuTitle}>Menu</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={() => console.log(item.label)}>
            <Ionicons name={item.icon} size={22} color="white" />
            <Text style={styles.menuText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Dark Overlay when Menu is Open */}
      {menuOpen && (
        <TouchableOpacity style={styles.overlay} onPress={toggleMenu} />
      )}
      
      <View style={styles.viewImage}>
        <View>
          <Text style={styles.welcomeText}>Welcome to ResApp</Text>
          <Text style={styles.username}>Adam Jami</Text>
        </View>
        <Image source={require('../../assets/images/mascot.png')} style={{ width: 200, height: 170, position:'absolute', top:100, right:-15 }} />
      </View>

      {/* Horizontal Scroll for Resources */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
        {resources.map((item, index) => (
          <TouchableOpacity key={index} style={styles.resourceButton}>
            <Ionicons name={item.icon} size={32} color="white" />
            <Text style={styles.resourceText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grey Background View for Deadlines */}
      <View style={styles.greyView}>
        <Text style={styles.DeadlineTitle}>Next Upcoming Deadlines</Text>
        <ScrollView style={styles.deadlineList}>
          {deadlines.map((deadline, index) => (
            <TouchableOpacity key={index} style={styles.deadlineCard}>
              <View style={styles.iconContainer}>
                <Ionicons name="star-outline" size={24} color="white" />
              </View>
              <View style={styles.deadlineTextContainer}>
                <Text style={styles.deadlineTitle}>{deadline.title}</Text>
                <Text style={styles.deadlineTime}>{deadline.time}</Text>
              </View>
              <View style={styles.notificationDot}></View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const resources = [
  { icon: 'book-outline', label: 'ShareP' },
  { icon: 'pencil-outline', label: 'Sway' },
  { icon: 'document-text-outline', label: 'eRez' },
  { icon: 'people-outline', label: 'Community' },
  { icon: 'call-outline', label: 'Phone numbers' },
  { icon: 'settings-outline', label: 'Settings' },
];

const menuItems = [
  { icon: 'home-outline', label: 'Home' },
  { icon: 'person-outline', label: 'Profile' },
  { icon: 'settings-outline', label: 'Settings' },
  { icon: 'log-out-outline', label: 'Logout' },
];

const deadlines = [
  { title: '50% 1:1s', time: 'Today - 10pm' },
  { title: 'March Proposals', time: 'Tomorrow - 5pm' },
  { title: 'Carousel Shifts', time: 'March 18 - 3pm' },
  { title: 'Open House', time: 'March 20 - 11:59pm' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', paddingTop: 0 },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    elevation: 2,
  },
  menuButton: {
    padding: 10,
  },
  DeadlineTitle: {
    padding: 10,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10,
  },
  greyView: {
    backgroundColor: '#f0f0f0',
    width: '100%',  
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 10,
    height:'40%'
  },
  viewImage: {
    flexDirection: 'row',
    marginBottom: 90,
    alignItems:'center'
  },
  greenback: {
    height: 150,
    width: 150,
    backgroundColor: 'green',
    borderRadius: 100,
    alignItems: 'center',
    position: 'absolute',
    top: 80,
    right: -50
  },
  profileButton: {
    padding: 10,
  },
  welcomeText: {
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 30,
    marginTop: 100,
    marginBottom: 5,
  },
  username: {
    marginLeft: 30,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'grey',
    marginBottom: 35,
  },
  scrollContainer: { marginTop: 10, paddingHorizontal: 10 },
  resourceButton: {
    backgroundColor: '#009757',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    width: 100,
    height: 100,
  },
  resourceText: { color: 'white', fontSize: 14, marginTop: 5, textAlign: 'center' },
  deadlineList: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  deadlineCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    height:80
  },
  iconContainer: {
    backgroundColor: '#FFA07A',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  deadlineTextContainer: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deadlineTime: {
    fontSize: 12,
    color: 'grey',
  },
  notificationDot: {
    width: 10,
    height: 10,
    backgroundColor: '#FF1493',
    borderRadius: 5,
    marginLeft: 10,
  },
  sideMenu: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 250, backgroundColor: '#333', paddingTop: 50, paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  menuText: { color: 'white', fontSize: 18, marginLeft: 15 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
});


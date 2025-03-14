import { StyleSheet, Pressable, Linking, Image, ScrollView, Animated } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { HelloWave } from '@/components/HelloWave';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';



export default function HomeScreen() {
  const openGoogle = () => {
    Linking.openURL('https://www.google.com');
  };

  const callHamza = () => {
    Linking.openURL('tel:+16137955851'); 
  };

  const callProtectionUrgent = () => {
    Linking.openURL('tel:+16137955852'); 
  };

  const callCVR = () => {
    Linking.openURL('tel:+16137955853'); 
  };

  const [menuVisible, setMenuVisible] = useState(false);
  const menuScale = new Animated.Value(0);

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(menuScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(menuScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: 'black', dark: 'black' }}
      headerImage={
        <Image source={require('@/assets/images/90U.jpg')} style={styles.reactLogo} />
      }
    >
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Welcome Adam ! </ThemedText>
          <HelloWave />
        </ThemedView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <ThemedView style={styles.buttonWrapper}>
            <Pressable
              style={styles.button}
              onPress={openGoogle}
            >
              <Ionicons name="globe-outline" size={32} color="white" />
            </Pressable>
            <ThemedText style={styles.buttonLabel}>eRez</ThemedText>
          </ThemedView>

          <ThemedView style={styles.buttonWrapper}>
            <Pressable
              style={styles.button}
              onPress={openGoogle}
            >
              <Ionicons name="calendar-outline" size={32} color="white" />
            </Pressable>
            <ThemedText style={styles.buttonLabel}>Duty</ThemedText>
          </ThemedView>

          <ThemedView style={styles.buttonWrapper}>
            <Pressable
              style={styles.button}
              onPress={openGoogle}
            >
              <Ionicons name="time-outline" size={32} color="white" />
            </Pressable>
            <ThemedText style={styles.buttonLabel}>Time Sheet</ThemedText>
          </ThemedView>

          <ThemedView style={styles.buttonWrapper}>
            <Pressable
              style={styles.button}
              onPress={openGoogle}
            >
              <Ionicons name="book-outline" size={32} color="white" />
            </Pressable>
            <ThemedText style={styles.buttonLabel}>Sway</ThemedText>
          </ThemedView>

          <ThemedView style={styles.buttonWrapper}>
            <Pressable
              style={styles.button}
              onPress={openGoogle}
            >
              <Ionicons name="document-text-outline" size={32} color="white" />
            </Pressable>
            <ThemedText style={styles.buttonLabel}>Guest Sign In</ThemedText>
          </ThemedView>

          <ThemedView style={styles.buttonWrapper}>
            <Pressable
              style={styles.button}
              onPress={callHamza}
            >
              <Ionicons name="fitness-outline" size={32} color="white" />
            </Pressable>
            <ThemedText style={styles.buttonLabel}>R.A</ThemedText>
          </ThemedView>T
        </ScrollView>
        {/* <ThemedView style={styles.Guest}>
          <ThemedText style={styles.buttonLabel}>R.A</ThemedText>
        </ThemedView> */}
        <ThemedView style={styles.titleContainer2}>
          <ThemedText type="title" style={{fontSize:20}}>Next Upcoming Deadlines</ThemedText>
          {/* <Ionicons name="calendar-outline" size={32} color="white" /> */}
        </ThemedView>
        
        
        <ThemedView style={{ height: 250 }}> {/* Set a fixed height if needed */}
          <ScrollView
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <ThemedView style={styles.buttonProtection}>
              <Ionicons name="calendar-outline" size={32} color="white" style={{ marginLeft: 15 }} />
              <ThemedText>23rd March</ThemedText>
              <ThemedText>|</ThemedText>
              <ThemedText>50% 1:1s</ThemedText>
            </ThemedView>

            <ThemedView style={styles.buttonProtection}>
              <Ionicons name="calendar-outline" size={32} color="white" style={{ marginLeft: 15 }} />
              <ThemedText>23rd March</ThemedText>
              <ThemedText>|</ThemedText>
              <ThemedText>50% 1:1s</ThemedText>
            </ThemedView>

            <ThemedView style={styles.buttonProtection}>
              <Ionicons name="calendar-outline" size={32} color="white" style={{ marginLeft: 15 }} />
              <ThemedText>23rd March</ThemedText>
              <ThemedText>|</ThemedText>
              <ThemedText>50% 1:1s</ThemedText>
            </ThemedView>

            <ThemedView style={styles.buttonProtection}>
              <Ionicons name="calendar-outline" size={32} color="white" style={{ marginLeft: 15 }} />
              <ThemedText>23rd March</ThemedText>
              <ThemedText>|</ThemedText>
              <ThemedText>50% 1:1s</ThemedText>
            </ThemedView>

            <ThemedView style={styles.buttonProtection}>
              <Ionicons name="calendar-outline" size={32} color="white" style={{ marginLeft: 15 }} />
              <ThemedText>23rd March</ThemedText>
              <ThemedText>|</ThemedText>
              <ThemedText>50% 1:1s</ThemedText>
            </ThemedView>
          </ScrollView>
        </ThemedView>

      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: -2,
  },
  detailed: {
    flex: 1,
    padding: -2,
  },
  profil: {
    flex: 1,
    padding: 0,
    position:'absolute',
    top:0,
    right:0
  },
  scrollViewContent: {
    paddingLeft: -1,
    paddingRight: 0,
    gap: 20,
    marginBottom:25,
  },
  buttonWrapper: {
    alignItems: 'center',
    width: 80,
  },
  buttonProtection: {
    alignItems: 'center',
    width: '99%',
    backgroundColor:'#8010ff',
    height:65,
    borderRadius:20,
    flexDirection:'row',
    gap:10,
    marginBottom:20,
  },
  button: {
    backgroundColor: '#8010ff',
    width: 80,
    height: 80,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
  },
  reactLogo: {
    height: 250,
    width: 400,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  titleContainer2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    marginBottom: 20,
    paddingHorizontal: 2,
    
  },
  fab: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#e74c3c',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  menu: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#2c3e50',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
  Guest :{
    width:'100%',
    backgroundColor:'#8010ff',
    height:'20%',
    marginTop:0,
    borderRadius:10
  },
});
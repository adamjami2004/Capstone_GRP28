import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');

// 1) Define the data for each onboarding slide
const slides = [
  {
    id: '1',
    title: 'Stay Connected',
    subtitle: 'Keep in touch with your community at all times.',
    image: require('../assets/images/Onboarding1.png'),
    backgroundColor: '#FA9976',
  },
  {
    id: '2',
    title: 'Organize Tasks',
    subtitle: 'Plan and manage your daily tasks efficiently.',
    image: require('../assets/images/Onboarding2.png'),
    backgroundColor: '#769BFA',
  },
  {
    id: '3',
    title: 'And much more...',
    subtitle: 'Discover all the features that ResLife has to offer.',
    image: require('../assets/images/Onboarding3.png'),
    backgroundColor: '#ED6365',
  },
];

export default function Onboarding() {
  const router = useRouter(); 

  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleGetStarted = () => {
    router.push('/login'); 
  };

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
      <Image source={item.image} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        bounces={false}
        ref={slidesRef}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
      />
      <View style={styles.pagination}>
        {slides.map((_, index) => {
          const isActive = index === currentIndex;
          return <View key={index.toString()} style={isActive ? styles.activeDot : styles.dot} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { width, alignItems: 'center', justifyContent: 'center', padding: 20 },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    resizeMode: 'contain',
    marginBottom: 20,
    marginTop: -30,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center', marginHorizontal: 30, marginBottom: 20 },
  button: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16 },
  pagination: { flexDirection: 'row', position: 'absolute', bottom: 40, alignSelf: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#999', marginHorizontal: 4 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#333', marginHorizontal: 4 },
});

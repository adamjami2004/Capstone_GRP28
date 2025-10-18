import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const checkLoggedIn = async () => {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (userEmail) {
        router.replace("/(tabs)"); // navigate directly to Tabs
      }
    };
    checkLoggedIn();
  }, []);

  const handleRoleSelect = () => {
    router.push('/login'); 
  };

  return (
    <View style={styles.container}>
      {/* Logo / Branding */}
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/logo.png')} // replace with your logo
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>ResApp</Text>
        <Text style={styles.tagline}>Streamline your workflow professionally</Text>
      </View>

      {/* Role Selection */}
      <View style={styles.rolesContainer}>
        <TouchableOpacity style={styles.roleButton} onPress={handleRoleSelect}>
          <Text style={styles.roleText}>Staff</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.roleButton} onPress={handleRoleSelect}>
          <Text style={styles.roleText}>TL / PS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.roleButton} onPress={handleRoleSelect}>
          <Text style={styles.roleText}>CA</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 ResApp. All rights reserved.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  logo: {
    width: 240,
    height: 240,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  rolesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  roleButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  roleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 12,
  },
});

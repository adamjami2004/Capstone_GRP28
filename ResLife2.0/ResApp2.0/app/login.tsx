"use client"

import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Image } from "react-native"
import { useRouter } from "expo-router"
import { useState } from "react"
import { LinearGradient } from "expo-linear-gradient"
import { signIn } from "../helpers/authHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";


export const options = {
  headerShown: false,
}

const { width } = Dimensions.get("window")

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await signIn(email, password);

      // Save login session
      await AsyncStorage.setItem("userEmail", email);

      router.replace("/(tabs)"); // navigate to main app screen
    } catch (err) {
      console.log("Login failed", err);
      // optionally show alert
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />

      <View style={styles.logoContainer}>
        <View style={styles.logoWrapper}>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.appName}>ResApp</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.8}>
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Login</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>© 2025 ResApp. All rights reserved.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    position: "relative",
  },
  backgroundCircle1: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#dbeafe",
    opacity: 0.3,
  },
  backgroundCircle2: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#dbeafe",
    opacity: 0.2,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
    zIndex: 1,
  },
  logoWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#3b82f6",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -1,
  },
  card: {
    width: width * 0.9,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#3b82f6",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 28,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
    fontSize: 16,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    fontWeight: "500",
  },
  button: {
    borderRadius: 14,
    marginTop: 8,
    shadowColor: "#3b82f6",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 32,
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
    zIndex: 1,
  },
})

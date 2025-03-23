import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, StatusBar, KeyboardAvoidingView 
} from "react-native";
import { useRouter } from "expo-router";
import { signIn } from "../app/services/authService";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await signIn(email, password);
      router.replace("/home/homepage"); // Redirect to home after login
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    }
  };

  return (
    <View style={styles.root}> {/* ✅ Root View Fixes Layout */}
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent /> {/* ✅ Fixes Status Bar Issue */}
      
      <LinearGradient colors={["#d4f8e8", "#a0e4b0"]} style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.keyboardAvoiding}
        >
          {/* Logo */}
          <Ionicons name="leaf" size={50} color="#4CAF50" style={styles.logo} />

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to ResLife</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#6b8e76"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#6b8e76"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <LinearGradient colors={["#66bb6a", "#4CAF50"]} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/signup/step1')}>
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkHighlight}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: "#a0e4b0"  // ✅ Ensures background covers everything
  },
  container: { 
    flex: 1,  // ✅ Full height
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  keyboardAvoiding: {
    width: "100%", 
    alignItems: "center"
  },
  logo: { 
    marginBottom: 15 
  },
  title: { 
    fontSize: 26, 
    fontWeight: "bold", 
    color: "#2e7d32", 
    textAlign: "center" 
  },
  subtitle: { 
    fontSize: 16, 
    color: "#4e8e58", 
    marginBottom: 25, 
    textAlign: "center" 
  },
  inputContainer: { 
    width: "100%", 
    backgroundColor: "rgba(255, 255, 255, 0.5)", 
    borderRadius: 10, 
    padding: 5, 
    marginBottom: 12 
  },
  input: {
    padding: 12,
    fontSize: 16,
    color: "#2e7d32",
    textAlign: "center",
  },
  button: { 
    width: "100%", 
    borderRadius: 10, 
    overflow: "hidden", 
    marginTop: 10 
  },
  buttonGradient: { 
    padding: 15, 
    alignItems: "center" 
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "bold" 
  },
  linkText: { 
    color: "#4e8e58", 
    marginTop: 18, 
    textAlign: "center" 
  },
  linkHighlight: { 
    color: "#388e3c", 
    fontWeight: "bold" 
  }
});

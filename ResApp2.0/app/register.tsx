"use client"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { registerUser, validateEmail, validateName, validatePassword } from "../helpers/authHelper"

export const options = {
  headerShown: false,
}

const { width } = Dimensions.get("window")

export default function RegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [residence, setResidence] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Error states
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const handleRegister = async () => {
    // Reset errors
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // Validate inputs
    const firstNameValidation = validateName(firstName);
    if (!firstNameValidation.valid) {
      setFirstNameError(firstNameValidation.error || "");
      return;
    }

    const lastNameValidation = validateName(lastName);
    if (!lastNameValidation.valid) {
      setLastNameError(lastNameValidation.error || "");
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || "");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.error || "");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser(email, password, firstName, lastName, "Staff", residence);

      if (result.success) {
        // Save login session
        await AsyncStorage.setItem("userEmail", email);

        // Show success message
        Alert.alert(
          "Registration Successful",
          "Your account has been created successfully!",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(tabs)")
            }
          ]
        );
      } else {
        // Show error alert
        Alert.alert(
          "Registration Failed",
          result.error || "Unable to create account. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (err) {
      console.error("Registration error:", err);
      Alert.alert(
        "Error",
        "An unexpected error occurred. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
          <Text style={styles.title}>Create Account</Text>
          
          {/* First Name Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, firstNameError ? styles.inputError : null]}
              placeholder="First Name"
              placeholderTextColor="#94a3b8"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                setFirstNameError("");
              }}
              editable={!loading}
            />
            {firstNameError ? <Text style={styles.errorText}>{firstNameError}</Text> : null}
          </View>

          {/* Last Name Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, lastNameError ? styles.inputError : null]}
              placeholder="Last Name"
              placeholderTextColor="#94a3b8"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                setLastNameError("");
              }}
              editable={!loading}
            />
            {lastNameError ? <Text style={styles.errorText}>{lastNameError}</Text> : null}
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="Email"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Residence Input (Optional) */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Residence (Optional)"
              placeholderTextColor="#94a3b8"
              value={residence}
              onChangeText={setResidence}
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, passwordError ? styles.inputError : null]}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              value={password}
              secureTextEntry
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError("");
              }}
              editable={!loading}
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            <Text style={styles.helperText}>Must be at least 6 characters with letters and numbers</Text>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, confirmPasswordError ? styles.inputError : null]}
              placeholder="Confirm Password"
              placeholderTextColor="#94a3b8"
              value={confirmPassword}
              secureTextEntry
              onChangeText={(text) => {
                setConfirmPassword(text);
                setConfirmPasswordError("");
              }}
              editable={!loading}
            />
            {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
          </View>

          {/* Register Button */}
          <TouchableOpacity 
            style={[styles.button, loading ? styles.buttonDisabled : null]} 
            onPress={handleRegister} 
            activeOpacity={0.8}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ["#94a3b8", "#64748b"] : ["#3b82f6", "#2563eb"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin} disabled={loading}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>© 2025 ResApp. All rights reserved.</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
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
    marginBottom: 30,
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
    width: 60,
    height: 60,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -1,
  },
  card: {
    width: width * 0.9,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#3b82f6",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    zIndex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  inputContainer: {
    marginBottom: 14,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 15,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    fontWeight: "500",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "500",
  },
  helperText: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    borderRadius: 14,
    marginTop: 12,
    shadowColor: "#3b82f6",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loginPrompt: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "500",
  },
  loginLink: {
    color: "#3b82f6",
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    marginTop: 24,
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
    zIndex: 1,
  },
})

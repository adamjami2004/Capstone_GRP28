"use client"

import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { useState } from "react"
import { ActivityIndicator, Alert, Dimensions, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { resetPassword, validateEmail } from "../helpers/authHelper"

export const options = {
  headerShown: false,
}

const { width } = Dimensions.get("window")

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    // Reset errors
    setEmailError("");

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.error || "");
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(email);

      if (result.success) {
        setEmailSent(true);
        Alert.alert(
          "Email Sent",
          result.message || "Password reset email has been sent. Please check your inbox.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Failed to Send Email",
          result.error || "Unable to send reset email. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (err) {
      console.error("Password reset error:", err);
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
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you instructions to reset your password.
        </Text>
        
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
              setEmailSent(false);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        {emailSent && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              ✓ Email sent! Check your inbox for password reset instructions.
            </Text>
          </View>
        )}

        {/* Reset Password Button */}
        <TouchableOpacity 
          style={[styles.button, loading ? styles.buttonDisabled : null]} 
          onPress={handleResetPassword} 
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
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Back to Login Link */}
        <View style={styles.loginContainer}>
          <TouchableOpacity onPress={navigateToLogin} disabled={loading}>
            <Text style={styles.loginLink}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
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
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "500",
  },
  successContainer: {
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  successText: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
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
    alignItems: "center",
    marginTop: 20,
  },
  loginLink: {
    color: "#3b82f6",
    fontSize: 15,
    fontWeight: "700",
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

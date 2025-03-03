import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function Login() {
  const router = useRouter(); // ✅ Correct way to navigate in expo-router
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email.trim() === '' || password.trim() === '') {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    router.push('/home/'); // ✅ Change this to navigate to your Home screen
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login to ResLife</Text>
      <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Alert.alert('Reset Password', 'Redirect to reset password flow')}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', paddingHorizontal: 30 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 40, textAlign: 'center', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 14, borderRadius: 8, marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#333', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#fff', fontSize: 16 },
  forgotPassword: { textAlign: 'center', color: '#333', marginTop: 10, fontSize: 14 },
});

import React from 'react';
import { Stack } from 'expo-router';
import { SignUpProvider } from '../context/SignUpContext';

export default function SignUpLayout() {
  return (
    <SignUpProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="step1" />
        <Stack.Screen name="step2" />
      </Stack>
    </SignUpProvider>
  );
}

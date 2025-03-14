import React from 'react';
import { Stack } from 'expo-router';

export default function CommentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 
        By default, this Stack will automatically include:
          - app/comments/index.js (if exists)
          - app/comments/[postId].js
      */}
    </Stack>
  );
}

ResLife – uOttawa Residence Life Mobile App

A mobile application built for University of Ottawa residences, allowing students and Community Advisors (CAs) to access resources, duty schedules, announcements, and personal profile information.
Developed as part of the 2025 Capstone Project.

## Getting Started

This guide explains how to download, install, configure, and run the app locally using Expo and Firebase.

## Requirements

Before starting, install the following:

- Node.js

Recommended: 18.x or 20.x
➡ https://nodejs.org

- Expo CLI
npm install -g expo-cli

- Git

➡ https://git-scm.com/downloads

- Expo Go App (for real device testing)

iOS – App Store

Android – Google Play

## Installation
1. Clone the repository
```bash
git clone https://github.com/adamjami2004/Capstone_GRP28.git
cd Capstone_GRP28/ResApp2.0
```
2. Install dependencies
```bash
npm install
```

3. Create a .env file in the root
```python
EXPO_FIREBASE_API_KEY=xxxx
EXPO_FIREBASE_AUTH_DOMAIN=xxxx
EXPO_FIREBASE_PROJECT_ID=xxxx
EXPO_FIREBASE_STORAGE_BUCKET=xxxx
EXPO_FIREBASE_MESSAGING_SENDER_ID=xxxx
EXPO_FIREBASE_APP_ID=xxxx
```


4. Restart Expo after editing .env
```bash
npx expo start -c
```

▶️ Running the App
Start the Expo development server
```bash
npx expo start
```

### Run on iOS

Press i, or scan the QR code in Expo Go

### Run on Android

Press a, or scan QR code via Expo Go

## Troubleshooting
- Metro bundler stuck or crashing
```bash
npx expo start -c
```

- Firebase errors (“app not initialized”)

Ensure .env file exists

Keys must use EXPO_FIREBASE_ prefix

Restart Expo completely

- Dependency mismatch
```bash
npx expo install
npx expo doctor
``` 


# Contributors
| Name	             | Role               | 
| ------------------ | ------------------ |
| Adam Jami          | Tech Lead          |
| Tachfine Bihya     | Developer          |
| Abdelaziz Amine    | Developer          |

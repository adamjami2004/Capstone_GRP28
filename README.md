# ResApp 2.0

ResApp 2.0 is a React Native application designed to streamline operations and improve accessibility for staff. This version introduces a fully TypeScript-based codebase with a modular structure, making the app more maintainable and scalable.

---



---

## Project Overview

ResApp 2.0 is built to help staff manage their daily tasks efficiently. Key functionalities include:

- Duty calendar management
- To-do lists for tasks
- Quick access to operational tools
- Profile and resource management

This version reflects a major update prompted by changing requirements from the client, which required us to restructure the project and migrate it to TypeScript for better type safety and maintainability.

---

## Features

- **User Authentication** (Firebase)
- **Home Dashboard** with quick access tiles
- **Duty Calendar** integration
- **To-Do List** management
- **Profile Management**
- **Resource Access**
- **Room reservation**
- **Custom Themed UI Components**
- **Sway Integration**

---

## Tech Stack

- **Frontend:** React Native, TypeScript
- **Backend Services:** Firebase (Firestore, Auth, Storage)
- **Testing:** Jest, React Native Testing Library
- **UI Components:** Custom components with reusable theming

## Project Decisions

- **TypeScript Migration:** Originally built in JavaScript, the project was migrated to TypeScript to improve type safety, reduce runtime errors, and simplify long-term maintenance.

- **Project Restructuring:** Due to updated client requirements, the folder structure and component hierarchy were refactored. Tabs, modals, and shared UI components were modularized for better scalability (V 2.0)

- **Firebase Mocking:** For testing, Firebase modules are mocked so that UI tests can run without requiring a live backend.

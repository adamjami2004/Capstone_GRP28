// Todo helper functions for todo-list system
import { auth, db } from "@/firebase";
import {
  CreateTodoData,
  TodoItem,
  UpdateTodoData
} from "@/types/todo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";

const PERSONAL_TODOS_KEY = "personal_todos";

// ============================================
// PERSONAL TODOS - AsyncStorage (Local Storage)
// ============================================

/**
 * Fetch personal todos from AsyncStorage
 */
export async function fetchPersonalTodos(): Promise<TodoItem[]> {
  try {
    const todosJson = await AsyncStorage.getItem(PERSONAL_TODOS_KEY);
    const todos: TodoItem[] = todosJson ? JSON.parse(todosJson) : [];

    // Sort by completion status and creation date
    todos.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1; // Incomplete first
      }
      // Sort by creation date (newest first)
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return todos;
  } catch (error) {
    console.error("Error fetching personal todos:", error);
    return [];
  }
}

/**
 * Create a personal todo in AsyncStorage
 */
export async function createPersonalTodo(data: {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
}): Promise<{ success: boolean; todoId?: string; error?: string }> {
  try {
    if (!data.title || data.title.trim().length === 0) {
      return { success: false, error: "Title is required" };
    }

    const todos = await fetchPersonalTodos();
    
    const newTodo: TodoItem = {
      id: `personal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: data.title.trim(),
      description: data.description?.trim() || "",
      completed: false,
      priority: data.priority || "medium",
      dueDate: data.dueDate || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: "local",
      userEmail: "",
      userName: "Me",
      residenceId: null,
    };

    todos.unshift(newTodo);
    await AsyncStorage.setItem(PERSONAL_TODOS_KEY, JSON.stringify(todos));

    return { success: true, todoId: newTodo.id };
  } catch (error: any) {
    console.error("Error creating personal todo:", error);
    return { success: false, error: error.message || "Failed to create todo" };
  }
}

/**
 * Update a personal todo in AsyncStorage
 */
export async function updatePersonalTodo(
  todoId: string,
  data: UpdateTodoData
): Promise<{ success: boolean; error?: string }> {
  try {
    const todos = await fetchPersonalTodos();
    const todoIndex = todos.findIndex((t) => t.id === todoId);

    if (todoIndex === -1) {
      return { success: false, error: "Todo not found" };
    }

    if (data.title !== undefined && data.title.trim().length === 0) {
      return { success: false, error: "Title cannot be empty" };
    }

    const updatedTodo = { ...todos[todoIndex] };

    if (data.title !== undefined) updatedTodo.title = data.title.trim();
    if (data.description !== undefined) updatedTodo.description = data.description.trim();
    if (data.completed !== undefined) updatedTodo.completed = data.completed;
    if (data.priority !== undefined) updatedTodo.priority = data.priority;
    if (data.dueDate !== undefined) updatedTodo.dueDate = data.dueDate;
    updatedTodo.updatedAt = Date.now();

    todos[todoIndex] = updatedTodo;
    await AsyncStorage.setItem(PERSONAL_TODOS_KEY, JSON.stringify(todos));

    return { success: true };
  } catch (error: any) {
    console.error("Error updating personal todo:", error);
    return { success: false, error: error.message || "Failed to update todo" };
  }
}

/**
 * Delete a personal todo from AsyncStorage
 */
export async function deletePersonalTodo(
  todoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const todos = await fetchPersonalTodos();
    const filteredTodos = todos.filter((t) => t.id !== todoId);

    if (filteredTodos.length === todos.length) {
      return { success: false, error: "Todo not found" };
    }

    await AsyncStorage.setItem(PERSONAL_TODOS_KEY, JSON.stringify(filteredTodos));
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting personal todo:", error);
    return { success: false, error: error.message || "Failed to delete todo" };
  }
}

/**
 * Toggle personal todo completion in AsyncStorage
 */
export async function togglePersonalTodoCompletion(
  todoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const todos = await fetchPersonalTodos();
    const todoIndex = todos.findIndex((t) => t.id === todoId);

    if (todoIndex === -1) {
      return { success: false, error: "Todo not found" };
    }

    todos[todoIndex].completed = !todos[todoIndex].completed;
    todos[todoIndex].updatedAt = Date.now();

    await AsyncStorage.setItem(PERSONAL_TODOS_KEY, JSON.stringify(todos));
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling personal todo:", error);
    return { success: false, error: error.message || "Failed to toggle todo" };
  }
}

// ============================================
// RESIDENCE TODOS - Firebase (Shared Storage)
// ============================================

/**
 * Fetch todos for a specific residence
 */
export async function fetchResidenceTodos(residenceId: string): Promise<TodoItem[]> {
  try {
    const todosRef = collection(db, "Todos");
    const q = query(
      todosRef,
      where("residenceId", "==", residenceId)
    );

    const querySnapshot = await getDocs(q);
    const todos: TodoItem[] = [];

    querySnapshot.forEach((docSnap) => {
      todos.push({ id: docSnap.id, ...docSnap.data() } as TodoItem);
    });

    // Sort by completion status, priority, and creation date
    todos.sort((a, b) => {
      // Incomplete first
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Then by priority (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'low'];
      const bPriority = priorityOrder[b.priority || 'low'];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Finally by creation date
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return 0;
    });

    return todos;
  } catch (error) {
    console.error("Error fetching residence todos:", error);
    throw new Error("Failed to fetch residence todos");
  }
}

/**
 * Create a new todo
 */
export async function createTodo(
  data: CreateTodoData
): Promise<{ success: boolean; todoId?: string; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Validate title
    if (!data.title || data.title.trim().length === 0) {
      return { success: false, error: "Title is required" };
    }

    // Fetch user details
    const usersRef = collection(db, "Users");
    const userQuery = query(usersRef, where("uid", "==", user.uid));
    const userSnapshot = await getDocs(userQuery);

    let userName = user.displayName || "Unknown User";
    let residenceName = undefined;
    
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      userName = `${userData.firstName} ${userData.lastName}`;
      
      // If creating a residence todo, get the residence name
      if (data.residenceId) {
        residenceName = userData.residence || data.residenceId;
      }
    }

    // Create todo
    const todosRef = collection(db, "Todos");
    const todoData = {
      title: data.title.trim(),
      description: data.description?.trim() || "",
      completed: false,
      userId: user.uid,
      userEmail: user.email || "",
      userName: userName,
      residenceId: data.residenceId || null,
      residenceName: residenceName || null,
      priority: data.priority || 'medium',
      dueDate: data.dueDate || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(todosRef, todoData);

    return { success: true, todoId: docRef.id };
  } catch (error: any) {
    console.error("Error creating todo:", error);
    return {
      success: false,
      error: error.message || "Failed to create todo",
    };
  }
}

/**
 * Update an existing todo
 */
export async function updateTodo(
  todoId: string,
  data: UpdateTodoData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch existing todo
    const todoRef = doc(db, "Todos", todoId);
    const todoDoc = await getDoc(todoRef);

    if (!todoDoc.exists()) {
      return { success: false, error: "Todo not found" };
    }

    const existingTodo = todoDoc.data() as TodoItem;

    // Prepare update data
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (data.title !== undefined) {
      if (data.title.trim().length === 0) {
        return { success: false, error: "Title cannot be empty" };
      }
      updateData.title = data.title.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }

    if (data.completed !== undefined) {
      updateData.completed = data.completed;
      
      if (data.completed) {
        updateData.completedAt = serverTimestamp();
        updateData.completedBy = user.uid;
      } else {
        // If uncompleting, remove the completion data
        updateData.completedAt = null;
        updateData.completedBy = null;
      }
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate;
    }

    // Update todo
    await updateDoc(todoRef, updateData);

    return { success: true };
  } catch (error: any) {
    console.error("Error updating todo:", error);
    return {
      success: false,
      error: error.message || "Failed to update todo",
    };
  }
}

/**
 * Delete a todo
 */
export async function deleteTodo(
  todoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch existing todo
    const todoRef = doc(db, "Todos", todoId);
    const todoDoc = await getDoc(todoRef);

    if (!todoDoc.exists()) {
      return { success: false, error: "Todo not found" };
    }

    const existingTodo = todoDoc.data() as TodoItem;

    // For personal todos, only the creator can delete
    // For residence todos, anyone in the residence can delete
    if (!existingTodo.residenceId && existingTodo.userId !== user.uid) {
      return { success: false, error: "You can only delete your own personal todos" };
    }

    // Delete todo
    await deleteDoc(todoRef);

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting todo:", error);
    return {
      success: false,
      error: error.message || "Failed to delete todo",
    };
  }
}

/**
 * Toggle todo completion status
 */
export async function toggleTodoCompletion(
  todoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch existing todo
    const todoRef = doc(db, "Todos", todoId);
    const todoDoc = await getDoc(todoRef);

    if (!todoDoc.exists()) {
      return { success: false, error: "Todo not found" };
    }

    const existingTodo = todoDoc.data() as TodoItem;
    const newCompletedStatus = !existingTodo.completed;

    // Update completion status
    const updateData: any = {
      completed: newCompletedStatus,
      updatedAt: serverTimestamp(),
    };

    if (newCompletedStatus) {
      updateData.completedAt = serverTimestamp();
      updateData.completedBy = user.uid;
    } else {
      updateData.completedAt = null;
      updateData.completedBy = null;
    }

    await updateDoc(todoRef, updateData);

    return { success: true };
  } catch (error: any) {
    console.error("Error toggling todo completion:", error);
    return {
      success: false,
      error: error.message || "Failed to toggle todo completion",
    };
  }
}

/**
 * Format date for display
 */
export function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);
  
  if (dueDate.getTime() === today.getTime()) {
    return "Today";
  } else if (dueDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else if (dueDate < today) {
    return "Overdue";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

/**
 * Get priority color
 */
export function getPriorityColor(priority?: 'low' | 'medium' | 'high'): string {
  switch (priority) {
    case 'high':
      return '#ef4444'; // red
    case 'medium':
      return '#f59e0b'; // orange
    case 'low':
      return '#10b981'; // green
    default:
      return '#6b7280'; // gray
  }
}


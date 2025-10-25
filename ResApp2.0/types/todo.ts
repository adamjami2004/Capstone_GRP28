// Types for todo-list system

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  userId: string; // User who created the todo
  userEmail: string;
  userName: string;
  residenceId?: string; // If null/undefined, it's a personal todo. If set, it's a residence todo
  residenceName?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string; // Format: YYYY-MM-DD
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  completedAt?: any; // Firestore Timestamp
  completedBy?: string; // User ID who completed (for residence todos)
}

export interface CreateTodoData {
  title: string;
  description?: string;
  residenceId?: string; // If provided, creates a residence todo
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}


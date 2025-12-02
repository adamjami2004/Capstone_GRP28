"use client";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/firebase";
import {
  createPersonalTodo,
    createTodo,
  deletePersonalTodo,
    deleteTodo,
    fetchPersonalTodos,
    fetchResidenceTodos,
    formatDueDate,
    getPriorityColor,
  togglePersonalTodoCompletion,
    toggleTodoCompletion,
  updatePersonalTodo,
    updateTodo,
} from "@/helpers/todoHelper";
import { TodoItem } from "@/types/todo";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type TabType = "personal" | "residence";

export default function TodoListScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [personalTodos, setPersonalTodos] = useState<TodoItem[]>([]);
  const [residenceTodos, setResidenceTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [userResidence, setUserResidence] = useState<string>("");
  const [userResidenceName, setUserResidenceName] = useState<string>("");
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [isResidenceTodo, setIsResidenceTodo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch personal todos from AsyncStorage (no auth required)
      const personalTodosData = await fetchPersonalTodos();
      setPersonalTodos(personalTodosData);

      // Try to fetch residence todos if user is authenticated
      const user = auth.currentUser;
      if (user) {
      // Fetch user details to get residence
      const usersRef = collection(db, "Users");
      const userQuery = query(usersRef, where("uid", "==", user.uid));
      const userSnapshot = await getDocs(userQuery);
      
      let residenceId = "";
      let residenceName = "";
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        residenceId = userData.residence || userData.Residence || "";
        residenceName = userData.residence || userData.Residence || "Residence";
      }

      setUserResidence(residenceId);
      setUserResidenceName(residenceName);

      // Fetch residence todos if user has a residence
      if (residenceId) {
        const residenceTodosData = await fetchResidenceTodos(residenceId);
        setResidenceTodos(residenceTodosData);
        }
      }
    } catch (error) {
      console.error("Error loading todos:", error);
      Alert.alert("Error", "Failed to load todos. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setIsResidenceTodo(activeTab === "residence");
    setShowAddModal(true);
  };

  const handleEditTodo = (todo: TodoItem) => {
    setSelectedTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description || "");
    setPriority(todo.priority || "medium");
    setDueDate(todo.dueDate || "");
    setShowEditModal(true);
  };

  const handleSubmitAdd = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    setSubmitting(true);
    try {
      let result;
      
      if (isResidenceTodo && userResidence) {
        // Create residence todo in Firebase (requires auth)
        result = await createTodo({
        title,
        description,
        priority,
        dueDate: dueDate || undefined,
          residenceId: userResidence,
        });
      } else {
        // Create personal todo in AsyncStorage (no auth required)
        result = await createPersonalTodo({
          title,
          description,
          priority,
          dueDate: dueDate || undefined,
      });
      }

      if (result.success) {
        Alert.alert("Success", "Todo created successfully!");
        setShowAddModal(false);
        loadData();
      } else {
        Alert.alert("Error", result.error || "Failed to create todo");
      }
    } catch (error) {
      console.error("Error creating todo:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedTodo) return;

    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    setSubmitting(true);
    try {
      const isPersonalTodo = selectedTodo.id.startsWith("personal_");
      
      const result = isPersonalTodo
        ? await updatePersonalTodo(selectedTodo.id, {
            title,
            description,
            priority,
            dueDate: dueDate || undefined,
          })
        : await updateTodo(selectedTodo.id, {
        title,
        description,
        priority,
        dueDate: dueDate || undefined,
      });

      if (result.success) {
        Alert.alert("Success", "Todo updated successfully!");
        setShowEditModal(false);
        loadData();
      } else {
        Alert.alert("Error", result.error || "Failed to update todo");
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTodo = async (todoId: string) => {
    try {
      const isPersonalTodo = todoId.startsWith("personal_");
      
      const result = isPersonalTodo
        ? await togglePersonalTodoCompletion(todoId)
        : await toggleTodoCompletion(todoId);
        
      if (result.success) {
        loadData();
      } else {
        Alert.alert("Error", result.error || "Failed to update todo");
      }
    } catch (error) {
      console.error("Error toggling todo:", error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    Alert.alert(
      "Delete Todo",
      "Are you sure you want to delete this todo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const isPersonalTodo = todoId.startsWith("personal_");
              
              const result = isPersonalTodo
                ? await deletePersonalTodo(todoId)
                : await deleteTodo(todoId);
                
              if (result.success) {
                Alert.alert("Success", "Todo deleted successfully!");
                loadData();
              } else {
                Alert.alert("Error", result.error || "Failed to delete todo");
              }
            } catch (error) {
              console.error("Error deleting todo:", error);
              Alert.alert("Error", "An unexpected error occurred");
            }
          },
        },
      ]
    );
  };

  const renderTodoItem = (todo: TodoItem) => {
    const priorityColor = getPriorityColor(todo.priority);
    
    return (
      <View key={todo.id} style={styles.todoCard}>
        <TouchableOpacity
          style={styles.todoCheckbox}
          onPress={() => handleToggleTodo(todo.id)}
        >
          {todo.completed ? (
            <IconSymbol name="checkmark.circle.fill" size={24} color="#10b981" />
          ) : (
            <IconSymbol name="circle" size={24} color="#d1d5db" />
          )}
        </TouchableOpacity>
        
        <View style={styles.todoContent}>
          <Text style={[styles.todoTitle, todo.completed && styles.todoTitleCompleted]}>
            {todo.title}
          </Text>
          
          {todo.description && (
            <Text style={styles.todoDescription} numberOfLines={2}>
              {todo.description}
            </Text>
          )}
          
          <View style={styles.todoMeta}>
            {todo.priority && (
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                <Text style={[styles.priorityText, { color: priorityColor }]}>
                  {todo.priority}
                </Text>
              </View>
            )}
            
            {todo.dueDate && (
              <View style={styles.dueDateBadge}>
                <IconSymbol name="calendar" size={12} color="#666" />
                <Text style={styles.dueDateText}>{formatDueDate(todo.dueDate)}</Text>
              </View>
            )}
            
            {todo.residenceId && (
              <View style={styles.creatorBadge}>
                <IconSymbol name="person" size={12} color="#666" />
                <Text style={styles.creatorText} numberOfLines={1}>
                  {todo.userName}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.todoActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditTodo(todo)}
          >
            <IconSymbol name="pencil" size={18} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteTodo(todo.id)}
          >
            <IconSymbol name="trash" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </ThemedView>
    );
  }

  const currentTodos = activeTab === "personal" ? personalTodos : residenceTodos;
  const activeTodos = currentTodos.filter(t => !t.completed);
  const completedTodos = currentTodos.filter(t => t.completed);

  return (
    <ThemedView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "personal" && styles.tabActive]}
          onPress={() => setActiveTab("personal")}
        >
          <IconSymbol
            name="person.fill"
            size={20}
            color={activeTab === "personal" ? "#3b82f6" : "#666"}
          />
          <Text style={[styles.tabText, activeTab === "personal" && styles.tabTextActive]}>
            Personal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "residence" && styles.tabActive]}
          onPress={() => setActiveTab("residence")}
        >
          <IconSymbol
            name="building.2.fill"
            size={20}
            color={activeTab === "residence" ? "#3b82f6" : "#666"}
          />
          <Text style={[styles.tabText, activeTab === "residence" && styles.tabTextActive]}>
            {userResidenceName || "Residence"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Todos List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {/* Active Todos */}
          {activeTodos.length === 0 ? (
            <View style={styles.emptyCard}>
              <IconSymbol name="checklist" size={40} color="#999" />
              <Text style={styles.emptyText}>No active todos</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add one</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                Active ({activeTodos.length})
              </Text>
              {activeTodos.map(renderTodoItem)}
            </>
          )}

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                Completed ({completedTodos.length})
              </Text>
              {completedTodos.map(renderTodoItem)}
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.fabButton} onPress={handleAddTodo}>
        <IconSymbol name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Todo Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Todo</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol name="xmark" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Todo Type Toggle */}
              {userResidence && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Type</Text>
                  <View style={styles.toggleContainer}>
                    <TouchableOpacity
                      style={[styles.toggleButton, !isResidenceTodo && styles.toggleButtonActive]}
                      onPress={() => setIsResidenceTodo(false)}
                    >
                      <Text style={[styles.toggleText, !isResidenceTodo && styles.toggleTextActive]}>
                        Personal
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleButton, isResidenceTodo && styles.toggleButtonActive]}
                      onPress={() => setIsResidenceTodo(true)}
                    >
                      <Text style={[styles.toggleText, isResidenceTodo && styles.toggleTextActive]}>
                        {userResidenceName || "Residence"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Title */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter todo title"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add more details..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Priority */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.priorityContainer}>
                  {(["low", "medium", "high"] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        priority === p && styles.priorityButtonActive,
                        { borderColor: getPriorityColor(p) },
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          priority === p && { color: getPriorityColor(p) },
                        ]}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Due Date */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Due Date (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitAdd}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Todo</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Todo Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Todo</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <IconSymbol name="xmark" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Title */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter todo title"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add more details..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Priority */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.priorityContainer}>
                  {(["low", "medium", "high"] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        priority === p && styles.priorityButtonActive,
                        { borderColor: getPriorityColor(p) },
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          priority === p && { color: getPriorityColor(p) },
                        ]}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Due Date */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Due Date (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitEdit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Todo</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingBottom: 100,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#3b82f6",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#3b82f6",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 60,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
  },
  todoCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  todoCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  todoTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },
  todoDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  todoMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dueDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dueDateText: {
    fontSize: 12,
    color: "#666",
  },
  creatorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: 120,
  },
  creatorText: {
    fontSize: 12,
    color: "#666",
  },
  todoActions: {
    flexDirection: "row",
    gap: 4,
    marginLeft: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  fabButton: {
    position: "absolute",
    right: 20,
    bottom: 110,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#000",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  toggleTextActive: {
    color: "#000",
    fontWeight: "600",
  },
  priorityContainer: {
    flexDirection: "row",
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: "#fff",
  },
  priorityButtonActive: {
    backgroundColor: "#f9fafb",
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});


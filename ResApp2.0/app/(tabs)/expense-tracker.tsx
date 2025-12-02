"use client";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const BUDGET_KEY = "expense_budget";
const EXPENSES_KEY = "expense_list";
const INITIAL_BUDGET = 250;

type Expense = {
  id: string;
  amount: number;
  description: string;
  date: number;
  category?: string;
};

export default function ExpenseTrackerScreen() {
  const router = useRouter();
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetStr, expensesStr] = await Promise.all([
        AsyncStorage.getItem(BUDGET_KEY),
        AsyncStorage.getItem(EXPENSES_KEY),
      ]);

      const savedBudget = budgetStr ? parseFloat(budgetStr) : INITIAL_BUDGET;
      const savedExpenses: Expense[] = expensesStr ? JSON.parse(expensesStr) : [];

      setBudget(savedBudget);
      setExpenses(savedExpenses);
    } catch (error) {
      console.error("Error loading expense data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    const expenseAmount = parseFloat(amount);
    
    if (!amount || isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    if (expenseAmount > budget) {
      Alert.alert("Error", "Expense exceeds remaining budget");
      return;
    }

    setSubmitting(true);
    try {
      const newExpense: Expense = {
        id: `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: expenseAmount,
        description: description.trim(),
        date: Date.now(),
      };

      const newExpenses = [newExpense, ...expenses];
      const newBudget = budget - expenseAmount;

      await Promise.all([
        AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(newExpenses)),
        AsyncStorage.setItem(BUDGET_KEY, newBudget.toString()),
      ]);

      setExpenses(newExpenses);
      setBudget(newBudget);
      setAmount("");
      setDescription("");
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding expense:", error);
      Alert.alert("Error", "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const newExpenses = expenses.filter((e) => e.id !== expenseId);
              const newBudget = budget + expense.amount;

              await Promise.all([
                AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(newExpenses)),
                AsyncStorage.setItem(BUDGET_KEY, newBudget.toString()),
              ]);

              setExpenses(newExpenses);
              setBudget(newBudget);
            } catch (error) {
              console.error("Error deleting expense:", error);
              Alert.alert("Error", "Failed to delete expense");
            }
          },
        },
      ]
    );
  };

  const handleResetBudget = () => {
    Alert.alert(
      "Reset Budget",
      "This will reset your budget to $250 and clear all expenses. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all([
                AsyncStorage.removeItem(BUDGET_KEY),
                AsyncStorage.removeItem(EXPENSES_KEY),
              ]);
              setBudget(INITIAL_BUDGET);
              setExpenses([]);
            } catch (error) {
              console.error("Error resetting budget:", error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalSpent = INITIAL_BUDGET - budget;
  const isLowBudget = budget < 50;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconContainer}>
              <IconSymbol size={26} name="dollarsign.circle.fill" color="#3b82f6" />
            </View>
            <Text style={styles.headerTitle}>Expense Tracker</Text>
          </View>
        </View>

        {/* Budget Card */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetLabel}>Remaining Budget</Text>
            <TouchableOpacity onPress={handleResetBudget} style={styles.resetButton}>
              <IconSymbol name="arrow.counterclockwise" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.budgetAmountContainer}>
            <Text style={[styles.budgetAmount, isLowBudget && styles.budgetAmountLow]}>
              ${budget.toFixed(2)}
            </Text>
            {isLowBudget && (
              <View style={styles.warningBadge}>
                <IconSymbol name="exclamationmark.triangle.fill" size={14} color="#fff" />
                <Text style={styles.warningText}>Low Budget</Text>
              </View>
            )}
          </View>
          <View style={styles.budgetProgress}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(budget / INITIAL_BUDGET) * 100}%` },
                  isLowBudget && styles.progressFillLow,
                ]}
              />
            </View>
            <Text style={styles.budgetInfo}>
              ${totalSpent.toFixed(2)} of ${INITIAL_BUDGET} spent
            </Text>
          </View>
        </View>

        {/* Expenses List */}
        <View style={styles.expensesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <Text style={styles.expenseCount}>{expenses.length} expenses</Text>
          </View>

          {expenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <IconSymbol name="creditcard.fill" size={40} color="#d1d5db" />
              </View>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Add your first expense to get started</Text>
            </View>
          ) : (
            <View style={styles.expensesList}>
              {expenses.map((expense) => (
                <View key={expense.id} style={styles.expenseCard}>
                  <View style={styles.expenseContent}>
                    <View style={styles.expenseIconContainer}>
                      <IconSymbol name="dollarsign.circle.fill" size={20} color="#3b82f6" />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseDescription}>{expense.description}</Text>
                      <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                    </View>
                    <View style={styles.expenseAmountContainer}>
                      <Text style={styles.expenseAmount}>-${expense.amount.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteExpense(expense.id)}
                      style={styles.deleteButton}
                    >
                      <IconSymbol name="trash" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Expense Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <IconSymbol name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowAddModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeButton}>
                <IconSymbol name="xmark" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Amount ($) *</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What did you spend on?"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleAddExpense}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Add Expense</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingBottom: 100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 0,
  },
  budgetCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resetButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  budgetAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  budgetAmount: {
    fontSize: 42,
    fontWeight: "700",
    color: "#10b981",
    letterSpacing: -1,
  },
  budgetAmountLow: {
    color: "#ef4444",
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  warningText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  budgetProgress: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 4,
  },
  progressFillLow: {
    backgroundColor: "#ef4444",
  },
  budgetInfo: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  expensesSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  expenseCount: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  expensesList: {
    gap: 12,
  },
  expenseCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  expenseContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  expenseAmountContainer: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ef4444",
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
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
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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


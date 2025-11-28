"use client";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  type CollectionReference,
  type DocumentData,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type Attachment = {
  type: "pdf" | "link";
  label: string;
  url: string;
};

type Question = {
  id: string;
  question: string;
  answer: string;
  attachments?: Attachment[];
};

type Subcategory = {
  id: string;
  title: string;
  order?: number;
  questions: Question[];
};

type Category = {
  id: string;
  title: string;
  order?: number;
  subcategories: Subcategory[];
};

export default function Resources() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [activeQA, setActiveQA] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  const toggleCategory = (id: string) => {
    setExpandedCategory((prev) => (prev === id ? null : id));
    setExpandedSub(null);
  };

  const toggleSub = (id: string) => {
    setExpandedSub((prev) => (prev === id ? null : id));
  };

  const openAttachment = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Unable to open", "This link cannot be opened on your device.");
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const categoriesRef = collection(db, "categories") as CollectionReference<DocumentData>;
        const categoriesSnap = await getDocs(query(categoriesRef, orderBy("order", "asc")));

        const loadedCategories: Category[] = [];

        for (const categoryDoc of categoriesSnap.docs) {
          const categoryData = categoryDoc.data();
          const subcategoriesRef = collection(
            db,
            "categories",
            categoryDoc.id,
            "subcategories"
          ) as CollectionReference<DocumentData>;
          const subcategoriesSnap = await getDocs(query(subcategoriesRef, orderBy("order", "asc")));

          const loadedSubcategories: Subcategory[] = [];

          for (const subcategoryDoc of subcategoriesSnap.docs) {
            const subcategoryData = subcategoryDoc.data();
            const questionsRef = collection(
              db,
              "categories",
              categoryDoc.id,
              "subcategories",
              subcategoryDoc.id,
              "questions"
            ) as CollectionReference<DocumentData>;
            const questionsSnap = await getDocs(questionsRef);

            const loadedQuestions: Question[] = questionsSnap.docs.map((qDoc) => ({
              id: qDoc.id,
              question: qDoc.data().question || "",
              answer: qDoc.data().answer || "",
              attachments: qDoc.data().attachments || [],
            }));

            loadedSubcategories.push({
              id: subcategoryDoc.id,
              title: subcategoryData.title || "",
              order: subcategoryData.order,
              questions: loadedQuestions,
            });
          }

          loadedCategories.push({
            id: categoryDoc.id,
            title: categoryData.title || "",
            order: categoryData.order,
            subcategories: loadedSubcategories,
          });
        }

        setCategories(loadedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        Alert.alert("Error", "Failed to load resources. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderQuestion =
    (catId: string, subId: string) =>
    ({ item }: { item: Question }) => (
      <TouchableOpacity
        style={styles.questionItem}
        onPress={() => setActiveQA(item)}
        activeOpacity={0.7}
      >
        <View style={styles.questionIconContainer}>
          <IconSymbol name="questionmark.circle.fill" size={20} color="#3b82f6" />
        </View>
        <Text style={styles.questionText} numberOfLines={2}>
          {item.question}
        </Text>
        <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
      </TouchableOpacity>
    );

  const renderSubcategory =
    (catId: string) =>
    ({ item }: { item: Subcategory }) => (
      <View style={styles.subcategoryContainer}>
        <TouchableOpacity
          style={styles.subHeader}
          onPress={() => toggleSub(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.subIconContainer}>
            <IconSymbol name="folder.fill" size={18} color="#f59e0b" />
          </View>
          <Text style={styles.subTitle}>{item.title}</Text>
          <View style={styles.subBadge}>
            <Text style={styles.subBadgeText}>{item.questions.length}</Text>
          </View>
          <IconSymbol
            name={expandedSub === item.id ? "chevron.down" : "chevron.right"}
            size={16}
            color="#9ca3af"
          />
        </TouchableOpacity>
        {expandedSub === item.id && (
          <View style={styles.questionsContainer}>
            {item.questions.map((q, index) => (
              <View key={q.id}>
                {renderQuestion(catId, item.id)({ item: q })}
                {index < item.questions.length - 1 && <View style={styles.questionSeparator} />}
              </View>
            ))}
          </View>
        )}
      </View>
    );

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryCard}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => toggleCategory(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryIconContainer}>
          <IconSymbol name="book.fill" size={22} color="#fff" />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>{item.title}</Text>
          <Text style={styles.categorySubtitle}>
            {item.subcategories.length} {item.subcategories.length === 1 ? "topic" : "topics"}
          </Text>
        </View>
        <IconSymbol
          name={expandedCategory === item.id ? "chevron.down" : "chevron.right"}
          size={20}
          color="#9ca3af"
        />
      </TouchableOpacity>

      {expandedCategory === item.id && (
        <View style={styles.subcategoriesList}>
          {item.subcategories.map((sub, index) => (
            <View key={sub.id}>
              {renderSubcategory(item.id)({ item: sub })}
              {index < item.subcategories.length - 1 && <View style={styles.subcategorySeparator} />}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading resources...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Resources</Text>
            <Text style={styles.headerSubtitle}>
              {categories.length} {categories.length === 1 ? "category" : "categories"} available
            </Text>
          </View>
        </View>

        {/* Search Hint */}
        <View style={styles.searchHint}>
          <View style={styles.searchHintIcon}>
            <IconSymbol name="lightbulb.fill" size={18} color="#f59e0b" />
          </View>
          <Text style={styles.searchHintText}>
            Tap a category to explore topics and find answers
          </Text>
        </View>

        {/* Categories */}
        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <IconSymbol name="book.closed.fill" size={40} color="#3b82f6" />
            </View>
            <Text style={styles.emptyText}>No resources available</Text>
            <Text style={styles.emptySubtext}>Check back later for updates</Text>
          </View>
        ) : (
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <View key={category.id}>{renderCategory({ item: category })}</View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Answer Modal */}
      <Modal
        visible={!!activeQA}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveQA(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Answer</Text>
                <Text style={styles.modalSubtitle}>Resource details</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveQA(null)} style={styles.closeButton}>
                <IconSymbol name="xmark" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Question */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Question</Text>
                <View style={styles.questionBox}>
                  <IconSymbol name="questionmark.circle.fill" size={20} color="#3b82f6" />
                  <Text style={styles.questionBoxText}>{activeQA?.question}</Text>
                </View>
              </View>

              {/* Answer */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Answer</Text>
                <View style={styles.answerBox}>
                  <Text style={styles.answerText}>{activeQA?.answer}</Text>
                </View>
              </View>

              {/* Attachments */}
              {activeQA?.attachments && activeQA.attachments.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Attachments</Text>
                  {activeQA.attachments.map((att, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.attachmentButton}
                      onPress={() => openAttachment(att.url)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.attachmentIcon,
                          { backgroundColor: att.type === "pdf" ? "#fee2e2" : "#dbeafe" },
                        ]}
                      >
                        <IconSymbol
                          name={att.type === "pdf" ? "doc.fill" : "link"}
                          size={18}
                          color={att.type === "pdf" ? "#ef4444" : "#3b82f6"}
                        />
                      </View>
                      <View style={styles.attachmentInfo}>
                        <Text style={styles.attachmentLabel}>{att.label}</Text>
                        <Text style={styles.attachmentHint}>Tap to open</Text>
                      </View>
                      <IconSymbol name="arrow.up.right" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Done Button */}
              <TouchableOpacity style={styles.doneButton} onPress={() => setActiveQA(null)}>
                <Text style={styles.doneButtonText}>Done</Text>
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
  scrollView: {
    flex: 1,
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  searchHint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  searchHintIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fde68a",
    justifyContent: "center",
    alignItems: "center",
  },
  searchHintText: {
    flex: 1,
    fontSize: 13,
    color: "#92400e",
    fontWeight: "500",
    lineHeight: 18,
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
    backgroundColor: "#dbeafe",
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
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 20,
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  subcategoriesList: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  subcategoryContainer: {
    backgroundColor: "#fafafa",
  },
  subcategorySeparator: {
    height: 1,
    backgroundColor: "#f3f4f6",
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  subIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
  },
  subTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  subBadge: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  questionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  questionSeparator: {
    height: 8,
  },
  questionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  questionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    lineHeight: 20,
  },
  // Modal Styles
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
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  questionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#dbeafe",
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  questionBoxText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1e40af",
    lineHeight: 22,
  },
  answerBox: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  answerText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 24,
  },
  attachmentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 12,
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  attachmentHint: {
    fontSize: 12,
    color: "#6b7280",
  },
  doneButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

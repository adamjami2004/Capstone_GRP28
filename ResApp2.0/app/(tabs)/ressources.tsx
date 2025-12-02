"use client";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { db } from "@/firebase";
import { useRouter } from "expo-router";
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

// Icon mapping function for categories
const getCategoryIcon = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes("duty") || lowerTitle.includes("documentation")) {
    return "doc.text.fill";
  }
  if (lowerTitle.includes("policy") || lowerTitle.includes("policies")) {
    return "doc.on.doc.fill";
  }
  if (lowerTitle.includes("procedure") || lowerTitle.includes("process")) {
    return "list.bullet.rectangle.fill";
  }
  if (lowerTitle.includes("training") || lowerTitle.includes("guide") || lowerTitle.includes("tutorial")) {
    return "graduationcap.fill";
  }
  if (lowerTitle.includes("faq") || lowerTitle.includes("question") || lowerTitle.includes("help")) {
    return "questionmark.circle.fill";
  }
  if (lowerTitle.includes("contact") || lowerTitle.includes("directory") || lowerTitle.includes("phone")) {
    return "person.2.fill";
  }
  if (lowerTitle.includes("form") || lowerTitle.includes("template")) {
    return "doc.fill";
  }
  if (lowerTitle.includes("resource") || lowerTitle.includes("library") || lowerTitle.includes("archive")) {
    return "books.vertical.fill";
  }
  if (lowerTitle.includes("calendar") || lowerTitle.includes("schedule") || lowerTitle.includes("event")) {
    return "calendar.fill";
  }
  if (lowerTitle.includes("shift") || lowerTitle.includes("work")) {
    return "clock.fill";
  }
  if (lowerTitle.includes("announcement") || lowerTitle.includes("news") || lowerTitle.includes("update")) {
    return "megaphone.fill";
  }
  if (lowerTitle.includes("reservation") || lowerTitle.includes("booking")) {
    return "calendar.badge.clock";
  }
  
  // Default icon
  return "book.fill";
};

export default function Resources() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderCategory = ({ item }: { item: Category }) => {
    const totalQuestions = item.subcategories.reduce((sum, sub) => sum + sub.questions.length, 0);
    const categoryIcon = getCategoryIcon(item.title);
    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => router.push({
          pathname: "/(tabs)/ressources/[categoryId]",
          params: { categoryId: item.id }
        })}
        activeOpacity={0.6}
      >
        <View style={styles.categoryHeader}>
          <View style={styles.categoryIconContainer}>
            <IconSymbol name={categoryIcon as any} size={24} color="#fff" />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryTitle}>{item.title}</Text>
            <Text style={styles.categorySubtitle}>
              {item.subcategories.length} {item.subcategories.length === 1 ? "topic" : "topics"} • {totalQuestions} {totalQuestions === 1 ? "question" : "questions"}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color="#94a3b8" />
        </View>
      </TouchableOpacity>
    );
  };

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
        <View style={styles.headerSection}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconContainer}>
              <IconSymbol size={32} name="book.fill" color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Resources</Text>
              <Text style={styles.headerSubtitle}>
                {categories.length} {categories.length === 1 ? "category" : "categories"} available
              </Text>
            </View>
          </View>
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
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
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
    gap: 12,
    paddingBottom: 24,
    paddingTop: 8,
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  categoryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  categorySubtitle: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
});

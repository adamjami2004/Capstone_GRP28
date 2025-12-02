"use client";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { db } from "@/firebase";
import {
    collection,
    getDoc,
    getDocs,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc } from "firebase/firestore";

type Question = {
  id: string;
  question: string;
  answer: string;
  attachments?: Array<{
    type: "pdf" | "link";
    label: string;
    url: string;
  }>;
};

export default function SubcategoryQuestionsScreen() {
  const { categoryId, subcategoryId } = useLocalSearchParams<{ categoryId: string; subcategoryId: string }>();
  const router = useRouter();
  const [categoryTitle, setCategoryTitle] = useState("");
  const [subcategoryTitle, setSubcategoryTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get category and subcategory titles
        const categoryDoc = await getDoc(doc(db, "categories", categoryId));
        if (categoryDoc.exists()) {
          setCategoryTitle(categoryDoc.data().title || "");
        }

        const subcategoryDoc = await getDoc(doc(db, "categories", categoryId, "subcategories", subcategoryId));
        if (subcategoryDoc.exists()) {
          setSubcategoryTitle(subcategoryDoc.data().title || "");
        }

        // Get questions
        const questionsRef = collection(
          db,
          "categories",
          categoryId,
          "subcategories",
          subcategoryId,
          "questions"
        ) as CollectionReference<DocumentData>;
        const questionsSnap = await getDocs(questionsRef);

        const loadedQuestions: Question[] = questionsSnap.docs.map((qDoc) => ({
          id: qDoc.id,
          question: qDoc.data().question || "",
          answer: qDoc.data().answer || "",
          attachments: qDoc.data().attachments || [],
        }));

        setQuestions(loadedQuestions);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId && subcategoryId) {
      fetchData();
    }
  }, [categoryId, subcategoryId]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={20} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{subcategoryTitle}</Text>
            <Text style={styles.headerSubtitle}>
              {questions.length} {questions.length === 1 ? "question" : "questions"}
            </Text>
          </View>
        </View>

        {/* Questions */}
        <View style={styles.questionsContainer}>
          {questions.map((question) => (
            <TouchableOpacity
              key={question.id}
              style={styles.questionCard}
              onPress={() => router.push({
                pathname: "/(tabs)/ressources/[categoryId]/[subcategoryId]/[questionId]",
                params: { 
                  categoryId, 
                  subcategoryId, 
                  questionId: question.id,
                  question: question.question,
                  answer: question.answer,
                  attachments: JSON.stringify(question.attachments || [])
                }
              })}
              activeOpacity={0.6}
            >
              <View style={styles.questionLeft}>
                <View style={styles.questionIconContainer}>
                  <IconSymbol name="questionmark.circle.fill" size={20} color="#6366f1" />
                </View>
                <View style={styles.questionContent}>
                  <Text style={styles.questionText} numberOfLines={2}>
                    {question.question}
                  </Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>
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
    color: "#64748b",
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: "#fff",
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  questionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  questionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  questionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  questionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#334155",
    lineHeight: 22,
  },
});


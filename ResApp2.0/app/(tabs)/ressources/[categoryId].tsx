"use client";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { db } from "@/firebase";
import {
    collection,
    doc,
    getDoc,
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
import { useLocalSearchParams, useRouter } from "expo-router";

type Subcategory = {
  id: string;
  title: string;
  order?: number;
  questionsCount: number;
};

// Icon mapping function for subcategories
const getSubcategoryIcon = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes("duty") || lowerTitle.includes("shift")) {
    return "clock.fill";
  }
  if (lowerTitle.includes("document") || lowerTitle.includes("doc")) {
    return "doc.text.fill";
  }
  if (lowerTitle.includes("form") || lowerTitle.includes("template")) {
    return "doc.fill";
  }
  if (lowerTitle.includes("policy")) {
    return "doc.on.doc.fill";
  }
  if (lowerTitle.includes("procedure") || lowerTitle.includes("process") || lowerTitle.includes("step")) {
    return "list.bullet.rectangle.fill";
  }
  if (lowerTitle.includes("contact") || lowerTitle.includes("phone")) {
    return "phone.fill";
  }
  if (lowerTitle.includes("email") || lowerTitle.includes("communication") || lowerTitle.includes("message")) {
    return "envelope.fill";
  }
  if (lowerTitle.includes("link") || lowerTitle.includes("url") || lowerTitle.includes("website")) {
    return "link";
  }
  if (lowerTitle.includes("guide") || lowerTitle.includes("tutorial") || lowerTitle.includes("how")) {
    return "book.fill";
  }
  if (lowerTitle.includes("training") || lowerTitle.includes("course") || lowerTitle.includes("learn")) {
    return "graduationcap.fill";
  }
  if (lowerTitle.includes("calendar") || lowerTitle.includes("schedule") || lowerTitle.includes("event")) {
    return "calendar.fill";
  }
  if (lowerTitle.includes("reservation") || lowerTitle.includes("booking")) {
    return "calendar.badge.clock";
  }
  if (lowerTitle.includes("announcement") || lowerTitle.includes("news")) {
    return "megaphone.fill";
  }
  if (lowerTitle.includes("faq") || lowerTitle.includes("question") || lowerTitle.includes("help")) {
    return "questionmark.circle.fill";
  }
  if (lowerTitle.includes("video") || lowerTitle.includes("tutorial")) {
    return "play.circle.fill";
  }
  if (lowerTitle.includes("download") || lowerTitle.includes("file")) {
    return "arrow.down.circle.fill";
  }
  
  // Default icon
  return "folder.fill";
};

export default function CategorySubcategoriesScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const [categoryTitle, setCategoryTitle] = useState("");
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get category title
        const categoryDoc = await getDoc(doc(db, "categories", categoryId));
        if (categoryDoc.exists()) {
          setCategoryTitle(categoryDoc.data().title || "");
        }

        // Get subcategories
        const subcategoriesRef = collection(
          db,
          "categories",
          categoryId,
          "subcategories"
        ) as CollectionReference<DocumentData>;
        const subcategoriesSnap = await getDocs(query(subcategoriesRef, orderBy("order", "asc")));

        const loadedSubcategories: Subcategory[] = [];

        for (const subcategoryDoc of subcategoriesSnap.docs) {
          const questionsRef = collection(
            db,
            "categories",
            categoryId,
            "subcategories",
            subcategoryDoc.id,
            "questions"
          ) as CollectionReference<DocumentData>;
          const questionsSnap = await getDocs(questionsRef);

          loadedSubcategories.push({
            id: subcategoryDoc.id,
            title: subcategoryDoc.data().title || "",
            order: subcategoryDoc.data().order,
            questionsCount: questionsSnap.size,
          });
        }

        setSubcategories(loadedSubcategories);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

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
            <Text style={styles.headerTitle}>{categoryTitle}</Text>
            <Text style={styles.headerSubtitle}>
              {subcategories.length} {subcategories.length === 1 ? "topic" : "topics"}
            </Text>
          </View>
        </View>

        {/* Subcategories */}
        <View style={styles.subcategoriesContainer}>
          {subcategories.map((subcategory) => {
            const subIcon = getSubcategoryIcon(subcategory.title);
            return (
              <TouchableOpacity
                key={subcategory.id}
                style={styles.subcategoryCard}
                onPress={() => router.push({
                  pathname: "/(tabs)/ressources/[categoryId]/[subcategoryId]",
                  params: { categoryId, subcategoryId: subcategory.id }
                })}
                activeOpacity={0.6}
              >
                <View style={styles.subcategoryLeft}>
                  <View style={styles.subcategoryIconContainer}>
                    <IconSymbol name={subIcon as any} size={20} color="#6366f1" />
                  </View>
                <View style={styles.subcategoryInfo}>
                  <Text style={styles.subcategoryTitle}>{subcategory.title}</Text>
                  <Text style={styles.subcategoryCount}>
                    {subcategory.questionsCount} {subcategory.questionsCount === 1 ? "question" : "questions"}
                  </Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color="#cbd5e1" />
            </TouchableOpacity>
            );
          })}
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
  subcategoriesContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  subcategoryCard: {
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
  subcategoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  subcategoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  subcategoryInfo: {
    flex: 1,
  },
  subcategoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  subcategoryCount: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
});


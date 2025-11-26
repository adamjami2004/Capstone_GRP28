"use client"

import { useEffect, useState } from "react"
import { db } from "@/firebase"
import { collection, getDocs, query, orderBy, type CollectionReference, type DocumentData } from "firebase/firestore"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native"

type Attachment = {
  type: "pdf" | "link"
  label: string
  url: string
}

type Question = {
  id: string
  question: string
  answer: string
  attachments?: Attachment[]
}

type Subcategory = {
  id: string
  title: string
  order?: number
  questions: Question[]
}

type Category = {
  id: string
  title: string
  order?: number
  subcategories: Subcategory[]
}

export default function Resources() {
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedSub, setExpandedSub] = useState<string | null>(null)
  const [activeQA, setActiveQA] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)

  const toggleCategory = (id: string) => {
    setExpandedCategory((prev) => (prev === id ? null : id))
    setExpandedSub(null)
  }

  const toggleSub = (id: string) => {
    setExpandedSub((prev) => (prev === id ? null : id))
  }

  const openAttachment = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url)
      if (!supported) {
        Alert.alert("Unable to open", "This link cannot be opened on your device.")
        return
      }
      await Linking.openURL(url)
    } catch (e) {
      Alert.alert("Error", String(e))
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const categoriesRef = collection(db, "categories") as CollectionReference<DocumentData>
        const categoriesSnap = await getDocs(query(categoriesRef, orderBy("order", "asc")))

        const loadedCategories: Category[] = []

        for (const categoryDoc of categoriesSnap.docs) {
          const categoryData = categoryDoc.data()
          const subcategoriesRef = collection(
            db,
            "categories",
            categoryDoc.id,
            "subcategories",
          ) as CollectionReference<DocumentData>
          const subcategoriesSnap = await getDocs(query(subcategoriesRef, orderBy("order", "asc")))

          const loadedSubcategories: Subcategory[] = []

          for (const subcategoryDoc of subcategoriesSnap.docs) {
            const subcategoryData = subcategoryDoc.data()
            const questionsRef = collection(
              db,
              "categories",
              categoryDoc.id,
              "subcategories",
              subcategoryDoc.id,
              "questions",
            ) as CollectionReference<DocumentData>
            const questionsSnap = await getDocs(questionsRef)

            const loadedQuestions: Question[] = questionsSnap.docs.map((qDoc) => ({
              id: qDoc.id,
              question: qDoc.data().question || "",
              answer: qDoc.data().answer || "",
              attachments: qDoc.data().attachments || [],
            }))

            loadedSubcategories.push({
              id: subcategoryDoc.id,
              title: subcategoryData.title || "",
              order: subcategoryData.order,
              questions: loadedQuestions,
            })
          }

          loadedCategories.push({
            id: categoryDoc.id,
            title: categoryData.title || "",
            order: categoryData.order,
            subcategories: loadedSubcategories,
          })
        }

        setCategories(loadedCategories)
      } catch (error) {
        console.error("Error fetching categories:", error)
        Alert.alert("Error", "Failed to load resources. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const renderQuestion =
    (catId: string, subId: string) =>
    ({ item }: { item: Question }) => (
      <TouchableOpacity style={styles.questionItem} onPress={() => setActiveQA(item)} activeOpacity={0.6}>
        <View style={styles.questionContent}>
          <Text style={styles.questionText} numberOfLines={2}>
            {item.question}
          </Text>
        </View>
        <Text style={styles.questionChevron}>›</Text>
      </TouchableOpacity>
    )

  const renderSubcategory =
    (catId: string) =>
    ({ item }: { item: Subcategory }) => (
      <View>
        <TouchableOpacity style={styles.subHeader} onPress={() => toggleSub(item.id)} activeOpacity={0.7}>
          <Text style={styles.subTitle}>{item.title}</Text>
          <Text style={[styles.subChevron, { transform: [{ rotate: expandedSub === item.id ? "180deg" : "0deg" }] }]}>
            ▼
          </Text>
        </TouchableOpacity>
        {expandedSub === item.id && (
          <FlatList
            data={item.questions}
            keyExtractor={(q) => q.id}
            renderItem={renderQuestion(catId, item.id)}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.questionSeparator} />}
            contentContainerStyle={styles.questionsContainer}
          />
        )}
      </View>
    )

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryBlock}>
      <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(item.id)} activeOpacity={0.7}>
        <Text style={styles.categoryTitle}>{item.title}</Text>
        <Text
          style={[
            styles.categoryChevron,
            { transform: [{ rotate: expandedCategory === item.id ? "180deg" : "0deg" }] },
          ]}
        >
          ▼
        </Text>
      </TouchableOpacity>
      {expandedCategory === item.id && (
        <FlatList
          data={item.subcategories}
          keyExtractor={(s) => s.id}
          renderItem={renderSubcategory(item.id)}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.subcategorySeparator} />}
        />
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>📚 Resources</Text>
        <Text style={styles.headerSubtitle}>Find answers and support</Text>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading resources...</Text>
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No resources found</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          renderItem={renderCategory}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          ItemSeparatorComponent={() => <View style={styles.categorySeparator} />}
        />
      )}

      <Modal visible={!!activeQA} transparent animationType="fade" onRequestClose={() => setActiveQA(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Answer</Text>
              <Pressable onPress={() => setActiveQA(null)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Question</Text>
                <View style={styles.questionBox}>
                  <Text style={styles.modalQuestion}>{activeQA?.question}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Answer</Text>
                <View style={styles.answerBox}>
                  <Text style={styles.modalAnswer}>{activeQA?.answer}</Text>
                </View>
              </View>

              {activeQA?.attachments?.length ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Attachments</Text>
                    <View style={styles.attachmentsContainer}>
                      {activeQA.attachments.map((att) => (
                        <Pressable
                          key={att.url}
                          style={styles.attachmentButton}
                          onPress={() => openAttachment(att.url)}
                        >
                          <View style={styles.attachmentIconContainer}>
                            <Text style={styles.attachmentIcon}>{att.type === "pdf" ? "📄" : "🔗"}</Text>
                          </View>
                          <View style={styles.attachmentContent}>
                            <Text style={styles.attachmentLabel}>{att.label}</Text>
                            <Text style={styles.attachmentHint}>Tap to open</Text>
                          </View>
                          <Text style={styles.attachmentArrow}>›</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </>
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setActiveQA(null)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.doneButton} onPress={() => setActiveQA(null)}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  headerContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748b", fontWeight: "500" },
  emptyText: { fontSize: 16, color: "#94a3b8", fontWeight: "500" },
  listContent: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 32 },
  categorySeparator: { height: 8 },
  categoryBlock: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#f9fafb",
  },
  categoryTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b", flex: 1 },
  categoryChevron: { fontSize: 14, color: "#cbd5e1", fontWeight: "600" },
  subcategorySeparator: { height: 0.5, backgroundColor: "#f1f5f9", marginHorizontal: 16 },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fafbfc",
  },
  subTitle: { fontSize: 15, fontWeight: "700", color: "#334155", flex: 1 },
  subChevron: { fontSize: 12, color: "#cbd5e1", fontWeight: "600" },
  questionsContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  questionSeparator: { height: 8 },
  questionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  questionContent: { flex: 1 },
  questionText: { fontSize: 14, fontWeight: "600", color: "#1e293b", lineHeight: 20 },
  questionChevron: { fontSize: 20, color: "#cbd5e1", fontWeight: "300" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    maxHeight: "85%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalHeader: {
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#ffffff", letterSpacing: -0.5 },
  modalCloseButton: { padding: 8, marginRight: -8 },
  modalCloseText: { fontSize: 26, color: "#ffffff", opacity: 0.8, lineHeight: 26, fontWeight: "600" },
  modalContent: { paddingHorizontal: 20, paddingVertical: 20 },
  modalSection: { marginBottom: 16 },
  modalLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  questionBox: {
    backgroundColor: "#f0fdf4",
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalQuestion: { fontSize: 16, fontWeight: "700", color: "#1e293b", lineHeight: 24 },
  answerBox: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalAnswer: { fontSize: 15, lineHeight: 24, color: "#475569", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 16 },
  attachmentsContainer: { gap: 10 },
  attachmentButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f0f9ff",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  attachmentIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentIcon: { fontSize: 20, lineHeight: 24 },
  attachmentContent: { flex: 1 },
  attachmentLabel: { fontSize: 14, fontWeight: "700", color: "#1e40af", marginBottom: 2 },
  attachmentHint: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  attachmentArrow: { fontSize: 18, color: "#94a3b8", fontWeight: "400" },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  cancelButtonText: { color: "#475569", fontWeight: "700", fontSize: 14 },
  doneButton: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#10B981", borderRadius: 8 },
  doneButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 14 },
})

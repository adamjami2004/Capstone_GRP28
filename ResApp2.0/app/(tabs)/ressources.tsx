"use client"

import { useEffect, useState } from "react"
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
} from "react-native"
import * as DocumentPicker from "expo-document-picker"
import { db, storage } from "../../firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Linking } from "react-native"

type Attachment = {
  type: "pdf" | "link"
  label: string
  url: string
  storagePath?: string
  sizeBytes?: number
  name?: string
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
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(true)
  }, [])

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

  const loadHierarchy = async () => {
    setLoading(true)
    try {
      const catsSnap = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")))
      const built: Category[] = []

      for (const catDoc of catsSnap.docs) {
        const catId = catDoc.id
        const cat = catDoc.data() as any

        const subsSnap = await getDocs(
          query(collection(db, "categories", catId, "subcategories"), orderBy("order", "asc")),
        )
        const subs: Subcategory[] = []

        for (const subDoc of subsSnap.docs) {
          const subId = subDoc.id
          const sub = subDoc.data() as any

          const qSnap = await getDocs(collection(db, "categories", catId, "subcategories", subId, "questions"))
          const questions: Question[] = qSnap.docs.map((qd) => {
            const d = qd.data() as any
            const attachments: Attachment[] = Array.isArray(d.attachments) ? d.attachments.filter(Boolean) : []
            return {
              id: qd.id,
              question: d.question ?? "",
              answer: d.answer ?? "",
              attachments,
            }
          })

          subs.push({ id: subId, title: sub.title, order: sub.order ?? 0, questions })
        }

        built.push({ id: catId, title: cat.title, order: cat.order ?? 0, subcategories: subs })
      }

      setCategories(built)
    } catch (e) {
      Alert.alert("Load failed", String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHierarchy()
  }, [])

  const uploadPdfToQuestion = async (q: Question, catId: string, subId: string) => {
    if (!isAdmin) return
    try {
      const pick = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
        copyToCacheDirectory: true,
      })

      const asset = (pick as any)?.assets?.[0] ?? (pick as any)
      if ((pick as any)?.canceled || !asset?.uri) return

      const filename: string = asset.name?.toString() || `attachment-${Date.now()}.pdf`
      const storagePath = `faqs/${catId}/${subId}/${q.id}/${filename}`
      const storageRef = ref(storage, storagePath)

      const resp = await fetch(asset.uri)
      const blob = await resp.blob()

      await uploadBytes(storageRef, blob, {
        contentType: "application/pdf",
      })

      const url = await getDownloadURL(storageRef)

      const next: Attachment[] = [
        ...(q.attachments ?? []),
        {
          type: "pdf",
          label: filename,
          url,
          storagePath,
          sizeBytes: (asset.size as number) || undefined,
          name: filename,
        },
      ]

      await updateDoc(doc(db, "categories", catId, "subcategories", subId, "questions", q.id), {
        attachments: next,
      })

      await loadHierarchy()
      Alert.alert("Success", "PDF attached to the question.")
    } catch (e) {
      Alert.alert("Upload failed", String(e))
    }
  }

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
        {isAdmin && (
          <Pressable style={styles.pdfButton} onPress={() => uploadPdfToQuestion(item, catId, subId)}>
            <Text style={styles.pdfButtonText}>PDF</Text>
          </Pressable>
        )}
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

      <Modal visible={!!activeQA} transparent animationType="slide" onRequestClose={() => setActiveQA(null)}>
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
                <Text style={styles.modalQuestion}>{activeQA?.question}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Answer</Text>
                <Text style={styles.modalAnswer}>{activeQA?.answer}</Text>
              </View>

              {activeQA?.attachments?.length ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Attachments</Text>
                    {activeQA.attachments.map((att) => (
                      <Pressable key={att.url} style={styles.attachmentButton} onPress={() => openAttachment(att.url)}>
                        <Text style={styles.attachmentIcon}>{att.type === "pdf" ? "📄" : "🔗"}</Text>
                        <Text style={styles.attachmentLabel}>{att.label}</Text>
                      </Pressable>
                    ))}
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
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
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
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  categorySeparator: {
    height: 8,
  },
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
  categoryTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
  },
  categoryChevron: {
    fontSize: 14,
    color: "#cbd5e1",
    fontWeight: "600",
  },
  subcategorySeparator: {
    height: 0.5,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 16,
  },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fafbfc",
  },
  subTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    flex: 1,
  },
  subChevron: {
    fontSize: 12,
    color: "#cbd5e1",
    fontWeight: "600",
  },
  questionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  questionSeparator: {
    height: 8,
  },
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
  questionContent: {
    flex: 1,
  },
  questionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    lineHeight: 20,
  },
  questionChevron: {
    fontSize: 20,
    color: "#cbd5e1",
    fontWeight: "300",
  },
  pdfButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#dbeafe",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  pdfButtonText: {
    color: "#1e40af",
    fontWeight: "700",
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
  },
  modalHeader: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 24,
    color: "#ffffff",
    opacity: 0.9,
    lineHeight: 24,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  modalSection: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalQuestion: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    lineHeight: 22,
  },
  modalAnswer: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
  attachmentButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  attachmentIcon: {
    fontSize: 16,
  },
  attachmentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: 14,
  },
  doneButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#10B981",
    borderRadius: 8,
  },
  doneButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
})

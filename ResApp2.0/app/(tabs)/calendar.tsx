import { ThemedView } from "@/components/themed-view"
import { IconSymbol } from "@/components/ui/icon-symbol"
import { auth, db } from "@/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, query, updateDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"

type Event = {
  id: string
  title: string
  type: "event" | "deadline" | "special"
  startTime: string
  endTime?: string
  date: string
}

type EventsMap = {
  [key: string]: Event[]
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const EVENT_TYPES: { label: string; value: Event["type"]; color: string }[] = [
  { label: "Event", value: "event", color: "#3b82f6" },
  { label: "Deadline", value: "deadline", color: "#ef4444" },
  { label: "Special", value: "special", color: "#8b5cf6" },
]

const getEventColor = (type: Event["type"]) => {
  switch (type) {
    case "deadline": return "#ef4444"
    case "event": return "#3b82f6"
    case "special": return "#8b5cf6"
  }
}

const formatTimeRange = (event: Event) => {
  if (event.type === "deadline") return `Due: ${event.startTime}`
  if (event.startTime === "All Day") return "All Day"
  if (event.endTime) return `${event.startTime} - ${event.endTime}`
  return event.startTime
}

export default function TabTwoScreen() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [events, setEvents] = useState<EventsMap>({})
  const [isLoading, setIsLoading] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "event" as Event["type"],
    startTime: "",
    endTime: "",
  })

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "Users", user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setIsAdmin(userData.role === "Admin")
          } else {
            setIsAdmin(false)
          }
        } catch (error) {
          console.error("Error fetching user role:", error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
    })

    const eventsQuery = query(collection(db, "CalendarEvents"))
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventsMap: EventsMap = {}
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        const event: Event = {
          id: doc.id,
          title: data.title,
          type: data.type,
          startTime: data.startTime,
          endTime: data.endTime,
          date: data.date,
        }
        if (!eventsMap[event.date]) {
          eventsMap[event.date] = []
        }
        eventsMap[event.date].push(event)
      })
      setEvents(eventsMap)
    })

    return () => {
      unsubscribeAuth()
      unsubscribeEvents()
    }
  }, [])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDayPress = (dateKey: string) => {
    setSelectedDate(dateKey)
    setModalVisible(true)
  }

  const formatSelectedDate = (dateKey: string) => {
    const [year, month, day] = dateKey.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }

  const handleOpenCreateModal = () => {
    setModalVisible(false)
    setNewEvent({
      title: "",
      type: "event",
      startTime: "",
      endTime: "",
    })
    setCreateModalVisible(true)
  }

  const handleOpenEditModal = (event: Event) => {
    setEditingEvent(event)
    setNewEvent({
      title: event.title,
      type: event.type,
      startTime: event.startTime,
      endTime: event.endTime || "",
    })
    setModalVisible(false)
    setEditModalVisible(true)
  }

  const handleCreateEvent = async () => {
    if (!selectedDate || !newEvent.title || !newEvent.startTime) return

    setIsLoading(true)
    try {
      await addDoc(collection(db, "CalendarEvents"), {
        title: newEvent.title,
        type: newEvent.type,
        startTime: newEvent.startTime,
        endTime: newEvent.type === "deadline" ? null : (newEvent.endTime || null),
        date: selectedDate,
        createdAt: new Date(),
      })
      setCreateModalVisible(false)
      setModalVisible(true)
    } catch (error) {
      console.error("Error creating event:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateEvent = async () => {
    if (!editingEvent || !newEvent.title || !newEvent.startTime) return

    setIsLoading(true)
    try {
      await updateDoc(doc(db, "CalendarEvents", editingEvent.id), {
        title: newEvent.title,
        type: newEvent.type,
        startTime: newEvent.startTime,
        endTime: newEvent.type === "deadline" ? null : (newEvent.endTime || null),
        updatedAt: new Date(),
      })
      setEditModalVisible(false)
      setEditingEvent(null)
      setModalVisible(true)
    } catch (error) {
      console.error("Error updating event:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEvent = (event: Event) => {
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${event.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "CalendarEvents", event.id))
            } catch (error) {
              console.error("Error deleting event:", error)
            }
          },
        },
      ]
    )
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const today = new Date()
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year

    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day)
      const dayEvents = events[dateKey]
      const hasEvents = dayEvents !== undefined
      const isToday = isCurrentMonth && today.getDate() === day

      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.dayCell, isToday && styles.todayCell]}
          onPress={() => handleDayPress(dateKey)}
        >
          <View style={styles.dayCellContent}>
            <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
            {hasEvents && (
              <View style={styles.eventDots}>
                {dayEvents.slice(0, 3).map((event) => (
                  <View
                    key={event.id}
                    style={[styles.eventDot, { backgroundColor: getEventColor(event.type) }]}
                  />
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>,
      )
    }

    return days
  }

  const selectedEvents = selectedDate && events[selectedDate] ? events[selectedDate] : []
  const totalEventsCount = Object.values(events).reduce((sum, dayEvents) => sum + dayEvents.length, 0)

  const renderEventForm = (isEdit: boolean) => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Title</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Event title"
          placeholderTextColor="#9ca3af"
          value={newEvent.title}
          onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Type</Text>
        <View style={styles.typeSelector}>
          {EVENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeOption,
                newEvent.type === type.value && { backgroundColor: type.color },
              ]}
              onPress={() => setNewEvent({ ...newEvent, type: type.value, endTime: type.value === "deadline" ? "" : newEvent.endTime })}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  newEvent.type === type.value && { color: "#fff" },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {newEvent.type === "deadline" ? (
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Deadline Time</Text>
          <TextInput
            style={styles.textInput}
            placeholder="11:59 PM"
            placeholderTextColor="#9ca3af"
            value={newEvent.startTime}
            onChangeText={(text) => setNewEvent({ ...newEvent, startTime: text })}
          />
        </View>
      ) : (
        <View style={styles.timeRow}>
          <View style={styles.timeGroup}>
            <Text style={styles.formLabel}>Start Time</Text>
            <TextInput
              style={styles.textInput}
              placeholder="9:00 AM"
              placeholderTextColor="#9ca3af"
              value={newEvent.startTime}
              onChangeText={(text) => setNewEvent({ ...newEvent, startTime: text })}
            />
          </View>
          <View style={styles.timeGroup}>
            <Text style={styles.formLabel}>End Time</Text>
            <TextInput
              style={styles.textInput}
              placeholder="10:00 AM"
              placeholderTextColor="#9ca3af"
              value={newEvent.endTime}
              onChangeText={(text) => setNewEvent({ ...newEvent, endTime: text })}
            />
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.createButton, (!newEvent.title || !newEvent.startTime) && styles.createButtonDisabled]}
        onPress={isEdit ? handleUpdateEvent : handleCreateEvent}
        disabled={!newEvent.title || !newEvent.startTime || isLoading}
      >
        <Text style={styles.createButtonText}>
          {isLoading ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Event")}
        </Text>
      </TouchableOpacity>
    </>
  )

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconContainer}>
              <IconSymbol size={26} name="calendar" color="#3b82f6" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Operational Calendar</Text>
              <Text style={styles.headerSubtitle}>
                {totalEventsCount} {totalEventsCount === 1 ? "event" : "events"} scheduled
              </Text>
            </View>
          </View>
        </View>

        {/* Tutorial/Info Section */}
        <View style={styles.tutorialSection}>
          <View style={styles.tutorialCard}>
            <IconSymbol name="info.circle.fill" size={18} color="#64748b" />
            <Text style={styles.tutorialText}>
              Tap any date to view or add events. Use the + button to create new events.
            </Text>
          </View>
        </View>

        <View style={styles.monthCard}>
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <IconSymbol name="chevron.left" size={20} color="#666" />
            </TouchableOpacity>

            <Text style={styles.monthText}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>

            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <IconSymbol name="chevron.right" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.dayHeaders}>
            {DAYS.map((day) => (
              <View key={day} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calendarGrid}>{renderCalendar()}</View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedDate && formatSelectedDate(selectedDate)}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <IconSymbol name="xmark" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <IconSymbol name="calendar" size={48} color="#d1d5db" />
                </View>
                <Text style={styles.emptyText}>No events scheduled</Text>
                <Text style={styles.emptySubtext}>This day is free</Text>
              </View>
            ) : (
              <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
                {selectedEvents.map((event) => (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={[styles.eventColorBar, { backgroundColor: getEventColor(event.type) }]} />
                    <View style={styles.eventContent}>
                      <View style={styles.eventHeader}>
                        <View style={[styles.eventTypeBadge, { backgroundColor: `${getEventColor(event.type)}15` }]}>
                          <Text style={[styles.eventTypeText, { color: getEventColor(event.type) }]}>
                            {event.type === "deadline" ? "Deadline" : event.type === "special" ? "Special" : "Event"}
                          </Text>
                        </View>
                        {isAdmin && (
                          <View style={styles.eventActions}>
                            <TouchableOpacity
                              style={styles.eventActionButton}
                              onPress={() => handleOpenEditModal(event)}
                            >
                              <IconSymbol name="pencil" size={14} color="#6b7280" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.eventActionButton}
                              onPress={() => handleDeleteEvent(event)}
                            >
                              <IconSymbol name="trash" size={14} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventTimeContainer}>
                        <IconSymbol name="clock" size={14} color="#9ca3af" />
                        <Text style={styles.eventTime}>{formatTimeRange(event)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {isAdmin && (
              <TouchableOpacity style={styles.addButton} onPress={handleOpenCreateModal}>
                <IconSymbol name="plus" size={16} color="#fff" />
                <Text style={styles.addButtonText}>Add Event</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={createModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCreateModalVisible(false)}>
          <Pressable style={styles.createModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.createModalHeader}>
              <Text style={styles.createModalTitle}>New Event</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.closeButton}>
                <IconSymbol name="xmark" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.createModalDate}>
              {selectedDate && formatSelectedDate(selectedDate)}
            </Text>

            {renderEventForm(false)}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <Pressable style={styles.createModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.createModalHeader}>
              <Text style={styles.createModalTitle}>Edit Event</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeButton}>
                <IconSymbol name="xmark" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.createModalDate}>
              {selectedDate && formatSelectedDate(selectedDate)}
            </Text>

            {renderEventForm(true)}
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingBottom: 100,
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
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 0,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  monthCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  monthNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  navButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#f9fafb",
  },
  monthText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: 16,
    paddingVertical: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.285714%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 6,
    minHeight: 50,
  },
  todayCell: {
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "#000",
  },
  dayCellContent: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 6,
  },
  dayText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
    lineHeight: 22,
  },
  todayText: {
    fontWeight: "700",
    color: "#000",
  },
  eventDots: {
    flexDirection: "row",
    gap: 3,
    marginTop: 2,
    justifyContent: "center",
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tutorialSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tutorialCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tutorialText: {
    flex: 1,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  closeButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
  },
  eventsList: {
    maxHeight: 350,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  eventColorBar: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 16,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  eventTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventTypeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventActions: {
    flexDirection: "row",
    gap: 8,
  },
  eventActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  eventTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventTime: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  addButton: {
    backgroundColor: "#000",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    alignSelf: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  createModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  createModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  createModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    letterSpacing: -0.5,
  },
  createModalDate: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#000",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 10,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  timeGroup: {
    flex: 1,
  },
  createButton: {
    backgroundColor: "#000",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  createButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
"use client"

import { useState } from "react"
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView, Pressable, Text } from "react-native"
import { ThemedView } from "@/components/themed-view"
import { IconSymbol } from "@/components/ui/icon-symbol"

type Event = {
  id: number
  title: string
  type: "event" | "deadline" | "special"
  startTime: string
  endTime?: string
}

type EventsMap = {
  [key: string]: Event[]
}

const MOCK_EVENTS: EventsMap = {
  "2025-10-05": [
    { id: 101, title: "Q4 Planning Meeting", type: "event", startTime: "9:00 AM", endTime: "11:00 AM" },
    { id: 102, title: "Budget Review", type: "deadline", startTime: "5:00 PM" },
  ],
  "2024-10-12": [{ id: 103, title: "Team Building Event", type: "special", startTime: "1:00 PM", endTime: "5:00 PM" }],
  "2024-10-18": [
    { id: 104, title: "Client Workshop", type: "event", startTime: "10:00 AM", endTime: "3:00 PM" },
    { id: 105, title: "Quarterly Report Due", type: "deadline", startTime: "11:59 PM" },
  ],
  "2024-10-25": [{ id: 106, title: "Product Demo", type: "event", startTime: "2:00 PM", endTime: "3:30 PM" }],
  "2024-10-31": [{ id: 107, title: "Halloween Party", type: "special", startTime: "6:00 PM", endTime: "10:00 PM" }],
  "2024-11-03": [{ id: 201, title: "Strategy Session", type: "event", startTime: "9:00 AM", endTime: "12:00 PM" }],
  "2024-11-08": [
    { id: 202, title: "Design Sprint", type: "event", startTime: "10:00 AM", endTime: "4:00 PM" },
    { id: 203, title: "Proposal Deadline", type: "deadline", startTime: "5:00 PM" },
  ],
  "2024-11-15": [{ id: 204, title: "Company Retreat", type: "special", startTime: "All Day" }],
  "2024-11-22": [
    { id: 205, title: "Client Presentation", type: "event", startTime: "2:00 PM", endTime: "4:00 PM" },
    { id: 206, title: "Monthly Review", type: "event", startTime: "4:30 PM", endTime: "5:30 PM" },
  ],
  "2024-11-28": [
    { id: 207, title: "Thanksgiving Celebration", type: "special", startTime: "12:00 PM", endTime: "3:00 PM" },
  ],
  "2025-04-05": [
    { id: 1, title: "Project Proposal Due", type: "deadline", startTime: "11:59 PM" },
    { id: 2, title: "Team Meeting", type: "event", startTime: "2:00 PM", endTime: "3:30 PM" },
  ],
  "2025-04-10": [{ id: 3, title: "Design Review", type: "event", startTime: "10:00 AM", endTime: "11:30 AM" }],
  "2025-04-12": [{ id: 9, title: "Company Anniversary", type: "special", startTime: "All Day" }],
  "2025-04-15": [
    { id: 4, title: "Final Submission", type: "deadline", startTime: "11:59 PM" },
    { id: 10, title: "Team Lunch", type: "special", startTime: "12:00 PM", endTime: "2:00 PM" },
  ],
  "2025-04-18": [
    { id: 5, title: "Client Presentation", type: "event", startTime: "3:00 PM", endTime: "4:30 PM" },
    { id: 6, title: "Budget Report Due", type: "deadline", startTime: "5:00 PM" },
  ],
  "2025-04-22": [{ id: 7, title: "Sprint Planning", type: "event", startTime: "9:00 AM", endTime: "10:30 AM" }],
  "2025-04-25": [{ id: 11, title: "Product Launch", type: "special", startTime: "2:00 PM", endTime: "5:00 PM" }],
  "2025-04-28": [{ id: 8, title: "Monthly Review", type: "event", startTime: "1:00 PM", endTime: "2:30 PM" }],
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const getEventColor = (type: Event["type"]) => {
  switch (type) {
    case "deadline": return "#ef4444"
    case "event": return "#3b82f6"
    case "special": return "#8b5cf6"
  }
}

const formatTimeRange = (event: Event) => {
  if (event.startTime === "All Day") return "All Day"
  if (event.endTime) return `${event.startTime} - ${event.endTime}`
  return event.startTime
}

export default function TabTwoScreen() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

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

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const today = new Date()
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />)
    }

    // Add actual day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day)
      const dayEvents = MOCK_EVENTS[dateKey]
      const hasEvents = dayEvents !== undefined
      const isToday = isCurrentMonth && today.getDate() === day

      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.dayCell, isToday && styles.todayCell]}
          onPress={() => handleDayPress(dateKey)}
        >
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
        </TouchableOpacity>,
      )
    }

    return days
  }

  const selectedEvents = selectedDate && MOCK_EVENTS[selectedDate] ? MOCK_EVENTS[selectedDate] : []

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Your Schedule</Text>
          <Text style={styles.name}>Calendar</Text>
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

        {/* Add New Event Button */}
        <TouchableOpacity 
          style={styles.addEventButton}
          activeOpacity={0.8}
          onPress={() => console.log("Add event pressed")}
        >
          <IconSymbol name="plus.circle.fill" size={24} color="#3b82f6" />
          <Text style={styles.addEventButtonText}>Add a new event</Text>
          <IconSymbol name="chevron.right" size={20} color="#3b82f6" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* View Events Modal */}
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
                <IconSymbol name="xmark" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <IconSymbol name="calendar" size={56} color="#e5e7eb" />
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
                        <View style={[styles.eventTypeBadge, { backgroundColor: `${getEventColor(event.type)}20` }]}>
                          <Text style={[styles.eventTypeText, { color: getEventColor(event.type) }]}>
                            {event.type === "deadline" ? "Deadline" : event.type === "special" ? "Special" : "Event"}
                          </Text>
                        </View>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  greeting: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  name: {
    fontSize: 34,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  monthCard: {
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
    marginBottom: 12,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 13,
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
    borderRadius: 10,
    marginBottom: 4,
  },
  todayCell: {
    backgroundColor: "#eff6ff",
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  todayText: {
    fontWeight: "700",
    color: "#3b82f6",
  },
  eventDots: {
    flexDirection: "row",
    gap: 3,
    marginTop: 4,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  addEventButton: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#e0f2fe",
  },
  addEventButtonText: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#3b82f6",
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#9ca3af",
  },
  eventsList: {
    maxHeight: 450,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  eventColorBar: {
    width: 5,
  },
  eventContent: {
    flex: 1,
    padding: 18,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  eventTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    lineHeight: 24,
  },
  eventTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventTime: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
})
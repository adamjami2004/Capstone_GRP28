"use client";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/firebase";
import {
    cancelReservation,
    createReservation,
    fetchRoomReservations,
    fetchRooms,
    fetchUserReservations,
    formatDate,
    formatTime,
    updateReservation,
} from "@/helpers/reservationHelper";
import { Reservation, Room } from "@/types/reservation";
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

export default function ReservationsScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Booking form state
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [roomReservations, setRoomReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert("Authentication Required", "Please log in to view reservations.");
        return;
      }

      // Check if user is admin
      const usersRef = collection(db, "Users");
      const userQuery = query(usersRef, where("uid", "==", user.uid));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        setIsAdmin(userData.role === "Admin" || userData.role === "Super Admin");
      }

      // Fetch rooms and user reservations
      const [roomsData, reservationsData] = await Promise.all([
        fetchRooms(),
        fetchUserReservations(user.uid),
      ]);

      setRooms(roomsData);
      setUserReservations(reservationsData);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookRoom = (room: Room) => {
    setSelectedRoom(room);
    // Set default date to today
    const today = new Date();
    const dateString = today.toISOString().split("T")[0];
    setBookingDate(dateString);
    setStartTime("");
    setEndTime("");
    setPurpose("");
    setShowBookingModal(true);
    loadRoomReservations(room.id, dateString);
  };

  const loadRoomReservations = async (roomId: string, date: string) => {
    try {
      const reservations = await fetchRoomReservations(roomId, date);
      setRoomReservations(reservations);
    } catch (error) {
      console.error("Error loading room reservations:", error);
    }
  };

  const handleDateChange = (date: string) => {
    setBookingDate(date);
    if (selectedRoom) {
      loadRoomReservations(selectedRoom.id, date);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedRoom || !bookingDate || !startTime || !endTime) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createReservation({
        roomId: selectedRoom.id,
        date: bookingDate,
        startTime,
        endTime,
        purpose,
      });

      if (result.success) {
        Alert.alert("Success", "Room booked successfully!");
        setShowBookingModal(false);
        loadData();
      } else {
        Alert.alert("Error", result.error || "Failed to book room");
      }
    } catch (error) {
      console.error("Error booking room:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setBookingDate(reservation.date);
    setStartTime(reservation.startTime);
    setEndTime(reservation.endTime);
    setPurpose(reservation.purpose || "");
    setShowEditModal(true);
  };

  const handleUpdateReservation = async () => {
    if (!selectedReservation || !bookingDate || !startTime || !endTime) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateReservation(selectedReservation.id, {
        date: bookingDate,
        startTime,
        endTime,
        purpose,
      });

      if (result.success) {
        Alert.alert("Success", "Reservation updated successfully!");
        setShowEditModal(false);
        loadData();
      } else {
        Alert.alert("Error", result.error || "Failed to update reservation");
      }
    } catch (error) {
      console.error("Error updating reservation:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    Alert.alert(
      "Cancel Reservation",
      "Are you sure you want to cancel this reservation?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await cancelReservation(reservationId);
              if (result.success) {
                Alert.alert("Success", "Reservation cancelled successfully!");
                loadData();
              } else {
                Alert.alert("Error", result.error || "Failed to cancel reservation");
              }
            } catch (error) {
              console.error("Error cancelling reservation:", error);
              Alert.alert("Error", "An unexpected error occurred");
            }
          },
        },
      ]
    );
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const isTimeSlotAvailable = (time: string) => {
    if (!startTime) return true;
    
    const startMinutes = parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]);
    const timeMinutes = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
    
    // For end time, must be after start time
    if (timeMinutes <= startMinutes) return false;
    
    // Check if conflicts with existing reservations
    for (const reservation of roomReservations) {
      const resStart = parseInt(reservation.startTime.split(":")[0]) * 60 + 
                      parseInt(reservation.startTime.split(":")[1]);
      const resEnd = parseInt(reservation.endTime.split(":")[0]) * 60 + 
                    parseInt(reservation.endTime.split(":")[1]);
      
      if (startMinutes < resEnd && timeMinutes > resStart) {
        return false;
      }
    }
    
    return true;
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* My Reservations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Reservations</Text>
          {userReservations.length === 0 ? (
            <View style={styles.emptyCard}>
              <IconSymbol name="calendar.badge.exclamationmark" size={32} color="#999" />
              <Text style={styles.emptyText}>No active reservations</Text>
            </View>
          ) : (
            userReservations.map((reservation) => (
              <View key={reservation.id} style={styles.reservationCard}>
                <View style={styles.reservationHeader}>
                  <View>
                    <Text style={styles.reservationRoom}>{reservation.roomName}</Text>
                    <Text style={styles.reservationDate}>{formatDate(reservation.date)}</Text>
                  </View>
                  <View style={styles.reservationActions}>
                    <TouchableOpacity
                      onPress={() => handleEditReservation(reservation)}
                      style={styles.actionButton}
                    >
                      <IconSymbol name="pencil" size={18} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleCancelReservation(reservation.id)}
                      style={styles.actionButton}
                    >
                      <IconSymbol name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.reservationDetails}>
                  <View style={styles.detailRow}>
                    <IconSymbol name="clock" size={14} color="#666" />
                    <Text style={styles.detailText}>
                      {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                    </Text>
                  </View>
                  {reservation.purpose && (
                    <View style={styles.detailRow}>
                      <IconSymbol name="text.bubble" size={14} color="#666" />
                      <Text style={styles.detailText}>{reservation.purpose}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Available Rooms Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Rooms ({rooms.length})</Text>
          {rooms.length === 0 ? (
            <View style={styles.emptyCard}>
              <IconSymbol name="building.2" size={32} color="#999" />
              <Text style={styles.emptyText}>No available rooms</Text>
              <Text style={[styles.emptyText, { fontSize: 12, marginTop: 8 }]}>
                Check console logs for debug info
              </Text>
            </View>
          ) : (
            rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomCard}
                onPress={() => handleBookRoom(room)}
              >
                <View style={styles.roomIcon}>
                  <IconSymbol name="door.left.hand.open" size={24} color="#3b82f6" />
                </View>
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <Text style={styles.roomLocation}>{room.location}</Text>
                  <View style={styles.roomMeta}>
                    <IconSymbol name="person.2" size={12} color="#666" />
                    <Text style={styles.roomCapacity}>Capacity: {room.capacity}</Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={20} color="#999" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book {selectedRoom?.name}</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <IconSymbol name="xmark" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Date Input */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  value={bookingDate}
                  onChangeText={handleDateChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Existing Reservations for Selected Date */}
              {roomReservations.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Booked Time Slots</Text>
                  {roomReservations.map((res) => (
                    <View key={res.id} style={styles.bookedSlot}>
                      <Text style={styles.bookedSlotText}>
                        {formatTime(res.startTime)} - {formatTime(res.endTime)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Start Time */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Start Time *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.timeSlotContainer}>
                    {generateTimeSlots().map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeSlot,
                          startTime === time && styles.timeSlotSelected,
                        ]}
                        onPress={() => setStartTime(time)}
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            startTime === time && styles.timeSlotTextSelected,
                          ]}
                        >
                          {formatTime(time)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* End Time */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>End Time *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.timeSlotContainer}>
                    {generateTimeSlots()
                      .filter((time) => !startTime || time > startTime)
                      .map((time) => {
                        const available = isTimeSlotAvailable(time);
                        return (
                          <TouchableOpacity
                            key={time}
                            style={[
                              styles.timeSlot,
                              endTime === time && styles.timeSlotSelected,
                              !available && styles.timeSlotDisabled,
                            ]}
                            onPress={() => available && setEndTime(time)}
                            disabled={!available}
                          >
                            <Text
                              style={[
                                styles.timeSlotText,
                                endTime === time && styles.timeSlotTextSelected,
                                !available && styles.timeSlotTextDisabled,
                              ]}
                            >
                              {formatTime(time)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                </ScrollView>
              </View>

              {/* Purpose */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Purpose (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={purpose}
                  onChangeText={setPurpose}
                  placeholder="e.g., Study session, Team meeting"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitBooking}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Book Room</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Reservation</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <IconSymbol name="xmark" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Date Input */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  style={styles.input}
                  value={bookingDate}
                  onChangeText={setBookingDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Start Time */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Start Time *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.timeSlotContainer}>
                    {generateTimeSlots().map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeSlot,
                          startTime === time && styles.timeSlotSelected,
                        ]}
                        onPress={() => setStartTime(time)}
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            startTime === time && styles.timeSlotTextSelected,
                          ]}
                        >
                          {formatTime(time)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* End Time */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>End Time *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.timeSlotContainer}>
                    {generateTimeSlots()
                      .filter((time) => !startTime || time > startTime)
                      .map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeSlot,
                            endTime === time && styles.timeSlotSelected,
                          ]}
                          onPress={() => setEndTime(time)}
                        >
                          <Text
                            style={[
                              styles.timeSlotText,
                              endTime === time && styles.timeSlotTextSelected,
                            ]}
                          >
                            {formatTime(time)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </ScrollView>
              </View>

              {/* Purpose */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Purpose (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={purpose}
                  onChangeText={setPurpose}
                  placeholder="e.g., Study session, Team meeting"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleUpdateReservation}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Reservation</Text>
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
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
  },
  reservationCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  reservationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reservationRoom: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  reservationDate: {
    fontSize: 14,
    color: "#666",
  },
  reservationActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  reservationDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
  },
  roomCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  roomLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  roomMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  roomCapacity: {
    fontSize: 12,
    color: "#666",
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
    height: 80,
    textAlignVertical: "top",
  },
  timeSlotContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  timeSlot: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: "center",
  },
  timeSlotSelected: {
    backgroundColor: "#3b82f6",
  },
  timeSlotDisabled: {
    backgroundColor: "#e5e7eb",
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  timeSlotTextSelected: {
    color: "#fff",
  },
  timeSlotTextDisabled: {
    color: "#9ca3af",
  },
  bookedSlot: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  bookedSlotText: {
    fontSize: 13,
    color: "#991b1b",
    fontWeight: "500",
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


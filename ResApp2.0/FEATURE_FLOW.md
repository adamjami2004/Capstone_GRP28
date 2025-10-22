# Room Reservation Feature - Flow Diagram

## 📱 User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOME SCREEN                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Operations Section                              │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  🚪 Room Reservation                               │  │   │
│  │  │      Book study rooms                  [→]         │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↓ [User taps]
┌─────────────────────────────────────────────────────────────────┐
│                   RESERVATIONS SCREEN                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  MY RESERVATIONS                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  Study Room A                     [✏️ Edit] [🗑️ Del]│ │ │
│  │  │  Mon, Oct 23, 2025                                   │ │ │
│  │  │  🕐 2:00 PM - 4:00 PM                                │ │ │
│  │  │  💬 Team meeting                                     │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AVAILABLE ROOMS                                           │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  🚪 Study Room A          [→]                        │ │ │
│  │  │     Library - 1st Floor                              │ │ │
│  │  │     👥 Capacity: 4                                   │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  🚪 Conference Room       [→]                        │ │ │
│  │  │     Main Building - 3rd Floor                        │ │ │
│  │  │     👥 Capacity: 12                                  │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ↓ [User taps room]
┌─────────────────────────────────────────────────────────────────┐
│                      BOOKING MODAL                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Book Study Room A                               [✕]      │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │                                                            │ │
│  │  Date *                                                    │ │
│  │  [2025-10-24________________]                             │ │
│  │                                                            │ │
│  │  Booked Time Slots                                        │ │
│  │  🔴 10:00 AM - 11:30 AM                                   │ │
│  │  🔴 2:00 PM - 3:00 PM                                     │ │
│  │                                                            │ │
│  │  Start Time *                                             │ │
│  │  ┌────┬────┬────┬────┬────┬────┬────┬────┐              │ │
│  │  │8:00│8:30│9:00│9:30│...│3:30│4:00│4:30│ →            │ │
│  │  └────┴────┴────┴────┴────┴────┴────┴────┘              │ │
│  │                                                            │ │
│  │  End Time *                                               │ │
│  │  ┌────┬────┬────┬────┬────┬────┬────┬────┐              │ │
│  │  │9:00│9:30│10:0│...│4:30│5:00│5:30│6:00│ →            │ │
│  │  └────┴────┴────┴────┴────┴────┴────┴────┘              │ │
│  │                                                            │ │
│  │  Purpose (Optional)                                       │ │
│  │  [Study session_____________________________]             │ │
│  │                                                            │ │
│  │              ┌─────────────────┐                          │ │
│  │              │   Book Room     │                          │ │
│  │              └─────────────────┘                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ↓ [User submits]
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATION & PROCESSING                       │
│                                                                  │
│  1. Validate date (not in past, within 90 days)                 │
│  2. Validate time range (30 min - 8 hours)                      │
│  3. Check for conflicts with existing bookings                  │
│  4. Verify user authentication                                  │
│  5. Create reservation in Firestore                             │
│                                                                  │
│              ┌───────────┐        ┌───────────┐                 │
│              │  SUCCESS  │   OR   │   ERROR   │                 │
│              └───────────┘        └───────────┘                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                        CONFIRMATION                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                       ✅ Success                            │ │
│  │                                                            │ │
│  │              Room booked successfully!                     │ │
│  │                                                            │ │
│  │                        [OK]                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 System Architecture Flow

```
┌──────────────┐
│              │
│   USER UI    │  (reservations.tsx)
│              │
└──────┬───────┘
       │
       │ calls functions
       │
       ↓
┌──────────────────────────────────────────────────────────┐
│                                                           │
│  HELPER FUNCTIONS (reservationHelper.ts)                 │
│                                                           │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  fetchRooms()       │  │  createReservation()     │  │
│  │  fetchReservations()│  │  updateReservation()     │  │
│  │  fetchRoomById()    │  │  cancelReservation()     │  │
│  └─────────────────────┘  └──────────────────────────┘  │
│                                                           │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  Validation:        │  │  Conflict Detection:     │  │
│  │  - validateDate()   │  │  - checkConflict()       │  │
│  │  - validateTime()   │  │  - timeRangesOverlap()   │  │
│  └─────────────────────┘  └──────────────────────────┘  │
│                                                           │
└───────────────────────┬───────────────────────────────────┘
                        │
                        │ queries/writes
                        │
                        ↓
┌────────────────────────────────────────────────────────────┐
│                    FIREBASE FIRESTORE                       │
│                                                            │
│  ┌──────────────────┐         ┌──────────────────────┐    │
│  │  Rooms           │         │  Reservations        │    │
│  │  Collection      │         │  Collection          │    │
│  │                  │         │                      │    │
│  │  - Study Room A  │         │  - Booking #1        │    │
│  │  - Study Room B  │◄────────│  - Booking #2        │    │
│  │  - Conf Room     │  links  │  - Booking #3        │    │
│  │  - ...           │         │  - ...               │    │
│  └──────────────────┘         └──────────────────────┘    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 🔐 Permission Flow

```
┌─────────────┐
│    USER     │
└──────┬──────┘
       │
       ↓
┌──────────────────────┐
│  Fetch User Profile  │
│  from Firestore      │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│  Check Role:         │
│  - Regular User      │◄─────┐
│  - Admin             │      │
│  - Super Admin       │      │
└──────┬───────────────┘      │
       │                      │
       ↓                      │
┌──────────────────────────┐  │
│  Set Permissions:        │  │
│                          │  │
│  IF Regular User:        │  │
│    - View own bookings   │  │
│    - Create bookings     │  │
│    - Edit own bookings   │  │
│    - Cancel own bookings │  │
│                          │  │
│  IF Admin:               │  │
│    - All above +         │  │
│    - View all bookings   │  │
│    - Edit any booking    │  │
│    - Cancel any booking  │  │
│    - Seed database       │  │
└──────┬───────────────────┘  │
       │                      │
       │                      │
       ↓                      │
┌──────────────────────────┐  │
│  Action Requested        │  │
└──────┬───────────────────┘  │
       │                      │
       ↓                      │
┌──────────────────────────┐  │
│  Permission Check        │  │
│                          │  │
│  IF editing:             │  │
│    - Is this mine? ──────┼──┘
│    - Am I admin?         │
│                          │
│  IF admin action:        │
│    - Am I admin?         │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────┐
│  ✅ ALLOWED      │
│  ❌ DENIED       │
└──────────────────┘
```

## ⚡ Conflict Detection Flow

```
┌────────────────────────────────────────────────────┐
│  User selects:                                     │
│  - Room: Study Room A                              │
│  - Date: 2025-10-24                                │
│  - Start: 14:00 (2:00 PM)                          │
│  - End: 16:00 (4:00 PM)                            │
└────────────────┬───────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────┐
│  Query Firestore:                                  │
│  Get all confirmed reservations for:               │
│  - roomId = "study-room-a"                         │
│  - date = "2025-10-24"                             │
│  - status = "confirmed"                            │
└────────────────┬───────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────┐
│  Existing Reservations Found:                      │
│                                                    │
│  1. 10:00 - 11:30                                 │
│  2. 12:00 - 13:00                                 │
│  3. 15:00 - 17:00  ← POTENTIAL CONFLICT!          │
└────────────────┬───────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────┐
│  Check each reservation for overlap:               │
│                                                    │
│  Reservation 1: 10:00 - 11:30                     │
│    User: 14:00 < 11:30? NO                        │
│    Status: ✅ No conflict                          │
│                                                    │
│  Reservation 2: 12:00 - 13:00                     │
│    User: 14:00 < 13:00? NO                        │
│    Status: ✅ No conflict                          │
│                                                    │
│  Reservation 3: 15:00 - 17:00                     │
│    User start (14:00) < Existing end (17:00)? YES │
│    Existing start (15:00) < User end (16:00)? YES │
│    Status: ❌ CONFLICT DETECTED!                   │
└────────────────┬───────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────┐
│              ❌ ERROR MESSAGE                       │
│                                                    │
│  "This time slot is already booked.               │
│   Please choose another time."                    │
│                                                    │
│              [OK]                                  │
└────────────────────────────────────────────────────┘
```

## 🔢 Time Overlap Algorithm

```
Visual representation of overlap detection:

Case 1: NO OVERLAP
Existing:  |-----------|
New:                      |-----------|
           10:00   11:00  12:00   13:00

Case 2: OVERLAP (New starts before existing ends)
Existing:  |-----------|
New:            |-----------|
           10:00   11:00   12:00   13:00

Case 3: OVERLAP (Existing starts before new ends)
Existing:       |-----------|
New:       |-----------|
           10:00   11:00   12:00

Case 4: OVERLAP (New contains existing)
Existing:    |-----|
New:       |-----------|
           10:00 11:00 12:00

Case 5: OVERLAP (Existing contains new)
Existing:  |-----------|
New:          |-----|
           10:00  11:00  12:00

Formula:
overlap = (start1 < end2) AND (start2 < end1)

If TRUE → Conflict exists
If FALSE → No conflict
```

## 📊 Data Flow Example

```
1. USER ACTION: Book Study Room A
   └─→ Date: 2025-10-24
   └─→ Time: 14:00 - 16:00
   └─→ Purpose: "Team meeting"

2. CLIENT VALIDATION:
   ✅ Date is not in past
   ✅ Date is within 90 days
   ✅ Start time before end time
   ✅ Duration >= 30 minutes
   ✅ Duration <= 8 hours

3. CONFLICT CHECK:
   └─→ Query Firestore for existing bookings
   └─→ Check each for time overlap
   └─→ Result: No conflicts found

4. FETCH ADDITIONAL DATA:
   └─→ Get room details (name, location)
   └─→ Get user details (name, email)

5. CREATE RESERVATION:
   └─→ Write to Firestore:
       {
         roomId: "abc123",
         roomName: "Study Room A",
         userId: "user456",
         userEmail: "user@example.com",
         userName: "John Doe",
         date: "2025-10-24",
         startTime: "14:00",
         endTime: "16:00",
         purpose: "Team meeting",
         status: "confirmed",
         createdAt: <timestamp>,
         updatedAt: <timestamp>,
         createdBy: "user456"
       }

6. CONFIRMATION:
   └─→ Show success alert
   └─→ Close modal
   └─→ Refresh reservation list
   └─→ Display new booking in "My Reservations"
```

## 🎯 Admin Flow

```
┌─────────────────┐
│  Admin User     │
│  Logs In        │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Profile Screen                     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Admin Tools                  │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │  Database Management    │ │ │
│  │  │                         │ │ │
│  │  │  [Seed Rooms]           │ │ │
│  │  └─────────────────────────┘ │ │
│  └───────────────────────────────┘ │
└─────────────────┬───────────────────┘
                  │
                  ↓ [Clicks Seed Rooms]
┌─────────────────────────────────────┐
│  Confirmation Dialog                │
│  "This will add sample rooms        │
│   to the database. Continue?"       │
│                                     │
│      [Cancel]     [Yes]             │
└─────────────────┬───────────────────┘
                  │
                  ↓ [Confirms]
┌─────────────────────────────────────┐
│  Seeding Process:                   │
│                                     │
│  1. Check if rooms exist            │
│  2. If no rooms:                    │
│     ├─ Add Study Room A             │
│     ├─ Add Study Room B             │
│     ├─ Add Conference Room          │
│     ├─ Add Meeting Room 1           │
│     ├─ Add Study Booth              │
│     └─ Add Collaboration Space      │
│  3. If rooms exist:                 │
│     └─ Skip (prevent duplicates)    │
└─────────────────┬───────────────────┘
                  │
                  ↓
┌─────────────────────────────────────┐
│  Result Message                     │
│  "Successfully added 6 rooms        │
│   to the database"                  │
│                                     │
│            [OK]                     │
└─────────────────────────────────────┘
```

## 🎨 UI Component Hierarchy

```
ReservationsScreen
├── ScrollView
│   ├── Section: My Reservations
│   │   ├── ReservationCard (for each reservation)
│   │   │   ├── ReservationHeader
│   │   │   │   ├── Room Name & Date
│   │   │   │   └── Action Buttons (Edit/Delete)
│   │   │   └── ReservationDetails
│   │   │       ├── Time Display
│   │   │       └── Purpose
│   │   └── EmptyCard (if no reservations)
│   │
│   └── Section: Available Rooms
│       └── RoomCard (for each room)
│           ├── Room Icon
│           ├── Room Info
│           │   ├── Name
│           │   ├── Location
│           │   └── Capacity
│           └── Chevron
│
├── Modal: Booking
│   └── ModalContent
│       ├── ModalHeader
│       │   ├── Title
│       │   └── Close Button
│       └── ModalBody
│           ├── Date Input
│           ├── Booked Slots Display
│           ├── Time Slot Picker (Start)
│           ├── Time Slot Picker (End)
│           ├── Purpose Input
│           └── Submit Button
│
└── Modal: Edit
    └── ModalContent
        ├── ModalHeader
        └── ModalBody (same as Booking)
```

---

This flow diagram provides a comprehensive visual guide to how the room reservation system works from user interaction to data storage and back.

# Room Reservation Feature - Quick Start Guide

## 🚀 What Was Implemented

A complete room reservation system with the following features:

- ✅ View available rooms with details (capacity, location, amenities)
- ✅ Book rooms for specific dates and time slots
- ✅ Real-time conflict detection (prevents double booking)
- ✅ Modify and cancel reservations
- ✅ Admin tools for database seeding and management
- ✅ Comprehensive validation and error handling

## 📁 Files Created

### Core Files

1. **`types/reservation.ts`** - TypeScript types for rooms and reservations
2. **`helpers/reservationHelper.ts`** - Business logic and database operations
3. **`app/(tabs)/reservations.tsx`** - Main reservation screen UI
4. **`scripts/seedRooms.ts`** - Database seeding utilities
5. **`components/admin/RoomSeeder.tsx`** - Admin UI component for seeding

### Modified Files

1. **`app/(tabs)/index.tsx`** - Added navigation to reservations
2. **`app/(tabs)/_layout.tsx`** - Registered reservations route
3. **`app/(tabs)/profile.tsx`** - Added admin seeding tool

## 🎯 How to Use

### For Regular Users

1. **Access the Feature**

   - Open the app and tap "Room Reservation" on the home screen

2. **Book a Room**

   - Browse available rooms
   - Tap a room to open the booking modal
   - Select date, start time, and end time
   - Add optional purpose/description
   - Tap "Book Room"

3. **Manage Reservations**
   - View "My Reservations" at the top of the screen
   - Tap pencil icon to edit
   - Tap trash icon to cancel

### For Admins

1. **Seed the Database**

   - Go to Profile screen
   - Scroll down to "Admin Tools" section
   - Tap "Seed Rooms" to add sample rooms
   - This only needs to be done once

2. **Manage All Reservations**
   - Can edit/cancel any user's reservation
   - Same interface as regular users, with expanded permissions

## ⚙️ Setup Required

### Step 1: Firebase Firestore Collections

The app expects two collections in Firestore:

- `Rooms` - Contains room information
- `Reservations` - Contains booking data

### Step 2: Populate Rooms Collection

Choose one method:

**Method A: Use the Built-in Seeder (Recommended)**

1. Log in as an admin user
2. Go to Profile screen
3. Tap "Seed Rooms" under Admin Tools
4. Done! 6 sample rooms will be added

**Method B: Manual via Firebase Console**

1. Open Firebase Console → Firestore
2. Create "Rooms" collection
3. Add documents with this structure:
   ```javascript
   {
     name: "Study Room A",
     capacity: 4,
     location: "Library - 1st Floor",
     description: "Quiet study room",
     amenities: ["Whiteboard", "WiFi", "Power Outlets"],
     isActive: true,
     createdAt: <timestamp>,
     updatedAt: <timestamp>
   }
   ```

### Step 3: Firebase Security Rules (Recommended)

Add these rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if user is admin
    function isAdmin() {
      return get(/databases/$(database)/documents/Users/$(request.auth.uid)).data.role in ['Admin', 'Super Admin'];
    }

    // Rooms collection
    match /Rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }

    // Reservations collection
    match /Reservations/{reservationId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null &&
        (resource.data.userId == request.auth.uid || isAdmin());
    }
  }
}
```

## 🎨 Features in Detail

### Conflict Detection

- Automatically checks for overlapping bookings
- Shows existing bookings in red when selecting time
- Disables conflicting time slots in the UI
- Validates time ranges (30 min minimum, 8 hours maximum)

### Validation Rules

- ✅ Cannot book in the past
- ✅ Cannot book more than 90 days ahead
- ✅ Start time must be before end time
- ✅ Minimum reservation: 30 minutes
- ✅ Maximum reservation: 8 hours
- ✅ No overlapping bookings

### Time Slots

- Available from 8:00 AM to 10:00 PM
- 30-minute intervals
- Shows as 12-hour format (e.g., "2:30 PM")
- Stores as 24-hour format (e.g., "14:30")

### Permissions

- **Regular Users**: Manage only their own reservations
- **Admins**: Manage all reservations
- Permission checks at both UI and database level

## 🧪 Testing Checklist

- [ ] Admin can seed rooms successfully
- [ ] Users can view all available rooms
- [ ] Users can book a room for a future date
- [ ] Booking appears in "My Reservations"
- [ ] Cannot book overlapping times (conflict detection works)
- [ ] Cannot book past dates
- [ ] Can edit own reservation
- [ ] Can cancel own reservation
- [ ] Admin can manage any reservation
- [ ] Regular user cannot edit others' reservations

## 📱 Navigation

The feature is accessible from:

1. **Home Screen** → "Room Reservation" card in Operations section
2. **Direct URL**: `/(tabs)/reservations`

## 🎓 Sample Rooms Included

When you seed the database, these rooms are created:

1. **Study Room A** - 4 people, Library 1st Floor
2. **Study Room B** - 6 people, Library 2nd Floor
3. **Conference Room** - 12 people, Main Building 3rd Floor
4. **Meeting Room 1** - 8 people, Student Center
5. **Study Booth** - 2 people, Library Ground Floor
6. **Collaboration Space** - 10 people, Innovation Hub

## 🔍 Troubleshooting

**Issue**: "Failed to fetch rooms"

- **Solution**: Make sure you've seeded the database with rooms

**Issue**: Can't see any rooms

- **Solution**: Check that rooms have `isActive: true`

**Issue**: "This time slot is already booked"

- **Solution**: Choose a different time or check existing bookings for that date

**Issue**: Admin tools not showing

- **Solution**: Ensure your user role is set to "Admin" or "Super Admin" in Firestore

**Issue**: Permission denied

- **Solution**: Make sure Firebase security rules are configured correctly

## 📚 Additional Documentation

For comprehensive documentation, see `ROOM_RESERVATION_FEATURE.md`

## 🎉 You're Ready!

The room reservation feature is now fully integrated and ready to use. Users can start booking rooms immediately after you seed the database.

**Next Steps:**

1. Log in as admin
2. Seed the database (one-time setup)
3. Start booking rooms!

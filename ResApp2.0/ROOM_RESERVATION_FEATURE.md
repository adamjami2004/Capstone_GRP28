# Room Reservation Feature

## Overview

The room reservation feature allows users to view available rooms, book them for specific dates and times, and manage their reservations. The system includes automatic conflict detection to prevent double bookings and provides a comprehensive management interface.

## Features

### User Capabilities

- ✅ View all available rooms with details (capacity, location, amenities)
- ✅ View current reservations
- ✅ Book rooms for specific dates and time slots
- ✅ Modify own reservations (date, time, purpose)
- ✅ Cancel own reservations
- ✅ Real-time conflict detection
- ✅ Visual feedback on booked time slots

### Admin Capabilities

- ✅ All user capabilities
- ✅ Manage all reservations (modify/cancel any reservation)
- ✅ Seed database with sample rooms
- ✅ View all system reservations

### System Validations

- ✅ Prevent double booking (automatic conflict checking)
- ✅ Minimum reservation duration: 30 minutes
- ✅ Maximum reservation duration: 8 hours
- ✅ Cannot book rooms in the past
- ✅ Cannot book more than 90 days in advance
- ✅ Time slot validation with existing reservations

## Architecture

### Files Created

#### Types

- `types/reservation.ts` - TypeScript interfaces for Room and Reservation entities

#### Helpers

- `helpers/reservationHelper.ts` - Core business logic for room reservations
  - Room fetching
  - Conflict checking
  - CRUD operations for reservations
  - Time validation
  - Permission checking

#### Screens

- `app/(tabs)/reservations.tsx` - Main reservation interface
  - Room listing
  - User reservations display
  - Booking modal
  - Edit modal
  - Real-time availability checking

#### Admin Tools

- `scripts/seedRooms.ts` - Database seeding script
- `components/admin/RoomSeeder.tsx` - Admin UI component for seeding

## Database Structure

### Rooms Collection

```typescript
{
  id: string;                    // Auto-generated document ID
  name: string;                  // Room name
  capacity: number;              // Maximum occupancy
  location: string;              // Physical location
  description?: string;          // Optional description
  amenities: string[];           // List of available amenities
  isActive: boolean;             // Whether room is available for booking
  createdAt: Timestamp;          // Creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
}
```

### Reservations Collection

```typescript
{
  id: string;                    // Auto-generated document ID
  roomId: string;                // Reference to room
  roomName: string;              // Cached room name for display
  userId: string;                // User who made the reservation
  userEmail: string;             // User's email
  userName: string;              // User's full name
  date: string;                  // Format: YYYY-MM-DD
  startTime: string;             // Format: HH:MM (24-hour)
  endTime: string;               // Format: HH:MM (24-hour)
  purpose?: string;              // Optional purpose/description
  status: 'confirmed' | 'cancelled';
  createdAt: Timestamp;          // Creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
  createdBy: string;             // User ID who created
  cancelledAt?: Timestamp;       // Cancellation timestamp (if cancelled)
  cancelledBy?: string;          // User ID who cancelled (if cancelled)
}
```

## Setup Instructions

### 1. Database Seeding

To populate the database with sample rooms, you have several options:

#### Option A: Using the Admin Component

1. Import the RoomSeeder component in your admin panel:

```typescript
import { RoomSeeder } from "@/components/admin/RoomSeeder";
```

2. Add it to your admin interface:

```typescript
<RoomSeeder />
```

3. Click the "Seed Rooms" button to add sample rooms

#### Option B: Programmatic Seeding

```typescript
import { seedRooms } from "@/scripts/seedRooms";

const result = await seedRooms();
if (result.success) {
  console.log(`Added ${result.count} rooms`);
}
```

#### Option C: Firebase Console

1. Go to Firebase Console → Firestore Database
2. Create a collection named "Rooms"
3. Add documents with the structure defined in the Database Structure section

### 2. Firebase Security Rules

Add these rules to your Firestore security rules:

```javascript
// Rooms collection - Read access for authenticated users, write for admins
match /Rooms/{roomId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null &&
    get(/databases/$(database)/documents/Users/$(request.auth.uid)).data.role in ['Admin', 'Super Admin'];
}

// Reservations collection
match /Reservations/{reservationId} {
  // Anyone authenticated can read their own reservations
  allow read: if request.auth != null &&
    (resource.data.userId == request.auth.uid ||
     get(/databases/$(database)/documents/Users/$(request.auth.uid)).data.role in ['Admin', 'Super Admin']);

  // Users can create their own reservations
  allow create: if request.auth != null &&
    request.resource.data.userId == request.auth.uid;

  // Users can update/delete their own reservations, admins can update/delete any
  allow update, delete: if request.auth != null &&
    (resource.data.userId == request.auth.uid ||
     get(/databases/$(database)/documents/Users/$(request.auth.uid)).data.role in ['Admin', 'Super Admin']);
}
```

### 3. Navigation Setup

The feature is already integrated with the home screen. Users can access it by:

- Tapping "Room Reservation" in the Operations section on the home page
- Direct navigation to `/(tabs)/reservations`

## User Guide

### Booking a Room

1. Navigate to the Room Reservation feature from the home page
2. Browse available rooms in the "Available Rooms" section
3. Tap on a room to open the booking modal
4. Select:
   - Date (YYYY-MM-DD format)
   - Start time (from available time slots)
   - End time (from available time slots, showing only conflict-free options)
   - Purpose (optional)
5. Review existing bookings shown in red to avoid conflicts
6. Tap "Book Room" to confirm

### Managing Reservations

#### Edit a Reservation

1. Find your reservation in "My Reservations"
2. Tap the pencil icon
3. Modify date, time, or purpose
4. Tap "Update Reservation"

#### Cancel a Reservation

1. Find your reservation in "My Reservations"
2. Tap the trash icon
3. Confirm cancellation

### Admin Features

Admins have additional capabilities:

- Can modify or cancel any reservation (not just their own)
- Can access the room seeding tool to populate the database
- See the same interface as regular users but with expanded permissions

## Technical Details

### Conflict Detection Algorithm

The system prevents double booking through a multi-step validation:

1. **Time Range Validation**: Ensures start time < end time, minimum 30 minutes, maximum 8 hours
2. **Date Validation**: Prevents past bookings and bookings beyond 90 days
3. **Conflict Check**: Queries all confirmed reservations for the same room and date
4. **Overlap Detection**: Checks if time ranges overlap using the formula:
   ```
   overlap = (startTime1 < endTime2) && (startTime2 < endTime1)
   ```
5. **Real-time Feedback**: Disabled time slots in the UI when conflicts exist

### Permission System

The feature integrates with the existing user role system:

- **Regular Users**: Can manage only their own reservations
- **Admin/Super Admin**: Can manage all reservations

Permission checks occur at multiple levels:

1. Client-side UI (hiding/showing admin features)
2. Helper function validation
3. Firebase security rules (recommended for production)

### Time Format

- **Storage**: 24-hour format (HH:MM) e.g., "14:30"
- **Display**: 12-hour format with AM/PM e.g., "2:30 PM"
- **Available Slots**: 8:00 AM to 10:00 PM in 30-minute intervals

### Notifications

The system uses React Native's Alert API for:

- Success confirmations
- Error messages
- Conflict warnings
- Cancellation confirmations

Future enhancement: Integrate with a notification system for:

- Email confirmations
- Reminder notifications
- Cancellation notices
- Admin notifications for new bookings

## Testing Recommendations

### Test Cases

1. **Basic Booking**

   - Book a room for a future date
   - Verify reservation appears in "My Reservations"

2. **Conflict Prevention**

   - Create a reservation
   - Try to book the same room at an overlapping time
   - Verify conflict is detected and booking prevented

3. **Time Validation**

   - Try booking with end time before start time (should fail)
   - Try booking for less than 30 minutes (should fail)
   - Try booking for more than 8 hours (should fail)

4. **Date Validation**

   - Try booking a past date (should fail)
   - Try booking more than 90 days ahead (should fail)

5. **Edit Reservation**

   - Modify an existing reservation
   - Verify changes are saved
   - Verify conflict checking works during updates

6. **Cancel Reservation**

   - Cancel a reservation
   - Verify status changes to "cancelled"
   - Verify reservation no longer appears in active list

7. **Permission Checks**

   - As regular user, try to edit another user's reservation (should fail)
   - As admin, modify any reservation (should succeed)

8. **UI/UX**
   - Verify time slots disable when conflicts exist
   - Verify loading states during API calls
   - Verify error messages are user-friendly

## Future Enhancements

### Potential Features

1. **Recurring Reservations**: Allow users to book recurring time slots
2. **Waiting List**: Queue system when rooms are fully booked
3. **Email Notifications**: Send confirmation and reminder emails
4. **Push Notifications**: Mobile notifications for upcoming reservations
5. **Calendar Integration**: Export reservations to Google Calendar/iCal
6. **Room Photos**: Add images to room listings
7. **Check-in System**: QR code or NFC-based check-in
8. **Usage Analytics**: Track room utilization and popular time slots
9. **Advanced Search**: Filter rooms by amenities, capacity, location
10. **Reservation Templates**: Save frequently used booking configurations
11. **Multi-room Booking**: Book multiple rooms simultaneously
12. **Approval Workflow**: Require admin approval for certain rooms/times
13. **Cancellation Policies**: Enforce minimum notice periods for cancellations
14. **Room Status Dashboard**: Real-time view of all room availability

### Performance Optimizations

1. Cache frequently accessed room data
2. Implement pagination for large reservation lists
3. Add indexing to Firestore queries
4. Optimize real-time availability checking

## Troubleshooting

### Common Issues

**Issue**: "Failed to fetch rooms"

- **Solution**: Ensure Firestore is properly initialized and rooms collection exists

**Issue**: Conflict detection not working

- **Solution**: Verify date and time formats match exactly (YYYY-MM-DD and HH:MM)

**Issue**: Users can't see rooms

- **Solution**: Check that rooms have `isActive: true` and user is authenticated

**Issue**: Permission denied errors

- **Solution**: Verify Firebase security rules are correctly configured

**Issue**: Times showing as unavailable

- **Solution**: Check for overlapping reservations in the selected date

## Support

For issues or questions:

1. Check the console logs for detailed error messages
2. Verify Firebase connection and authentication
3. Ensure all required collections exist in Firestore
4. Review security rules configuration

## License

This feature is part of the ResApp2.0 project.

# Room Reservation Troubleshooting Guide

## Issue: "No Available Rooms" Shows in App

If you've added rooms to Firebase but can't see them in the app, follow these steps:

## Step 1: Use the Debug Tool

1. **Open your app**
2. **Go to Profile screen**
3. **Scroll down to "🔧 Debug Tools"**
4. **Check what it shows**

The debugger will tell you:

- How many rooms are in the database
- What fields each room has
- If `isActive` is set correctly
- The exact issue with each room

## Step 2: Common Fixes

### Problem 1: `isActive` is Wrong Type

**What the debugger shows:**

```
isActive: "true" (Type: string)
⚠️ Won't show (isActive is not true)
```

**Solution:**

1. Go to Firebase Console → Firestore
2. Open the Rooms collection
3. Click on each room document
4. Find the `isActive` field
5. **Delete it**
6. **Add it again** as type: **boolean** with value: **true** (not "true")

### Problem 2: Field Name is Wrong Case

**What the debugger shows:**

```
Has isActive field: ❌ No
```

**Solution:**
The field might be named `IsActive` or `isactive`. You need exactly `isActive` (lowercase 'i', uppercase 'A').

1. Go to Firebase Console → Firestore
2. Open each room document
3. Delete the wrongly named field
4. Add new field: `isActive` (type: boolean, value: true)

### Problem 3: Collection Name is Wrong

**What the debugger shows:**

```
Total Rooms Found: 0
❌ No documents found in Rooms collection
```

**Solution:**
The collection must be named exactly `Rooms` (capital R).

1. Check your collection name in Firebase Console
2. If it's `rooms` or `ROOMS`, you need to rename it or create a new one
3. Firebase doesn't have a rename feature, so you'll need to:
   - Create new collection: `Rooms`
   - Copy all documents from old collection
   - Delete old collection

### Problem 4: Missing Required Fields

**What the debugger shows:**

```
Name: ❌ MISSING
Capacity: ❌ MISSING
```

**Solution:**
Each room MUST have these fields:

```
Field Name    | Type      | Required | Example Value
--------------|-----------|----------|----------------------------------
name          | string    | ✅ YES   | "Study Room A"
capacity      | number    | ✅ YES   | 4
location      | string    | ✅ YES   | "Library - 1st Floor"
description   | string    | ⚪ NO    | "Quiet study room"
amenities     | array     | ✅ YES   | ["WiFi", "Whiteboard"]
isActive      | boolean   | ✅ YES   | true
createdAt     | timestamp | ✅ YES   | (current time)
updatedAt     | timestamp | ✅ YES   | (current time)
```

## Step 3: Verify Your Firestore Structure

Your Firestore should look like this:

```
Firestore Database
└── Rooms (collection)
    ├── [auto-generated-id-1] (document)
    │   ├── name: "Study Room A"
    │   ├── capacity: 4
    │   ├── location: "Library - 1st Floor"
    │   ├── description: "Quiet study room..."
    │   ├── amenities: ["Whiteboard", "Projector", "WiFi"]
    │   ├── isActive: true
    │   ├── createdAt: October 22, 2025 at 12:00:00 PM
    │   └── updatedAt: October 22, 2025 at 12:00:00 PM
    │
    ├── [auto-generated-id-2] (document)
    │   └── (same structure)
    └── ...
```

## Step 4: Check Firebase Security Rules

If the debugger shows rooms but they still don't appear in the reservations screen:

1. Go to Firebase Console → Firestore Database → Rules
2. Make sure you have read access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /Rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if false; // Adjust based on your needs
    }
  }
}
```

## Step 5: Check Console Logs

1. Open your browser/app console
2. Look for errors like:
   - `Error fetching rooms`
   - `Permission denied`
   - `Failed to fetch rooms`

These will give you more clues about what's wrong.

## Quick Checklist ✅

Before asking for help, verify:

- [ ] Collection is named exactly `Rooms` (capital R)
- [ ] Each room document has all required fields
- [ ] `isActive` is **boolean** `true` (not string "true")
- [ ] Field names match exactly (case-sensitive)
- [ ] You're logged into the app
- [ ] You checked the debug tool output
- [ ] You looked at console logs for errors

## Example: Correct Room Document

Here's what a perfect room document looks like in Firebase Console:

```
Document ID: (auto-generated, e.g., "abc123xyz")

Fields:
┌─────────────┬───────────┬──────────────────────────────────────────┐
│ Field       │ Type      │ Value                                    │
├─────────────┼───────────┼──────────────────────────────────────────┤
│ name        │ string    │ Study Room A                             │
│ capacity    │ number    │ 4                                        │
│ location    │ string    │ Library - 1st Floor                      │
│ description │ string    │ Quiet study room with whiteboard         │
│ amenities   │ array     │ [0]: "Whiteboard"                        │
│             │           │ [1]: "Projector"                         │
│             │           │ [2]: "WiFi"                              │
│             │           │ [3]: "Power Outlets"                     │
│ isActive    │ boolean   │ true                                     │
│ createdAt   │ timestamp │ October 22, 2025 at 12:00:00 PM UTC-5   │
│ updatedAt   │ timestamp │ October 22, 2025 at 12:00:00 PM UTC-5   │
└─────────────┴───────────┴──────────────────────────────────────────┘
```

## Still Not Working?

If the debug tool shows everything is correct but rooms still don't appear:

1. **Try logging out and back in**
2. **Clear app cache**
3. **Restart the app**
4. **Check if you're connected to the internet**
5. **Verify Firebase project is the correct one**

## Remove Debug Tool Later

Once you've fixed the issue, you can remove the debug section from your profile:

1. Open `app/(tabs)/profile.tsx`
2. Remove the debug section (lines with `RoomDebugger`)
3. Remove the import: `import { RoomDebugger } from "@/components/debug/RoomDebugger";`

## Need More Help?

Share these details:

- Screenshot of debug tool output
- Screenshot of one room document in Firebase Console
- Any error messages from console logs
- Your Firebase security rules for the Rooms collection

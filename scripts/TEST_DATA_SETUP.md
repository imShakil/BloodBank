# 🚀 BloodPoint Test Data Setup Guide

This guide will help you populate your Firebase database with realistic test data for development and testing.

---

## **Option 1: Automated Script (Recommended)**

### Prerequisites
- Node.js installed (v14+)
- Firebase service account key

### Step 1: Download Service Account Key

1. Go to **Firebase Console** → Your **BloodPoint** project
2. Click **⚙️ Settings** (top-left) → **Project Settings**
3. Click **Service Accounts** tab
4. Click **Generate New Private Key** button
5. Save the JSON file as: `scripts/serviceAccountKey.json`

### Step 2: Install Dependencies

```bash
cd scripts
npm install
```

### Step 3: Run the Script

```bash
npm run create-test-data
```

**What it creates:**
- ✅ 5 test users with different profiles
- ✅ 10 blood request posts
- ✅ Admin assignments
- ✅ Premium subscriptions
- ✅ Request usage tracking
- ✅ Moderation audit logs

---

## **Option 2: Manual Firebase Console Import**

If you prefer not to use Node.js, copy-paste this JSON into Firebase Realtime Database:

### Step 1: Go to Firebase Console
1. **Firebase Console** → **BloodPoint** project
2. **Build** → **Realtime Database**
3. Click **Rules** at the top, and temporarily change to:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**⚠️ IMPORTANT:** Change back to proper rules after importing!

### Step 2: Import Test Data

Copy each section below and paste into the database:

#### Users

```json
{
  "users": {
    "test_user_1": {
      "Name": "Raj Kumar",
      "Email": "raj.kumar@example.com",
      "Contact": "9876543210",
      "Address": "MG Road, Bangalore",
      "District": "1",
      "BloodGroup": "1",
      "Gender": 0,
      "BirthDate": "19900515",
      "DonorInfo": 1,
      "LastDonated": 0,
      "verificationStatus": "UNVERIFIED"
    },
    "test_user_2": {
      "Name": "Priya Sharma",
      "Email": "priya.sharma@example.com",
      "Contact": "9876543211",
      "Address": "Whitefield, Bangalore",
      "District": "1",
      "BloodGroup": "3",
      "Gender": 1,
      "BirthDate": "19950720",
      "DonorInfo": 1,
      "LastDonated": 20260101,
      "verificationStatus": "VERIFIED"
    },
    "test_user_3": {
      "Name": "Amit Patel",
      "Email": "amit.patel@example.com",
      "Contact": "9876543212",
      "Address": "Indiranagar, Bangalore",
      "District": "1",
      "BloodGroup": "2",
      "Gender": 0,
      "BirthDate": "19880303",
      "DonorInfo": 1,
      "LastDonated": 20251215,
      "verificationStatus": "VERIFIED"
    },
    "test_user_4": {
      "Name": "Hospital Blood Bank",
      "Email": "bloodbank@hospital.com",
      "Contact": "9876543213",
      "Address": "St. Mary Hospital, Bangalore",
      "District": "1",
      "BloodGroup": "0",
      "Gender": 0,
      "BirthDate": "20000101",
      "DonorInfo": 0,
      "verificationStatus": "VERIFIED"
    },
    "test_user_5": {
      "Name": "Neha Singh",
      "Email": "neha.singh@example.com",
      "Contact": "9876543214",
      "Address": "JP Nagar, Bangalore",
      "District": "1",
      "BloodGroup": "4",
      "Gender": 1,
      "BirthDate": "19920808",
      "DonorInfo": 1,
      "LastDonated": 0,
      "verificationStatus": "UNVERIFIED"
    }
  }
}
```

#### Subscriptions

```json
{
  "subscriptions": {
    "test_user_2": {
      "tier": "PREMIUM",
      "expiryAt": 1758825600000
    },
    "test_user_4": {
      "tier": "PREMIUM",
      "expiryAt": 1772476800000
    }
  }
}
```

#### Admins

```json
{
  "admins": {
    "test_user_4": {
      "uid": "test_user_4",
      "role": "moderator",
      "assignedBy": "system",
      "assignedAt": 1741305600000,
      "active": true
    }
  }
}
```

#### Request Usage

```json
{
  "requestUsage": {
    "test_user_1": {
      "2026-03": {
        "count": 3,
        "lastRequestAt": 1747017600000,
        "monthKey": "2026-03"
      }
    },
    "test_user_3": {
      "2026-03": {
        "count": 2,
        "lastRequestAt": 1747017600000,
        "monthKey": "2026-03"
      }
    },
    "test_user_5": {
      "2026-03": {
        "count": 1,
        "lastRequestAt": 1747017600000,
        "monthKey": "2026-03"
      }
    }
  }
}
```

---

## **Test User Credentials**

| Name | Email | UID | Password | Role |
|------|-------|-----|----------|------|
| Raj Kumar | raj.kumar@example.com | test_user_1 | Create account | Regular User (Free) |
| Priya Sharma | priya.sharma@example.com | test_user_2 | Create account | Regular User (Premium) |
| Amit Patel | amit.patel@example.com | test_user_3 | Create account | Regular User (Free) |
| Hospital Blood Bank | bloodbank@hospital.com | test_user_4 | Create account | **Admin** (Moderator) |
| Neha Singh | neha.singh@example.com | test_user_5 | Create account | Regular User (Free) |

---

## **What Each User Can Test**

### **test_user_1 (Raj Kumar) - Free Tier**
- ✅ Create blood requests (limited)
- ✅ See search radius 50km
- ✅ Max 7-day expiry
- ❌ Cannot access premium features
- ❌ Request limit: 5/month

### **test_user_2 (Priya Sharma) - Premium Tier**
- ✅ Unlimited blood requests
- ✅ See search radius 200km
- ✅ Max 30-day expiry
- ✅ See "Extended Features" badge
- ✅ Request limit: Unlimited

### **test_user_4 (Hospital Blood Bank) - Admin**
- ✅ All premium features
- ✅ **Admin Settings menu** appears
- ✅ Can approve/reject blood requests
- ✅ Can flag inappropriate posts
- ✅ Can promote other users to admin
- ✅ Can see audit logs

---

## **Testing Scenarios**

### **Scenario 1: Test Free Tier Limits**
1. Log in as `test_user_1`
2. Try to create 6th blood request → Should get "Limit Reached" dialog
3. Try to select 30-day expiry → Should get "Premium Required" dialog

### **Scenario 2: Test Premium Features**
1. Log in as `test_user_2`
2. Create blood request with 30-day expiry → ✅ Should work
3. See search results within 200km → ✅ Premium verified

### **Scenario 3: Test Admin Moderation**
1. Log in as `test_user_4`
2. Open **Admin Settings** menu
3. Click on pending posts → Approve/reject/flag
4. Updated status visible in audit logs

### **Scenario 4: Test Request Usage Tracking**
1. Log in as `test_user_1`
2. View their profile → Should show "3 requests this month"
3. Create new request → Counter increments to 4

---

## **Troubleshooting**

### **Script Error: "serviceAccountKey.json not found"**
- Download the key from Firebase Console (see Step 1 above)
- Save it exactly as: `scripts/serviceAccountKey.json`

### **"Permission denied" errors**
- Make sure you're using a **Service Account key** (not a Web API key)
- Firebase rules temporarily set to admin mode

### **Posts not appearing in app**
- Make sure moderation status is `APPROVED`
- Check `isVisible: true`
- Clear app cache: Settings → Apps → BloodPoint → Clear Cache

### **Admin menu not showing**
- User UID must exist in `/admins/{uid}` path
- Log out and back in for changes to take effect

---

## **After Testing: Restore Security Rules**

⚠️ **IMPORTANT:** Replace the temporary open rules with secure rules:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "users": {
      ".read": "auth != null",
      ".write": "auth != null && auth.uid === $uid",
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "posts": {
      ".read": "auth != null",
      ".write": "auth != null && newData.child('authorUid').val() === auth.uid"
    }
  }
}
```

---

## **Need Help?**

If you encounter issues:
1. Check Firebase Console **Logs** tab for errors
2. Verify all UIDs match between users/posts/admins
3. Confirm timestamps are in milliseconds (not seconds)
4. Make sure email addresses are unique in Firebase Auth

Happy testing! 🎉

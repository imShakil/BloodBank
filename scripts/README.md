# 🧪 BloodPoint Test Data Suite

Complete test data generation toolkit for BloodPoint app testing and development.

---

## **Quick Start (Choose One)**

### **Option A: Automated Node.js Script (Easiest)**
```bash
cd scripts
npm install
npm run create-test-data
```
✅ **Best for:** Full automation, all features included  
⏱️ **Time:** 2 minutes

---

### **Option B: Firebase CLI Script (No Node.js)**
```bash
chmod +x scripts/import-test-data.sh
bash scripts/import-test-data.sh
```
✅ **Best for:** Firebase CLI already installed  
⏱️ **Time:** 3 minutes

---

### **Option C: Manual Firebase Console (No Tools)**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to **Realtime Database**
3. Copy-paste JSON from [TEST_DATA_SETUP.md](./TEST_DATA_SETUP.md)

✅ **Best for:** Learning, single sections, no setup  
⏱️ **Time:** 5 minutes

---

## **📁 Files in This Directory**

| File | Purpose | How to Use |
|------|---------|-----------|
| `create-test-data.js` | Node.js automated generator | `npm run create-test-data` |
| `import-test-data.sh` | Firebase CLI importer | `bash import-test-data.sh` |
| `package.json` | Node.js dependencies | `npm install` |
| `TEST_DATA_SETUP.md` | **Complete setup guide** | Read first! |
| `QUICK_REFERENCE.md` | Cheat sheet for test data | Quick lookup |
| `README.md` | This file | Overview |

---

## **🧑‍💻 What Gets Created?**

### **Users (5 test accounts)**
```
test_user_1  → Raj Kumar (Free tier, 3 posts)
test_user_2  → Priya Sharma (PREMIUM tier)
test_user_3  → Amit Patel (Free tier, 2 posts)
test_user_4  → Hospital Blood Bank (ADMIN role)
test_user_5  → Neha Singh (Free tier, 1 post)
```

### **Blood Request Posts (5 posts)**
- Various urgency levels (Critical → Regular)
- Different approval statuses (Approved, Pending, Flagged)
- Different blood types (O+, A+, B+, AB+)
- Real locations in Bangalore

### **Subscriptions**
- test_user_2: PREMIUM (90 days)
- test_user_4: PREMIUM (1 year)
- Others: FREE tier

### **Admin Setup**
- test_user_4 assigned as moderator
- Can approve/reject posts
- Can assign other admins

### **Request Usage Tracking**
- Monthly counters for free tier
- Tracks usage for March 2026
- test_user_1: 3/5 posts used this month

---

## **🎯 Test Scenarios**

### **1️⃣ Free Tier Limits**
```
Login as: test_user_1
✅ Create post #4 (3 + 1 = 4, within 5 limit)
✅ Create post #5 (4 + 1 = 5, exactly at limit)
❌ Create post #6 (5 + 1 = 6, exceeds limit)
   → "Monthly Limit Reached" dialog appears
   → Show "Upgrade" button
```

### **2️⃣ Premium Features**
```
Login as: test_user_2 (PREMIUM)
✅ Select 30-day expiry (premium feature)
✅ Unlimited requests (no counter shown)
✅ See "Premium" badge in profile
```

### **3️⃣ Admin Moderation**
```
Login as: test_user_4 (Admin)
✅ Menu → "Admin Settings" appears
✅ Click "Admin Settings"
✅ See list of all admins
✅ Add new admin by UID
✅ Remove admin with confirmation
```

### **4️⃣ Moderation Queue**
```
Login as: test_user_4 (Admin)
✅ Menu → "Moderate Requests"
✅ See pending posts
✅ Approve/Reject/Flag actions
✅ See moderation audit log
```

---

## **🚀 Full Setup Steps**

### **Step 1: Prepare Firebase**
```bash
# Download service account key (if using Node.js script)
1. Firebase Console → Project Settings → Service Accounts
2. Generate New Private Key
3. Save to: scripts/serviceAccountKey.json
```

### **Step 2: Run Script**
```bash
# Option A: Node.js
cd BloodPoint/scripts
npm install
npm run create-test-data

# Option B: Firebase CLI
bash import-test-data.sh

# Option C: Manual (no script needed)
# Just copy-paste JSON from TEST_DATA_SETUP.md
```

### **Step 3: Verify in Firebase Console**
- Go to Realtime Database
- Expand `/users` → Should see 5 test users
- Expand `/posts` → Should see blood request posts
- Expand `/admins` → Should see test_user_4 as moderator
- Expand `/subscriptions` → Should see 2 premium users

### **Step 4: Test in App**
```bash
1. Build APK: cd android && ./gradlew assembleDebug
2. Install on device/emulator
3. Login as test_user_1@example.com
4. Try creating blood requests
5. Login as test_user_4 to test admin features
```

---

## **🔍 Verify Installation**

### **Firebase Console Checklist**
- [ ] 5 users created in `/users`
- [ ] 5 posts created in `/posts` (with unique postId)
- [ ] 2 premium subscriptions visible in `/subscriptions`
- [ ] test_user_4 visible in `/admins`
- [ ] Monthly usage counters in `/requestUsage`

### **App Checklist**
- [ ] Login as test_user_1 → See home feed
- [ ] Create post → Usage counter increments
- [ ] Login as test_user_2 → See "Premium" features
- [ ] Login as test_user_4 → "Admin Settings" menu appears
- [ ] Click Admin Settings → See list of admins

---

## **⚠️ Common Issues & Fixes**

### **Script won't run: "serviceAccountKey.json not found"**
```
✅ Solution:
1. Firebase Console → Your project
2. Settings → Service Accounts tab
3. Click "Generate New Private Key"
4. Save to: BloodPoint/scripts/serviceAccountKey.json
```

### **Firebase CLI says "Not authenticated"**
```
✅ Solution:
firebase logout
firebase login
firebase use --add  (select your project)
```

### **Data doesn't appear in app**
```
✅ Solution:
1. Clear app cache: Settings → Apps → BloodPoint → Clear Cache
2. Verify Firebase rules allow reads: .read = true (temporarily)
3. Restart app
4. Check timestamps are in milliseconds (not seconds)
```

### **Admin menu doesn't show up**
```
✅ Solution:
1. Verify test_user_4 UID is in /admins path
2. Log out and back in (changes need to refresh)
3. Check admin verification in Dashboard.java runs successfully
```

---

## **📊 Test Data Overview**

```
Dataset:      5 users
              5 blood posts
              2 premium subs
              1 admin
              3 usage counters
              ~50 data fields total

Size:         ~2KB
Import time:  <1 second
Validity:     All data references valid (UIDs match)
```

---

## **🧹 Clean Up / Reset**

### **Delete All Test Data**
```bash
firebase database:delete /users
firebase database:delete /posts
firebase database:delete /subscriptions
firebase database:delete /requestUsage
firebase database:delete /admins
firebase database:delete /adminAudit
```

### **Reset One User's Usage**
```bash
firebase database:delete /requestUsage/test_user_1/2026-03
```

### **Backup Before Deleting**
```bash
firebase database:get / > backup.json
firebase database:get /users > users-backup.json
```

---

## **📖 Documentation Files**

- **[TEST_DATA_SETUP.md](./TEST_DATA_SETUP.md)** - Complete step-by-step guide
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick lookup table
- **create-test-data.js** - Source code for Node.js generator
- **import-test-data.sh** - Source code for Firebase CLI importer

---

## **🎓 Learning Path**

1. **Read:** [TEST_DATA_SETUP.md](./TEST_DATA_SETUP.md) (2 min)
2. **Choose:** Option A, B, or C (1 min)
3. **Run:** Script or manual import (2 min)
4. **Verify:** Check Firebase Console (1 min)
5. **Test:** Login and test features (5 min)
6. **Reference:** Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) while testing

---

## **🚀 Next Steps**

After test data is loaded:

1. ✅ Build and run the app
2. ✅ Test free tier limits (5 posts/month)
3. ✅ Test premium features (unlimited posts)
4. ✅ Test admin moderation
5. ✅ Check Firebase audit logs
6. ✅ Plan real feature rollout

---

## **❓ Questions?**

Check these in order:
1. **Script errors?** → See "Common Issues & Fixes" above
2. **Setup questions?** → See [TEST_DATA_SETUP.md](./TEST_DATA_SETUP.md)
3. **Test data details?** → See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
4. **Source code?** → Check create-test-data.js or import-test-data.sh

---

**Last Updated:** March 6, 2026  
**Version:** 1.0  
**Status:** Production Ready ✅

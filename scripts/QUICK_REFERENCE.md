# 🧪 BloodPoint Test Data - Quick Reference

## 📋 Test User Accounts

```
┌─────────────┬──────────────────────┬──────────────┬─────┐
│ Name        │ Email                │ UID          │ Role│
├─────────────┼──────────────────────┼──────────────┼─────┤
│ Raj Kumar   │ raj.kumar@example... │ test_user_1  │ User│
│ Priya Sharma│ priya.sharma@exam... │ test_user_2  │ User│
│ Amit Patel  │ amit.patel@example.. │ test_user_3  │ User│
│ Hospital    │ bloodbank@hospital.. │ test_user_4  │ 👑  │
│ Neha Singh  │ neha.singh@example.. │ test_user_5  │ User│
└─────────────┴──────────────────────┴──────────────┴─────┘
```

## 💎 Subscription Status

| User | Tier | Expires |
|------|------|---------|
| test_user_1 | FREE | - |
| **test_user_2** | **PREMIUM** | 90 days |
| test_user_3 | FREE | - |
| **test_user_4** | **PREMIUM** | 1 year |
| test_user_5 | FREE | - |

## 👑 Admin Users

- **test_user_4** (Hospital Blood Bank)
  - Role: moderator
  - Can: Approve/reject posts, flag content, assign admins

## 🩸 Test Blood Posts

| # | Author | Blood Type | Urgency | Status | Visible |
|---|--------|-----------|---------|--------|---------|
| 1 | test_user_4 | O+ | Critical | ✅ Approved | Yes |
| 2 | test_user_1 | A+ | Urgent | ✅ Approved | Yes |
| 3 | test_user_3 | B+ | High | ✅ Approved | Yes |
| 4 | test_user_5 | O+ | Regular | ⏳ Pending | No |
| 5 | test_user_2 | AB+ | Urgent | ✅ Approved | Yes |

## 📊 Request Usage (March 2026)

| User | Count | Limit | Status |
|------|-------|-------|--------|
| test_user_1 | 3/5 | FREE | ⚠️ 2 left |
| test_user_3 | 2/5 | FREE | ⚠️ 3 left |
| test_user_5 | 1/5 | FREE | ⚠️ 4 left |
| test_user_2 | ∞ | PREMIUM | ✅ Unlimited |
| test_user_4 | ∞ | PREMIUM | ✅ Unlimited |

## 🎯 Quick Test Commands

### Test Free Tier Limit
```
1. Login as test_user_1
2. Create request #4 ✅
3. Create request #5 ✅
4. Create request #6 ❌ "Limit Reached"
```

### Test Premium Features
```
1. Login as test_user_2
2. Try 30-day expiry ✅ (allowed)
3. Search radius 200km ✅ (allowed)
4. 6th request ✅ (unlimited)
```

### Test Admin Moderation
```
1. Login as test_user_4
2. Menu → Admin Settings ✅
3. Approve pending post
4. Flag inappropriate content
5. View audit trail
```

## 🔐 Firebase Paths

```
/users/{uid}                    → User profiles
/posts/{postId}                 → Blood request posts
/subscriptions/{uid}            → Subscription tier
/requestUsage/{uid}/{monthKey}  → Monthly request count
/admins/{uid}                   → Admin assignments
/adminAudit/{auditId}           → Moderation audit logs
```

## ⏱️ Reset Monthly Counter

Counter resets automatically each month. To manually reset:
1. Go to Firebase Console → Realtime Database
2. Navigate to `/requestUsage/{uid}/2026-03`
3. Delete the node
4. Or increment month to `2026-04`

## 🚀 Next Steps

1. ✅ Run script: `npm run create-test-data`
2. ✅ Verify data in Firebase Console
3. ✅ Login as test_user_1 (free tier)
4. ✅ Test posting blood request
5. ✅ Login as test_user_4 (admin)
6. ✅ Approve/flag posts
7. ✅ Build real features based on test flow

## 💾 Backup Test Data

Before deleting:
```bash
# Export entire database
firebase database:get / > backup.json

# Export just users
firebase database:get /users > users-backup.json
```

## 🗑️ Clean Up Test Data

To delete all test data:
```bash
# Delete individual branches
firebase database:delete /users/test_user_1
firebase database:delete /posts
firebase database:delete /subscriptions
firebase database:delete /requestUsage
firebase database:delete /admins
firebase database:delete /adminAudit
```

---

**Last Updated:** March 6, 2026  
**Test Data Version:** 1.0

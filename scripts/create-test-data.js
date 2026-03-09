/**
 * Firebase Test Data Generator
 * 
 * Usage:
 * 1. Install dependencies: npm install firebase-admin
 * 2. Download service account key from Firebase Console
 * 3. Save to: scripts/serviceAccountKey.json
 * 4. Run: node scripts/create-test-data.js
 * 
 * This script creates:
 * - 5 test users with various profiles
 * - 10 blood request posts
 * - Admin assignments
 * - Premium subscriptions
 * - Request usage data
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.error('Please download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://blood-point-app.firebaseio.com"
});

const db = admin.database();

// Test data with Bangladesh location hierarchy
const TEST_USERS = [
  {
    uid: 'test_user_1',
    Name: 'Raj Kumar',
    Email: 'raj.kumar@example.com',
    Contact: '9876543210',
    Address: 'Gulshan, Dhaka',
    Division: 'Dhaka',
    DivisionId: 1,
    District: 'Dhaka',
    DistrictId: 1,
    Upazilla: 'Gulshan',
    UpazillaId: 1,
    Union: 'Ward 32',
    UnionId: 1,
    BloodGroup: 1, // O+
    Gender: 0,
    BirthDate: '19900515',
    DonorInfo: 1,
    LastDonated: 0,
    verificationStatus: 'UNVERIFIED'
  },
  {
    uid: 'test_user_2',
    Name: 'Priya Sharma',
    Email: 'priya.sharma@example.com',
    Contact: '9876543211',
    Address: 'Dhanmondi, Dhaka',
    Division: 'Dhaka',
    DivisionId: 1,
    District: 'Dhaka',
    DistrictId: 1,
    Upazilla: 'Dhanmondi',
    UpazillaId: 5,
    Union: 'Ward 27',
    UnionId: 11,
    BloodGroup: 3, // B+
    Gender: 1,
    BirthDate: '19950720',
    DonorInfo: 1,
    LastDonated: 20260101,
    verificationStatus: 'VERIFIED'
  },
  {
    uid: 'test_user_3',
    Name: 'Amit Patel',
    Email: 'amit.patel@example.com',
    Contact: '9876543212',
    Address: 'Motijheel, Dhaka',
    Division: 'Dhaka',
    DivisionId: 1,
    District: 'Dhaka',
    DistrictId: 1,
    Upazilla: 'Motijheel',
    UpazillaId: 13,
    Union: 'Ward 71',
    UnionId: 34,
    BloodGroup: 2, // A+
    Gender: 0,
    BirthDate: '19880303',
    DonorInfo: 1,
    LastDonated: 20251215,
    verificationStatus: 'VERIFIED'
  },
  {
    uid: 'test_user_4',
    Name: 'Narayanganj Medical Center',
    Email: 'bloodbank@redcrescentcenter.com',
    Contact: '9876543213',
    Address: 'Garobnasthan, Narayanganj',
    Division: 'Dhaka',
    DivisionId: 1,
    District: 'Narayanganj',
    DistrictId: 2,
    Upazilla: 'Narayanganj Sadar',
    UpazillaId: 46,
    Union: 'Khanpur',
    UnionId: 181,
    BloodGroup: 0,
    Gender: 0,
    BirthDate: '20000101',
    DonorInfo: 0,
    verificationStatus: 'VERIFIED'
  },
  {
    uid: 'test_user_5',
    Name: 'Neha Singh',
    Email: 'neha.singh@example.com',
    Contact: '9876543214',
    Address: 'Sadar, Gazipur',
    Division: 'Dhaka',
    DivisionId: 1,
    District: 'Gazipur',
    DistrictId: 15,
    Upazilla: 'Gazipur Sadar',
    UpazillaId: 76,
    Union: 'Joydebpur',
    UnionId: 301,
    BloodGroup: 4, // AB+
    Gender: 1,
    BirthDate: '19920808',
    DonorInfo: 1,
    LastDonated: 0,
    verificationStatus: 'UNVERIFIED'
  }
];

const TEST_POSTS = [
  {
    authorUid: 'test_user_4',
    Name: 'Narayanganj Medical Center',
    Contact: '9876543213',
    Location: 'Garobnasthan, Narayanganj',
    Division: 'Dhaka',
    DivisionId: 1,
    District: 'Narayanganj',
    DistrictId: 2,
    Upazilla: 'Narayanganj Sadar',
    UpazillaId: 46,
    Union: 'Khanpur',
    UnionId: 181,
    BloodGroup: 1, // O+
    Message: 'Urgent: O+ blood needed for emergency surgery - 3 units required',
    Time: Date.now(),
    urgency: 'Critical',
    expiryAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
    moderationStatus: 'APPROVED',
    isVisible: true
  },
  {
    authorUid: 'test_user_1',
    Name: 'Raj Kumar',
    Contact: '9876543210',
    Location: 'Gulshan, Dhaka',
    Division: 'Dhaka',
    DivisionId: 1,
    District: 'Dhaka',
    DistrictId: 1,
    Upazilla: 'Gulshan',
    UpazillaId: 1,
    Union: 'Ward 32',
    UnionId: 1,
    BloodGroup: 2, // A+
    Message: 'A+ blood needed for mother. Please help immediately!',
    Time: Date.now() - 86400000, // 1 day ago
    urgency: 'Urgent',
    expiryAt: Date.now() - 86400000 + (7 * 24 * 60 * 60 * 1000),
    moderationStatus: 'APPROVED',
    isVisible: true
  },
  {
    authorUid: 'test_user_3',
    Name: 'Amit Patel',
    Contact: '9876543212',
    Location: 'Motijheel, Dhaka',
    Division: 'Dhaka',
    DivisionId: 1,
    District: 'Dhaka',
    DistrictId: 1,
    Upazilla: 'Motijheel',
    UpazillaId: 13,
    Union: 'Ward 71',
    UnionId: 34,
    BloodGroup: 3, // B+
    Message: 'B+ needed for post-surgery recovery - 2 units',
    Time: Date.now() - 172800000, // 2 days ago
    urgency: 'High',
    expiryAt: Date.now() - 172800000 + (3 * 24 * 60 * 60 * 1000),
    moderationStatus: 'APPROVED',
    isVisible: true
  },
  {
    authorUid: 'test_user_5',
    Name: 'Neha Singh',
    Contact: '9876543214',
    Location: 'Joydebpur, Gazipur',
    Division: 'Dhaka',
    DivisionId: 1,
    District: 'Gazipur',
    DistrictId: 15,
    Upazilla: 'Gazipur Sadar',
    UpazillaId: 76,
    Union: 'Joydebpur',
    UnionId: 301,
    BloodGroup: 0, // O+
    Message: 'Regular blood donation needed - any type accepted',
    Time: Date.now() - 259200000, // 3 days ago
    urgency: 'Regular',
    expiryAt: Date.now() - 259200000 + (7 * 24 * 60 * 60 * 1000),
    moderationStatus: 'PENDING',
    isVisible: false
  },
  {
    authorUid: 'test_user_2',
    Name: 'Priya Sharma',
    Contact: '9876543211',
    Location: 'Dhanmondi, Dhaka',
    Division: 'Dhaka',
    DivisionId: 1,
    District: 'Dhaka',
    DistrictId: 1,
    Upazilla: 'Dhanmondi',
    UpazillaId: 5,
    Union: 'Ward 27',
    UnionId: 11,
    BloodGroup: 4, // AB+
    Message: 'AB+ blood for upcoming surgery - 2 units needed urgently',
    Time: Date.now() - 345600000, // 4 days ago
    urgency: 'Urgent',
    expiryAt: Date.now() - 345600000 + (14 * 24 * 60 * 60 * 1000),
    moderationStatus: 'APPROVED',
    isVisible: true
  }
];

// Helper functions
async function createTestUsers() {
  console.log('\n📝 Creating test users...');
  
  const updatePromises = TEST_USERS.map(user => {
    return db.ref(`users/${user.uid}`).set(user)
      .then(() => console.log(`  ✅ Created user: ${user.Name} (${user.uid})`))
      .catch(err => console.error(`  ❌ Error creating user ${user.Name}:`, err.message));
  });

  await Promise.all(updatePromises);
}

async function createTestPosts() {
  console.log('\n📮 Creating test posts...');
  
  for (const post of TEST_POSTS) {
    const postRef = db.ref('posts').push();
    const postId = postRef.key;
    const postWithId = {
      ...post,
      postId: postId
    };
    
    await postRef.set(postWithId)
      .then(() => console.log(`  ✅ Created post: "${post.Message.substring(0, 40)}..." (${postId})`))
      .catch(err => console.error(`  ❌ Error creating post:`, err.message));
  }
}

async function createAdminUsers() {
  console.log('\n👑 Creating admin assignments...');
  
  const admins = [
    {
      uid: 'test_user_4', // Hospital can moderate
      role: 'moderator'
    }
  ];

  const updatePromises = admins.map(admin => {
    return db.ref(`admins/${admin.uid}`).set({
      uid: admin.uid,
      role: admin.role,
      assignedBy: 'system',
      assignedAt: Date.now(),
      active: true
    })
      .then(() => console.log(`  ✅ Created admin: ${admin.uid} (role: ${admin.role})`))
      .catch(err => console.error(`  ❌ Error creating admin ${admin.uid}:`, err.message));
  });

  await Promise.all(updatePromises);
}

async function createPremiumSubscriptions() {
  console.log('\n💎 Creating premium subscriptions...');
  
  const subscriptions = [
    {
      uid: 'test_user_2',
      tier: 'PREMIUM',
      expiryAt: Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 days
    },
    {
      uid: 'test_user_4',
      tier: 'PREMIUM',
      expiryAt: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
    }
  ];

  const updatePromises = subscriptions.map(sub => {
    return db.ref(`subscriptions/${sub.uid}`).set({
      tier: sub.tier,
      expiryAt: sub.expiryAt
    })
      .then(() => {
        const daysRemaining = Math.ceil((sub.expiryAt - Date.now()) / (24 * 60 * 60 * 1000));
        console.log(`  ✅ Created ${sub.tier} subscription for ${sub.uid} (${daysRemaining} days remaining)`);
      })
      .catch(err => console.error(`  ❌ Error creating subscription:`, err.message));
  });

  await Promise.all(updatePromises);
}

async function createRequestUsage() {
  console.log('\n📊 Creating request usage data...');
  
  const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const usage = [
    { uid: 'test_user_1', count: 3, lastRequestAt: Date.now() },
    { uid: 'test_user_3', count: 2, lastRequestAt: Date.now() },
    { uid: 'test_user_5', count: 1, lastRequestAt: Date.now() }
  ];

  const updatePromises = usage.map(data => {
    return db.ref(`requestUsage/${data.uid}/${monthKey}`).set({
      count: data.count,
      lastRequestAt: data.lastRequestAt,
      monthKey: monthKey
    })
      .then(() => console.log(`  ✅ Created usage for ${data.uid}: ${data.count} posts this month`))
      .catch(err => console.error(`  ❌ Error creating usage:`, err.message));
  });

  await Promise.all(updatePromises);
}

async function createModuleAuditLog() {
  console.log('\n🔍 Creating moderation audit log...');
  
  const audits = [
    {
      action: 'APPROVE',
      postId: 'post_1',
      adminUid: 'test_user_4',
      details: 'Post approved - meets all requirements',
      timestamp: Date.now() - 3600000
    },
    {
      action: 'FLAG',
      postId: 'post_4',
      adminUid: 'test_user_4',
      details: 'Flagged for incomplete information',
      timestamp: Date.now() - 1800000
    }
  ];

  const updatePromises = audits.map(audit => {
    return db.ref('adminAudit').push().set(audit)
      .then(() => console.log(`  ✅ Created audit: ${audit.action} on post ${audit.postId}`))
      .catch(err => console.error(`  ❌ Error creating audit:`, err.message));
  });

  await Promise.all(updatePromises);
}

// Main execution
async function runAll() {
  console.log('🚀 Starting Firebase Test Data Generation...');
  console.log('================================================');

  try {
    await createTestUsers();
    await createTestPosts();
    await createAdminUsers();
    await createPremiumSubscriptions();
    await createRequestUsage();
    await createModuleAuditLog();

    console.log('\n================================================');
    console.log('✅ Test data creation completed successfully!');
    console.log('\n📍 Test Users Created (Bangladesh Locations):');
    TEST_USERS.forEach(u => {
      console.log(`  • ${u.Name}`);
      console.log(`    Location: ${u.District}, ${u.Division} | Union: ${u.Union}`);
      console.log(`    Contact: ${u.Contact} | BloodGroup: ${u.BloodGroup}`);
    });
    console.log('\n🎯 Testing Guide:');
    console.log('  1. Log in as any test user to view matching blood requests');
    console.log('  2. Browse posts from same district (Dhaka, Narayanganj, Gazipur)');
    console.log('  3. Test admin moderation (test_user_4 is admin)');
    console.log('  4. Check premium features (test_user_2 has premium subscription)');
    console.log('  5. Verify location hierarchy in donor search');
    console.log('\n🔐 Test Login Credentials:');
    console.log('  Raj Kumar (Donor) - raj.kumar@example.com');
    console.log('  Priya Sharma (Premium Donor) - priya.sharma@example.com');
    console.log('  Narayanganj Medical (Admin/Org) - bloodbank@redcrescentcenter.com');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    admin.app().delete();
    console.log('\n✅ Firebase connection closed');
    process.exit(0);
  }
}

runAll();

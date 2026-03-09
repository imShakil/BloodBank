#!/bin/bash

# BloodPoint Firebase Test Data Generator
# This script uses Firebase CLI to import test data
# No Node.js/npm required - just Firebase CLI
#
# Prerequisites:
# 1. Install Firebase CLI: npm install -g firebase-tools
# 2. Login: firebase login
# 3. Set project: firebase use --add
# 4. Run: bash import-test-data.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 BloodPoint Test Data Import Tool${NC}"
echo "======================================"

# Check Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found!${NC}"
    echo "Install it: npm install -g firebase-tools"
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI found${NC}"

# Check if logged in
if [ ! -d "$HOME/.firebase" ]; then
    echo -e "${YELLOW}⚠️  Not logged into Firebase${NC}"
    echo "Running: firebase login"
    firebase login
fi

# Create temp directory for JSON files
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo -e "${BLUE}📝 Creating test data JSON files...${NC}"

# Create users.json
cat > "$TEMP_DIR/users.json" << 'EOF'
{
  "test_user_1": {
    "Name": "Raj Kumar",
    "Email": "raj.kumar@example.com",
    "Contact": "9876543210",
    "Address": "Gulshan, Dhaka",
    "Division": "Dhaka",
    "DivisionId": 1,
    "District": "Dhaka",
    "DistrictId": 1,
    "Upazilla": "Gulshan",
    "UpazillaId": 1,
    "Union": "Ward 32",
    "UnionId": 1,
    "BloodGroup": 1,
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
    "Address": "Dhanmondi, Dhaka",
    "Division": "Dhaka",
    "DivisionId": 1,
    "District": "Dhaka",
    "DistrictId": 1,
    "Upazilla": "Dhanmondi",
    "UpazillaId": 5,
    "Union": "Ward 27",
    "UnionId": 11,
    "BloodGroup": 3,
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
    "Address": "Motijheel, Dhaka",
    "Division": "Dhaka",
    "DivisionId": 1,
    "District": "Dhaka",
    "DistrictId": 1,
    "Upazilla": "Motijheel",
    "UpazillaId": 13,
    "Union": "Ward 71",
    "UnionId": 34,
    "BloodGroup": 2,
    "Gender": 0,
    "BirthDate": "19880303",
    "DonorInfo": 1,
    "LastDonated": 20251215,
    "verificationStatus": "VERIFIED"
  },
  "test_user_4": {
    "Name": "Narayanganj Medical Center",
    "Email": "bloodbank@redcrescentcenter.com",
    "Contact": "9876543213",
    "Address": "Garobnasthan, Narayanganj",
    "Division": "Dhaka",
    "DivisionId": 1,
    "District": "Narayanganj",
    "DistrictId": 2,
    "Upazilla": "Narayanganj Sadar",
    "UpazillaId": 46,
    "Union": "Khanpur",
    "UnionId": 181,
    "BloodGroup": 0,
    "Gender": 0,
    "BirthDate": "20000101",
    "DonorInfo": 0,
    "verificationStatus": "VERIFIED"
  },
  "test_user_5": {
    "Name": "Neha Singh",
    "Email": "neha.singh@example.com",
    "Contact": "9876543214",
    "Address": "Sadar, Gazipur",
    "Division": "Dhaka",
    "DivisionId": 1,
    "District": "Gazipur",
    "DistrictId": 15,
    "Upazilla": "Gazipur Sadar",
    "UpazillaId": 76,
    "Union": "Joydebpur",
    "UnionId": 301,
    "BloodGroup": 4,
    "Gender": 1,
    "BirthDate": "19920808",
    "DonorInfo": 1,
    "LastDonated": 0,
    "verificationStatus": "UNVERIFIED"
  }
}
EOF

# Create subscriptions.json
cat > "$TEMP_DIR/subscriptions.json" << 'EOF'
{
  "test_user_2": {
    "tier": "PREMIUM",
    "expiryAt": 1758825600000
  },
  "test_user_4": {
    "tier": "PREMIUM",
    "expiryAt": 1772476800000
  }
}
EOF

# Create admins.json
cat > "$TEMP_DIR/admins.json" << 'EOF'
{
  "test_user_4": {
    "uid": "test_user_4",
    "role": "moderator",
    "assignedBy": "system",
    "assignedAt": 1741305600000,
    "active": true
  }
}
EOF

# Create requestUsage.json
cat > "$TEMP_DIR/requestUsage.json" << 'EOF'
{
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
EOF

echo -e "${GREEN}✅ Created temporary JSON files${NC}"

# Import data
echo -e "${BLUE}📤 Importing test data to Firebase...${NC}"

echo "  Importing users..."
firebase database:set /users "$TEMP_DIR/users.json" --force

echo "  Importing subscriptions..."
firebase database:set /subscriptions "$TEMP_DIR/subscriptions.json" --force

echo "  Importing admins..."
firebase database:set /admins "$TEMP_DIR/admins.json" --force

echo "  Importing request usage..."
firebase database:set /requestUsage "$TEMP_DIR/requestUsage.json" --force

echo -e "${GREEN}✅ All test data imported successfully!${NC}"

echo ""
echo "================================================"
echo -e "${YELLOW}� Test Users Created (Bangladesh Locations):${NC}"
echo "  • test_user_1: Raj Kumar (Dhaka - Gulshan)"
echo "  • test_user_2: Priya Sharma (Dhaka - Dhanmondi, PREMIUM)"
echo "  • test_user_3: Amit Patel (Dhaka - Motijheel)"
echo "  • test_user_4: Narayanganj Medical (Narayanganj, ADMIN)"
echo "  • test_user_5: Neha Singh (Gazipur - Joydebpur)"
echo ""
echo -e "${YELLOW}🎯 Testing Features:${NC}"
echo "  ✓ Location hierarchy (Division → District → Upazilla → Union)"
echo "  ✓ Donor search by district"
echo "  ✓ Admin moderation (test_user_4)"
echo "  ✓ Premium subscriptions (test_user_2)"
echo "  ✓ Request usage tracking"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "  1. Create Firebase Auth accounts with test emails"
echo "  2. Run create-test-data.js for posts (requires Node.js)"
echo "  3. Log in and test location cascading dropdowns"
echo ""
echo "See QUICK_REFERENCE.md for full testing guide"
echo "================================================"

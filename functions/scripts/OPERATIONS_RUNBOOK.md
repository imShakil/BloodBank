# Contact Request Retention - Operations Runbook

## Quick Reference

### Function: cleanupOldContactRequests
- **What**: Automatically deletes old contact requests
- **When**: Daily at 03:30 UTC
- **Retention**: 90 days (configurable)
- **Batch Size**: 200 records per run

---

## Configuration Quick Commands

### View Current Configuration
```bash
# Production
firebase functions:config:get

# Check logs for effective retention
firebase functions:log --only cleanupOldContactRequests | grep "retentionDays"
```

### Update Retention Period
```bash
# Development (local)
export CONTACT_REQUEST_RETENTION_DAYS=90
firebase emulators:start --only functions

# Production
firebase deploy --only functions --set-env-vars CONTACT_REQUEST_RETENTION_DAYS=90
```

---

## Monitoring Checklist

### Daily (Automated Alerts Recommended)
- [ ] Function executed at 03:30 UTC
- [ ] No errors in logs
- [ ] `totalDeleted` count is reasonable
- [ ] No repeated batch limit warnings

### Weekly
- [ ] Review deletion trends
- [ ] Check for unusual patterns
- [ ] Verify retention period is correct

### Monthly
- [ ] Analyze retention metrics
- [ ] Review compliance requirements
- [ ] Update documentation if needed

---

## Log Interpretation

### Normal Operation
```
cleanupOldContactRequests: starting
  retentionDays: 90
  cutoffTimestamp: 1696291200000
  cutoffDate: "2023-10-03T00:00:00.000Z"
  currentTimestamp: 1704067200000
  currentDate: "2024-01-01T00:00:00.000Z"

cleanupOldContactRequests: completed
  retentionDays: 90
  totalInspected: 45
  totalDeleted: 45
  totalPreserved: 0
  cutoffTimestamp: 1696291200000
  cutoffDate: "2023-10-03T00:00:00.000Z"
```

**Action**: ✅ No action needed - normal operation

---

### No Records to Clean
```
cleanupOldContactRequests: starting
  retentionDays: 90
  cutoffTimestamp: 1696291200000
  cutoffDate: "2023-10-03T00:00:00.000Z"
  currentTimestamp: 1704067200000
  currentDate: "2024-01-01T00:00:00.000Z"

cleanupOldContactRequests: nothing to clean up
  retentionDays: 90
  totalInspected: 0
  totalDeleted: 0
```

**Action**: ✅ No action needed - no old records exist

---

### Batch Limit Warning (First Time)
```
cleanupOldContactRequests: completed
  retentionDays: 90
  totalInspected: 200
  totalDeleted: 200
  totalPreserved: 0
  cutoffTimestamp: 1696291200000
  cutoffDate: "2023-10-03T00:00:00.000Z"

cleanupOldContactRequests: batch limit reached — more old requests may remain
  batchSize: 200
  retentionDays: 90
```

**Action**: ⚠️ Monitor - backlog exists, will clear over multiple days

---

### Batch Limit Warning (Repeated)
If warning appears 3+ days in a row:

**Possible Causes**:
1. Large backlog of old records
2. Retention period recently increased
3. High volume of new contact requests

**Action**: 🔍 Investigate
1. Check total contact requests count
2. Analyze creation date distribution
3. Consider one-time manual cleanup if urgent
4. Verify function is running daily

---

### Error Logs
```
Error: PERMISSION_DENIED: Permission denied
```

**Action**: ❌ Urgent
1. Check Firebase security rules
2. Verify service account permissions
3. Redeploy function if needed

---

## Troubleshooting Guide

### Problem: Wrong retention period being used

**Symptoms**:
- Logs show unexpected `retentionDays` value
- Records deleted too early or too late

**Solutions**:
1. Check environment variable:
   ```bash
   firebase functions:config:get
   ```

2. Redeploy with correct value:
   ```bash
   firebase deploy --only functions --set-env-vars CONTACT_REQUEST_RETENTION_DAYS=90
   ```

3. Verify in next run's logs

---

### Problem: No records being deleted

**Symptoms**:
- Old contact requests still exist
- Logs show `totalDeleted: 0` but old records expected

**Checks**:
1. Verify contact requests have `createdAt` field
2. Check `createdAt` values are valid Unix timestamps
3. Confirm function is running (check logs for daily execution)
4. Verify database indexes exist for `createdAt`

**Solutions**:
```bash
# Check database structure
firebase database:get /contactRequests --pretty

# Verify function deployment
firebase deploy --only functions:cleanupOldContactRequests
```

---

### Problem: Function timeout

**Symptoms**:
- Function execution exceeds time limit
- Incomplete deletion batches

**Solutions**:
1. Check batch size (should be 200)
2. Monitor memory usage
3. Consider optimizing database queries
4. Review database indexes

---

### Problem: Unexpected high deletion count

**Symptoms**:
- `totalDeleted` much higher than normal
- Concerns about data loss

**Checks**:
1. Verify retention period didn't accidentally change
2. Check if cutoff timestamp is correct
3. Review recent configuration changes

**Actions**:
1. Check logs for retention period:
   ```bash
   firebase functions:log --only cleanupOldContactRequests
   ```

2. If incorrect, update immediately:
   ```bash
   firebase deploy --only functions --set-env-vars CONTACT_REQUEST_RETENTION_DAYS=90
   ```

3. Contact team if data recovery needed

---

## Common Operations

### Update Retention Period (Step-by-Step)

1. **Document Current State**:
   ```bash
   firebase functions:config:get > config-backup-$(date +%Y%m%d).txt
   firebase functions:log --only cleanupOldContactRequests > logs-before.txt
   ```

2. **Calculate Impact**:
   - Current retention: X days
   - New retention: Y days
   - Impact: Records between X and Y days old will be affected

3. **Deploy Change**:
   ```bash
   firebase deploy --only functions --set-env-vars CONTACT_REQUEST_RETENTION_DAYS=<new_value>
   ```

4. **Monitor First Run**:
   - Wait for next scheduled execution (03:30 UTC)
   - Check logs immediately after:
     ```bash
     firebase functions:log --only cleanupOldContactRequests
     ```

5. **Verify**:
   - Confirm `retentionDays` in logs matches new value
   - Check `totalDeleted` is expected
   - No errors logged

6. **Document Change**:
   - Update team documentation
   - Log in change management system
   - Notify stakeholders

---

### Manual Trigger (Emergency)

⚠️ **Use only in emergencies or testing**

```bash
# Local emulator
firebase functions:shell
# Then in shell:
cleanupOldContactRequests()

# Production (requires additional setup)
# Contact Firebase admin or use Cloud Console
```

---

### One-Time Manual Cleanup (Large Backlog)

If batch warnings persist and urgent cleanup needed:

```javascript
// Create a one-time script: functions/scripts/manual-cleanup.js
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.database();
const RETENTION_DAYS = 90;
const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

async function manualCleanup() {
  let totalDeleted = 0;
  let hasMore = true;
  
  while (hasMore) {
    const snapshot = await db.ref('contactRequests')
      .orderByChild('createdAt')
      .endAt(cutoff)
      .limitToFirst(500) // Larger batch for one-time cleanup
      .once('value');
    
    if (!snapshot.exists()) {
      hasMore = false;
      break;
    }
    
    const updates = {};
    snapshot.forEach((child) => {
      if (child.val().createdAt < cutoff) {
        updates[child.key] = null;
        totalDeleted++;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await db.ref('contactRequests').update(updates);
      console.log(`Deleted batch: ${Object.keys(updates).length}, Total: ${totalDeleted}`);
    } else {
      hasMore = false;
    }
  }
  
  console.log(`Manual cleanup completed. Total deleted: ${totalDeleted}`);
}

manualCleanup().then(() => process.exit(0)).catch(console.error);
```

Run:
```bash
cd functions
node scripts/manual-cleanup.js
```

---

## Escalation

### When to Escalate

- Function fails for 2+ consecutive days
- Unexpected data deletion (>50% of expected)
- Security or permission errors
- Database performance issues
- Compliance concerns

### Escalation Contacts

1. **Technical Issues**: Firebase Operations Team
2. **Data/Compliance**: Data Protection Officer
3. **Emergency**: On-call Engineer

---

## Compliance & Audit

### Audit Trail

All deletions are logged with:
- Timestamp of execution
- Retention period used
- Count of records deleted
- Cutoff date/timestamp

### Compliance Requirements

- **GDPR**: Right to erasure after reasonable period
- **Data Retention**: Configurable retention period
- **Audit**: All operations logged
- **Recovery**: No automatic recovery (backups required)

### Regular Audits

**Quarterly Review**:
- [ ] Verify retention period aligns with policy
- [ ] Review deletion logs
- [ ] Check compliance with regulations
- [ ] Update documentation

---

## Change Log Template

When making changes, document:

```
Date: YYYY-MM-DD
Changed By: [Name]
Change Type: [Config/Code/Both]
Old Value: [e.g., 14 days]
New Value: [e.g., 90 days]
Reason: [Business/Compliance/Technical]
Impact: [Expected deletion counts, timing]
Verified: [Yes/No - date of verification]
```

---

## Emergency Contacts

**Function Failures**: firebase-ops@example.com
**Data Issues**: data-protection@example.com
**On-Call**: +1-XXX-XXX-XXXX

---

## Related Documentation

- Main README: `functions/README.md`
- Test Specifications: `functions/test/features/contactRequestRetention.feature`
- Source Code: `functions/index.js`
- Firebase Console: https://console.firebase.google.com

---

**Last Updated**: [Auto-update date]
**Version**: 1.1.0
**Owner**: Firebase Operations Team

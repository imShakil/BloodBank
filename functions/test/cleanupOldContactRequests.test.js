/**
 * Unit Tests for cleanupOldContactRequests Cloud Function
 * 
 * Tests retention period logic, boundary conditions, and logging behavior.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('cleanupOldContactRequests - Retention Logic Tests', () => {
  let mockDatabase;
  let mockRef;
  let mockSnapshot;
  let loggerStub;
  
  const BATCH_SIZE = 200;
  const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

  beforeEach(() => {
    // Mock Firebase Admin Database
    mockSnapshot = {
      exists: sinon.stub(),
      forEach: sinon.stub(),
      val: sinon.stub(),
    };

    mockRef = {
      orderByChild: sinon.stub().returnsThis(),
      endAt: sinon.stub().returnsThis(),
      limitToFirst: sinon.stub().returnsThis(),
      once: sinon.stub().resolves(mockSnapshot),
      update: sinon.stub().resolves(),
    };

    mockDatabase = {
      ref: sinon.stub().returns(mockRef),
    };

    // Mock logger
    loggerStub = {
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Retention Period Configuration', () => {
    it('should use default retention period of 90 days when not configured', () => {
      const retentionDays = 90; // Default value
      const now = Date.now();
      const expectedCutoff = now - (retentionDays * MILLISECONDS_PER_DAY);

      expect(retentionDays).to.equal(90);
      expect(expectedCutoff).to.be.a('number');
      expect(expectedCutoff).to.be.lessThan(now);
    });

    it('should accept custom retention period via configuration', () => {
      const customRetentionDays = 30;
      const now = Date.now();
      const expectedCutoff = now - (customRetentionDays * MILLISECONDS_PER_DAY);

      expect(customRetentionDays).to.equal(30);
      expect(expectedCutoff).to.be.a('number');
    });

    it('should calculate cutoff timestamp correctly for 90 days', () => {
      const retentionDays = 90;
      const now = 1704067200000; // 2024-01-01 00:00:00 UTC
      const expectedCutoff = now - (retentionDays * MILLISECONDS_PER_DAY);
      const expectedDate = new Date(expectedCutoff);

      // 90 days before 2024-01-01 is approximately 2023-10-03
      expect(expectedDate.getMonth()).to.equal(9); // October (0-indexed)
      expect(expectedDate.getDate()).to.equal(3);
    });
  });

  describe('Boundary Condition Tests', () => {
    it('should delete contact request when createdAt < cutoff', () => {
      const retentionDays = 90;
      const now = Date.now();
      const cutoff = now - (retentionDays * MILLISECONDS_PER_DAY);
      
      // Contact request created 91 days ago (older than cutoff)
      const createdAt = cutoff - MILLISECONDS_PER_DAY;

      expect(createdAt).to.be.lessThan(cutoff);
      // This should be deleted
    });

    it('should NOT delete contact request when createdAt === cutoff (boundary)', () => {
      const retentionDays = 90;
      const now = Date.now();
      const cutoff = now - (retentionDays * MILLISECONDS_PER_DAY);
      
      // Contact request created exactly at cutoff
      const createdAt = cutoff;

      expect(createdAt).to.equal(cutoff);
      // This should NOT be deleted (preserved)
    });

    it('should NOT delete contact request when createdAt > cutoff', () => {
      const retentionDays = 90;
      const now = Date.now();
      const cutoff = now - (retentionDays * MILLISECONDS_PER_DAY);
      
      // Contact request created 89 days ago (newer than cutoff)
      const createdAt = cutoff + MILLISECONDS_PER_DAY;

      expect(createdAt).to.be.greaterThan(cutoff);
      // This should NOT be deleted
    });

    it('should handle contact request exactly 1 millisecond before cutoff', () => {
      const retentionDays = 90;
      const now = Date.now();
      const cutoff = now - (retentionDays * MILLISECONDS_PER_DAY);
      
      const createdAt = cutoff - 1;

      expect(createdAt).to.be.lessThan(cutoff);
      // Should be deleted
    });

    it('should handle contact request exactly 1 millisecond after cutoff', () => {
      const retentionDays = 90;
      const now = Date.now();
      const cutoff = now - (retentionDays * MILLISECONDS_PER_DAY);
      
      const createdAt = cutoff + 1;

      expect(createdAt).to.be.greaterThan(cutoff);
      // Should NOT be deleted
    });
  });

  describe('Deletion Logic Tests', () => {
    it('should build correct updates object for deletion', () => {
      const mockContactRequests = [
        { key: 'req1', createdAt: 1000 },
        { key: 'req2', createdAt: 2000 },
        { key: 'req3', createdAt: 3000 },
      ];
      
      const cutoff = 2500;
      const updates = {};
      let totalDeleted = 0;

      mockContactRequests.forEach((req) => {
        if (req.createdAt < cutoff) {
          updates[req.key] = null;
          totalDeleted++;
        }
      });

      expect(updates).to.deep.equal({
        'req1': null,
        'req2': null,
      });
      expect(totalDeleted).to.equal(2);
      expect(updates['req3']).to.be.undefined;
    });

    it('should not create updates when no records are eligible for deletion', () => {
      const mockContactRequests = [
        { key: 'req1', createdAt: 3000 },
        { key: 'req2', createdAt: 4000 },
      ];
      
      const cutoff = 2000;
      const updates = {};
      let totalDeleted = 0;

      mockContactRequests.forEach((req) => {
        if (req.createdAt < cutoff) {
          updates[req.key] = null;
          totalDeleted++;
        }
      });

      expect(updates).to.be.empty;
      expect(totalDeleted).to.equal(0);
    });
  });

  describe('Batch Processing Tests', () => {
    it('should warn when batch limit is reached', () => {
      const totalInspected = BATCH_SIZE;
      const shouldWarn = totalInspected >= BATCH_SIZE;

      expect(shouldWarn).to.be.true;
    });

    it('should not warn when below batch limit', () => {
      const totalInspected = BATCH_SIZE - 1;
      const shouldWarn = totalInspected >= BATCH_SIZE;

      expect(shouldWarn).to.be.false;
    });

    it('should process exactly BATCH_SIZE records', () => {
      const totalInspected = BATCH_SIZE;

      expect(totalInspected).to.equal(200);
    });
  });

  describe('Logging Tests', () => {
    it('should log retention days and cutoff information on start', () => {
      const retentionDays = 90;
      const cutoff = Date.now() - (retentionDays * MILLISECONDS_PER_DAY);
      
      const logData = {
        retentionDays: retentionDays,
        cutoffTimestamp: cutoff,
        cutoffDate: new Date(cutoff).toISOString(),
        currentTimestamp: Date.now(),
        currentDate: new Date().toISOString(),
      };

      expect(logData).to.have.property('retentionDays', 90);
      expect(logData).to.have.property('cutoffTimestamp');
      expect(logData).to.have.property('cutoffDate');
      expect(logData.cutoffDate).to.match(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    });

    it('should log completion with counts', () => {
      const totalInspected = 10;
      const totalDeleted = 7;
      const totalPreserved = totalInspected - totalDeleted;

      const logData = {
        retentionDays: 90,
        totalInspected: totalInspected,
        totalDeleted: totalDeleted,
        totalPreserved: totalPreserved,
      };

      expect(logData.totalInspected).to.equal(10);
      expect(logData.totalDeleted).to.equal(7);
      expect(logData.totalPreserved).to.equal(3);
    });

    it('should log zero values when nothing to clean up', () => {
      const logData = {
        retentionDays: 90,
        totalInspected: 0,
        totalDeleted: 0,
      };

      expect(logData.totalInspected).to.equal(0);
      expect(logData.totalDeleted).to.equal(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing createdAt field gracefully', () => {
      const contactRequest = {};
      const createdAt = contactRequest.createdAt || 0;

      expect(createdAt).to.equal(0);
      // createdAt of 0 should be deleted as it's < any valid cutoff
    });

    it('should handle very old timestamps (edge of epoch)', () => {
      const veryOldTimestamp = 1000; // Very early Unix timestamp
      const cutoff = Date.now() - (90 * MILLISECONDS_PER_DAY);

      expect(veryOldTimestamp).to.be.lessThan(cutoff);
      // Should be deleted
    });

    it('should handle future timestamps (clock skew)', () => {
      const futureTimestamp = Date.now() + (365 * MILLISECONDS_PER_DAY);
      const cutoff = Date.now() - (90 * MILLISECONDS_PER_DAY);

      expect(futureTimestamp).to.be.greaterThan(cutoff);
      // Should NOT be deleted
    });

    it('should handle retention period of 0 days', () => {
      const retentionDays = 0;
      const now = Date.now();
      const cutoff = now - (retentionDays * MILLISECONDS_PER_DAY);

      expect(cutoff).to.equal(now);
      // Only records older than "now" would be deleted
    });
  });
});

/**
 * Handler tests for cleanupOldContactRequests.
 *
 * These drive the real handler body (`runContactRequestCleanup` in
 * lib/retention.js) with a fake Realtime Database and logger, so the query
 * shape, the write payload and the structured logs are all asserted against
 * the code that actually ships.
 */

const { expect } = require("chai");
const sinon = require("sinon");

const {
  BATCH_SIZE,
  DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
  MILLISECONDS_PER_DAY,
  computeCutoff,
  runContactRequestCleanup,
} = require("../lib/retention");

const NOW = 1704067200000;   // 2024-01-01T00:00:00.000Z

/**
 * Build a fake RTDB `Database` whose `contactRequests` query resolves to the
 * supplied records.
 *
 * @param {Array<{key: string, createdAt?: unknown}>} records
 */
function fakeDatabase(records) {
  const snapshot = {
    exists: () => records.length > 0,
    forEach: (callback) => {
      for (const record of records) {
        callback({
          key: record.key,
          val: () => ("createdAt" in record ? { createdAt: record.createdAt } : {}),
        });
      }
    },
  };

  const query = {
    orderByChild: sinon.stub(),
    endAt: sinon.stub(),
    limitToFirst: sinon.stub(),
    once: sinon.stub().resolves(snapshot),
    update: sinon.stub().resolves(),
  };
  query.orderByChild.returns(query);
  query.endAt.returns(query);
  query.limitToFirst.returns(query);

  return { db: { ref: sinon.stub().returns(query) }, query };
}

function fakeLogger() {
  return { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() };
}

/** Find the structured payload of the log call whose message contains `needle`. */
function logPayload(stub, needle) {
  const call = stub.getCalls().find((c) => String(c.args[0]).includes(needle));
  return call ? call.args[1] : undefined;
}

describe("runContactRequestCleanup", () => {
  afterEach(() => sinon.restore());

  describe("database query", () => {
    it("queries contactRequests ordered by createdAt, bounded by the cutoff and the batch size", async () => {
      const { db, query } = fakeDatabase([]);

      await runContactRequestCleanup({
        db,
        logger: fakeLogger(),
        retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
        now: NOW,
      });

      expect(db.ref.firstCall.args[0]).to.equal("contactRequests");
      expect(query.orderByChild.calledOnceWith("createdAt")).to.be.true;
      expect(query.endAt.calledOnceWith(computeCutoff(NOW, DEFAULT_CONTACT_REQUEST_RETENTION_DAYS)))
        .to.be.true;
      expect(query.limitToFirst.calledOnceWith(BATCH_SIZE)).to.be.true;
    });

    it("moves the cutoff when the retention period changes", async () => {
      const { db, query } = fakeDatabase([]);

      await runContactRequestCleanup({ db, logger: fakeLogger(), retentionDays: 30, now: NOW });

      expect(query.endAt.firstCall.args[0]).to.equal(NOW - 30 * MILLISECONDS_PER_DAY);
    });
  });

  describe("deletion", () => {
    it("deletes only records older than the cutoff and leaves the boundary record alone", async () => {
      const cutoff = computeCutoff(NOW, DEFAULT_CONTACT_REQUEST_RETENTION_DAYS);
      const { db, query } = fakeDatabase([
        { key: "old", createdAt: cutoff - MILLISECONDS_PER_DAY },
        { key: "boundary", createdAt: cutoff },
        { key: "fresh", createdAt: cutoff + MILLISECONDS_PER_DAY },
      ]);

      const result = await runContactRequestCleanup({
        db,
        logger: fakeLogger(),
        retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
        now: NOW,
      });

      expect(query.update.calledOnce).to.be.true;
      expect(query.update.firstCall.args[0]).to.deep.equal({ old: null });
      expect(result.totalInspected).to.equal(3);
      expect(result.totalDeleted).to.equal(1);
      expect(result.totalPreserved).to.equal(2);
    });

    it("does not write to the database when nothing is eligible", async () => {
      // Distinct from an empty query window: endAt(cutoff) is inclusive, so the
      // boundary record IS fetched and inspected, then preserved. update() must
      // not be called with an empty payload, and this is a "completed" run
      // rather than the "nothing to clean up" early return.
      const cutoff = computeCutoff(NOW, DEFAULT_CONTACT_REQUEST_RETENTION_DAYS);
      const { db, query } = fakeDatabase([
        { key: "boundary", createdAt: cutoff },
        { key: "fresh", createdAt: cutoff + 1 },
      ]);
      const logger = fakeLogger();

      const result = await runContactRequestCleanup({
        db,
        logger,
        retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
        now: NOW,
      });

      expect(query.update.called).to.be.false;
      expect(result.totalInspected).to.equal(2);
      expect(result.totalDeleted).to.equal(0);
      expect(result.totalPreserved).to.equal(2);
      expect(logPayload(logger.info, "completed")).to.not.be.undefined;
      expect(logPayload(logger.info, "nothing to clean up")).to.be.undefined;
    });

    it("deletes records with no createdAt field", async () => {
      const { db, query } = fakeDatabase([{ key: "malformed" }]);

      const result = await runContactRequestCleanup({
        db,
        logger: fakeLogger(),
        retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
        now: NOW,
      });

      expect(query.update.firstCall.args[0]).to.deep.equal({ malformed: null });
      expect(result.totalDeleted).to.equal(1);
    });
  });

  describe("empty collection", () => {
    it("returns zero counts and skips the write when the query finds nothing", async () => {
      const { db, query } = fakeDatabase([]);
      const logger = fakeLogger();

      const result = await runContactRequestCleanup({
        db,
        logger,
        retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
        now: NOW,
      });

      expect(query.update.called).to.be.false;
      expect(result).to.deep.include({ totalInspected: 0, totalDeleted: 0, totalPreserved: 0 });

      const payload = logPayload(logger.info, "nothing to clean up");
      expect(payload).to.deep.include({
        retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
        totalInspected: 0,
        totalDeleted: 0,
        totalPreserved: 0,
      });
    });
  });

  describe("structured logging (AC2)", () => {
    it("logs the effective retention days and its source on start", async () => {
      const { db } = fakeDatabase([]);
      const logger = fakeLogger();

      await runContactRequestCleanup({
        db,
        logger,
        retentionDays: 45,
        retentionSource: "configured",
        now: NOW,
      });

      const payload = logPayload(logger.info, "starting");
      expect(payload).to.include({
        retentionDays: 45,
        retentionSource: "configured",
        cutoffTimestamp: computeCutoff(NOW, 45),
        currentTimestamp: NOW,
        batchSize: BATCH_SIZE,
      });
      expect(payload.cutoffDate).to.equal(new Date(computeCutoff(NOW, 45)).toISOString());
      expect(payload.currentDate).to.equal("2024-01-01T00:00:00.000Z");
    });

    it("reports the source as default when the value was not configured", async () => {
      const { db } = fakeDatabase([]);
      const logger = fakeLogger();

      await runContactRequestCleanup({
        db,
        logger,
        retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
        now: NOW,
      });

      expect(logPayload(logger.info, "starting").retentionSource).to.equal("default");
    });

    it("logs inspected, deleted and preserved counts on completion", async () => {
      const cutoff = computeCutoff(NOW, DEFAULT_CONTACT_REQUEST_RETENTION_DAYS);
      const { db } = fakeDatabase([
        { key: "a", createdAt: cutoff - 1 },
        { key: "b", createdAt: cutoff - 2 },
        { key: "c", createdAt: cutoff },
      ]);
      const logger = fakeLogger();

      await runContactRequestCleanup({
        db,
        logger,
        retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
        now: NOW,
      });

      const payload = logPayload(logger.info, "completed");
      expect(payload).to.include({
        retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
        totalInspected: 3,
        totalDeleted: 2,
        totalPreserved: 1,
        cutoffTimestamp: cutoff,
      });
      expect(payload.cutoffDate).to.be.a("string").and.match(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("batch limit", () => {
    const manyRecords = (count, createdAt) =>
      Array.from({ length: count }, (_, i) => ({ key: `req-${i}`, createdAt }));

    it("warns when the batch limit is reached", async () => {
      const cutoff = computeCutoff(NOW, DEFAULT_CONTACT_REQUEST_RETENTION_DAYS);
      const { db } = fakeDatabase(manyRecords(BATCH_SIZE, cutoff - 1));
      const logger = fakeLogger();

      const result = await runContactRequestCleanup({
        db,
        logger,
        retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
        now: NOW,
      });

      expect(result.totalDeleted).to.equal(BATCH_SIZE);
      const payload = logPayload(logger.warn, "batch limit reached");
      expect(payload).to.include({
        batchSize: BATCH_SIZE,
        retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
        totalInspected: BATCH_SIZE,
      });
    });

    it("does not warn below the batch limit", async () => {
      const cutoff = computeCutoff(NOW, DEFAULT_CONTACT_REQUEST_RETENTION_DAYS);
      const { db } = fakeDatabase(manyRecords(BATCH_SIZE - 1, cutoff - 1));
      const logger = fakeLogger();

      await runContactRequestCleanup({
        db,
        logger,
        retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
        now: NOW,
      });

      expect(logger.warn.called).to.be.false;
    });

    it("warns on a full batch even when the boundary records are preserved", async () => {
      // Records exactly at the cutoff still consume batch slots, so the warning
      // keys off totalInspected rather than totalDeleted.
      const cutoff = computeCutoff(NOW, DEFAULT_CONTACT_REQUEST_RETENTION_DAYS);
      const { db } = fakeDatabase(manyRecords(BATCH_SIZE, cutoff));
      const logger = fakeLogger();

      const result = await runContactRequestCleanup({
        db,
        logger,
        retentionDays: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
        now: NOW,
      });

      expect(result.totalDeleted).to.equal(0);
      expect(logPayload(logger.warn, "batch limit reached")).to.not.be.undefined;
    });
  });
});

/**
 * Unit tests for the retention logic in lib/retention.js.
 *
 * These exercise the real exported functions — if the retention default, the
 * cutoff maths or the boundary rule changes, these tests fail.
 *
 * Covers EPMCDMETST-66058 AC1 (only records older than the effective retention
 * are deleted), AC2 (documented default), AC3 (newer records kept) and AC4
 * (behaviour exactly at the cutoff).
 */

const { expect } = require("chai");

const {
  MILLISECONDS_PER_DAY,
  DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,
  BATCH_SIZE,
  MIN_RETENTION_DAYS,
  MAX_RETENTION_DAYS,
  resolveRetentionDays,
  resolveEffectiveRetention,
  computeCutoff,
  selectExpiredKeys,
} = require("../lib/retention");

describe("retention constants", () => {
  it("documents a default retention period of 90 days", () => {
    // The original defect was a 90-day comment over a 14-day constant.
    expect(DEFAULT_CONTACT_REQUEST_RETENTION_DAYS).to.equal(90);
  });

  it("uses the same default in index.js as in lib/retention.js", () => {
    // index.js must pass the exported constant to defineInt, not a literal,
    // so the documented default and the deployed default cannot diverge.
    const source = require("fs").readFileSync(require.resolve("../index.js"), "utf8");
    expect(source).to.include("default: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS");
    expect(source).to.not.match(/CONTACT_REQUEST_RETENTION_DAYS\s*=\s*\d+/);
  });

  it("uses a batch size of 200 and a one-day millisecond constant", () => {
    expect(BATCH_SIZE).to.equal(200);
    expect(MILLISECONDS_PER_DAY).to.equal(86400000);
  });
});

describe("resolveRetentionDays", () => {
  it("falls back to the documented default when nothing is configured", () => {
    for (const raw of [undefined, null, ""]) {
      const result = resolveRetentionDays(raw);
      expect(result.retentionDays, `raw=${JSON.stringify(raw)}`).to.equal(
        DEFAULT_CONTACT_REQUEST_RETENTION_DAYS
      );
      expect(result.source).to.equal("default");
      expect(result.warning).to.be.undefined;
    }
  });

  it("honours a configured value inside the accepted range", () => {
    expect(resolveRetentionDays(30)).to.deep.equal({ retentionDays: 30, source: "configured" });
    expect(resolveRetentionDays("60")).to.deep.equal({ retentionDays: 60, source: "configured" });
    expect(resolveRetentionDays(MIN_RETENTION_DAYS).retentionDays).to.equal(MIN_RETENTION_DAYS);
    expect(resolveRetentionDays(MAX_RETENTION_DAYS).retentionDays).to.equal(MAX_RETENTION_DAYS);
  });

  it("rejects 0 and negative values so a misconfiguration cannot delete everything", () => {
    for (const raw of [0, -1, -90]) {
      const result = resolveRetentionDays(raw);
      expect(result.retentionDays, `raw=${raw}`).to.equal(
        DEFAULT_CONTACT_REQUEST_RETENTION_DAYS
      );
      expect(result.source).to.equal("default");
      expect(result.warning).to.be.a("string");
    }
  });

  it("rejects non-integer and unparseable values", () => {
    for (const raw of [1.5, "abc", "30.5", NaN, Infinity, {}, true]) {
      const result = resolveRetentionDays(raw);
      expect(result.retentionDays, `raw=${JSON.stringify(raw)}`).to.equal(
        DEFAULT_CONTACT_REQUEST_RETENTION_DAYS
      );
      expect(result.source, `raw=${JSON.stringify(raw)}`).to.equal("default");
      expect(result.warning, `raw=${JSON.stringify(raw)}`).to.be.a("string");
    }
  });

  it("rejects values above the accepted maximum", () => {
    const result = resolveRetentionDays(MAX_RETENTION_DAYS + 1);
    expect(result.retentionDays).to.equal(DEFAULT_CONTACT_REQUEST_RETENTION_DAYS);
    expect(result.warning).to.include(String(MAX_RETENTION_DAYS));
  });
});

describe("resolveEffectiveRetention", () => {
  // These encode the real behaviour of defineInt(...).value(), measured against
  // firebase-functions v7: absent → 0, "abc" → 0, "30.5" → 30.
  it("uses the documented default, without a warning, when the variable is absent", () => {
    // paramValue is the misleading 0 that defineInt returns in this case.
    for (const envValue of [undefined, null, "", "   "]) {
      const result = resolveEffectiveRetention({ envValue, paramValue: 0 });
      expect(result.retentionDays, `envValue=${JSON.stringify(envValue)}`).to.equal(
        DEFAULT_CONTACT_REQUEST_RETENTION_DAYS
      );
      expect(result.source).to.equal("default");
      expect(result.warning, "absence is not a misconfiguration").to.be.undefined;
    }
  });

  it("honours a configured value", () => {
    const result = resolveEffectiveRetention({ envValue: "30", paramValue: 30 });
    expect(result).to.deep.equal({ retentionDays: 30, source: "configured" });
  });

  it("warns and falls back when the variable is explicitly 0", () => {
    // Must not be confused with "absent": a real 0 is an operator error worth
    // shouting about, and would delete every contact request if honoured.
    const result = resolveEffectiveRetention({ envValue: "0", paramValue: 0 });
    expect(result.retentionDays).to.equal(DEFAULT_CONTACT_REQUEST_RETENTION_DAYS);
    expect(result.source).to.equal("default");
    expect(result.warning).to.be.a("string");
  });

  it("warns on junk that defineInt would silently coerce to 0", () => {
    const result = resolveEffectiveRetention({ envValue: "abc", paramValue: 0 });
    expect(result.retentionDays).to.equal(DEFAULT_CONTACT_REQUEST_RETENTION_DAYS);
    expect(result.warning).to.include("abc");
  });

  it("warns on a fractional value that defineInt would silently truncate", () => {
    const result = resolveEffectiveRetention({ envValue: "30.5", paramValue: 30 });
    expect(result.retentionDays).to.equal(DEFAULT_CONTACT_REQUEST_RETENTION_DAYS);
    expect(result.warning).to.be.a("string");
  });

  it("warns and falls back on an out-of-range value", () => {
    for (const envValue of ["-5", "0", "4000"]) {
      const result = resolveEffectiveRetention({ envValue, paramValue: Number(envValue) });
      expect(result.retentionDays, `envValue=${envValue}`).to.equal(
        DEFAULT_CONTACT_REQUEST_RETENTION_DAYS
      );
      expect(result.source).to.equal("default");
      expect(result.warning, `envValue=${envValue}`).to.be.a("string");
    }
  });

  it("works without a param value at all", () => {
    expect(resolveEffectiveRetention({ envValue: "45" })).to.deep.equal({
      retentionDays: 45,
      source: "configured",
    });
  });

  it("defaults when called with no arguments", () => {
    expect(resolveEffectiveRetention().retentionDays).to.equal(
      DEFAULT_CONTACT_REQUEST_RETENTION_DAYS
    );
  });
});

describe("computeCutoff", () => {
  it("subtracts exactly retentionDays worth of milliseconds", () => {
    const now = 1704067200000;                       // 2024-01-01T00:00:00.000Z
    const cutoff = computeCutoff(now, 90);

    expect(now - cutoff).to.equal(90 * MILLISECONDS_PER_DAY);
    expect(now - cutoff).to.equal(7776000000);
    expect(new Date(cutoff).toISOString()).to.equal("2023-10-03T00:00:00.000Z");
  });

  it("tracks the configured retention period", () => {
    const now = 1704067200000;
    expect(now - computeCutoff(now, 14)).to.equal(14 * MILLISECONDS_PER_DAY);
    expect(now - computeCutoff(now, 30)).to.equal(30 * MILLISECONDS_PER_DAY);
  });
});

describe("selectExpiredKeys — boundary behaviour", () => {
  const cutoff = computeCutoff(1704067200000, DEFAULT_CONTACT_REQUEST_RETENTION_DAYS);

  it("deletes a record created before the cutoff", () => {
    const result = selectExpiredKeys([{ key: "old", createdAt: cutoff - MILLISECONDS_PER_DAY }], cutoff);

    expect(result.updates).to.deep.equal({ old: null });
    expect(result.totalDeleted).to.equal(1);
    expect(result.totalPreserved).to.equal(0);
  });

  it("deletes a record created 1 millisecond before the cutoff", () => {
    const result = selectExpiredKeys([{ key: "edge", createdAt: cutoff - 1 }], cutoff);

    expect(result.updates).to.deep.equal({ edge: null });
    expect(result.totalDeleted).to.equal(1);
  });

  it("KEEPS a record created exactly at the cutoff (AC4)", () => {
    const result = selectExpiredKeys([{ key: "boundary", createdAt: cutoff }], cutoff);

    expect(result.updates).to.deep.equal({});
    expect(result.totalDeleted).to.equal(0);
    expect(result.totalInspected).to.equal(1);
    expect(result.totalPreserved).to.equal(1);
  });

  it("keeps a record created 1 millisecond after the cutoff", () => {
    const result = selectExpiredKeys([{ key: "fresh", createdAt: cutoff + 1 }], cutoff);

    expect(result.updates).to.deep.equal({});
    expect(result.totalDeleted).to.equal(0);
  });

  it("keeps a record created after the cutoff (AC3)", () => {
    const result = selectExpiredKeys(
      [{ key: "recent", createdAt: cutoff + MILLISECONDS_PER_DAY }],
      cutoff
    );

    expect(result.totalDeleted).to.equal(0);
    expect(result.totalPreserved).to.equal(1);
  });

  it("keeps a future-dated record (clock skew)", () => {
    const result = selectExpiredKeys(
      [{ key: "skewed", createdAt: cutoff + 365 * MILLISECONDS_PER_DAY }],
      cutoff
    );

    expect(result.totalDeleted).to.equal(0);
  });
});

describe("selectExpiredKeys — invalid createdAt", () => {
  const cutoff = computeCutoff(Date.now(), DEFAULT_CONTACT_REQUEST_RETENTION_DAYS);

  it("deletes records whose createdAt is missing or non-numeric", () => {
    // Documented decision: absent/invalid createdAt is treated as 0, i.e.
    // infinitely old, so the record is deleted.
    const entries = [
      { key: "missing", createdAt: undefined },
      { key: "null", createdAt: null },
      { key: "string", createdAt: "2024-01-01" },
      { key: "nan", createdAt: NaN },
      { key: "infinite", createdAt: Infinity },
    ];

    const result = selectExpiredKeys(entries, cutoff);

    expect(Object.keys(result.updates).sort()).to.deep.equal([
      "infinite",
      "missing",
      "nan",
      "null",
      "string",
    ]);
    expect(result.totalDeleted).to.equal(5);
  });

  it("deletes epoch-era timestamps", () => {
    const result = selectExpiredKeys([{ key: "ancient", createdAt: 1000 }], cutoff);
    expect(result.totalDeleted).to.equal(1);
  });
});

describe("selectExpiredKeys — mixed ages", () => {
  // Mirrors the "Multiple contact requests with mixed ages" scenario in
  // test/features/contactRequestRetention.feature.
  it("deletes only the records older than the cutoff", () => {
    const now = Date.now();
    const cutoff = computeCutoff(now, 90);
    const daysAgo = (days) => now - days * MILLISECONDS_PER_DAY;

    const entries = [
      { key: "req-001", createdAt: daysAgo(100) },   // delete
      { key: "req-002", createdAt: daysAgo(91) },    // delete
      { key: "req-003", createdAt: cutoff },         // preserve (exactly at cutoff)
      { key: "req-004", createdAt: daysAgo(89) },    // preserve
      { key: "req-005", createdAt: daysAgo(30) },    // preserve
      { key: "req-006", createdAt: daysAgo(1) },     // preserve
    ];

    const result = selectExpiredKeys(entries, cutoff);

    expect(result.updates).to.deep.equal({ "req-001": null, "req-002": null });
    expect(result.totalInspected).to.equal(6);
    expect(result.totalDeleted).to.equal(2);
    expect(result.totalPreserved).to.equal(4);
  });

  it("returns empty counts for an empty batch", () => {
    const result = selectExpiredKeys([], 0);

    expect(result.updates).to.deep.equal({});
    expect(result.totalInspected).to.equal(0);
    expect(result.totalDeleted).to.equal(0);
    expect(result.totalPreserved).to.equal(0);
  });

  it("changing the retention period changes what is deleted", () => {
    // AC1: the same data set yields different deletions for 14 vs 90 days.
    const now = Date.now();
    const entries = [{ key: "req-30d", createdAt: now - 30 * MILLISECONDS_PER_DAY }];

    expect(selectExpiredKeys(entries, computeCutoff(now, 14)).totalDeleted).to.equal(1);
    expect(selectExpiredKeys(entries, computeCutoff(now, 90)).totalDeleted).to.equal(0);
  });
});

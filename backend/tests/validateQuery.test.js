// ═══════════════════════════════════════════════════════════
// tests/validateQuery.test.js — Unit tests for validateOperators
// ═══════════════════════════════════════════════════════════
// Uses Node.js built-in test runner (node:test and node:assert).
// No external test dependencies required.
// Run with:  npm test   (from the backend/ directory)
// ═══════════════════════════════════════════════════════════

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateOperators, ALLOWED_DOLLAR_OPS } = require('../utils/validateQuery');

// Helper: expect no throw
function assertAllowed(obj, label) {
  assert.doesNotThrow(
    () => validateOperators(obj, 'filter'),
    `Expected "${label}" to be allowed but it threw`
  );
}

// Helper: expect throw with a message fragment
function assertBlocked(obj, fragment, label) {
  assert.throws(
    () => validateOperators(obj, 'filter'),
    (err) => {
      assert.ok(
        err.message.includes(fragment),
        `Expected error to include "${fragment}" for "${label}", got: ${err.message}`
      );
      return true;
    }
  );
}

// ─── Tests ────────────────────────────────────────────────

test('$where is rejected (code-injection risk)', () => {
  assertBlocked({ $where: 'this.type === "vehicle"' }, 'not permitted', '$where');
});

test('$function is rejected (code-injection risk)', () => {
  // $function directly as a key — hits DANGEROUS_OPS before allow-list check
  assertBlocked(
    { $function: { body: 'function() { return true; }', args: [], lang: 'js' } },
    'not permitted',
    '$function'
  );
});

test('unknown operator $jsonSchema is rejected (not in allow-list)', () => {
  assertBlocked({ $jsonSchema: { bsonType: 'object' } }, 'allow-list', '$jsonSchema');
});

test('$elemMatch is allowed', () => {
  assertAllowed(
    { findings: { $elemMatch: { severity: 'high', component: 'brakes' } } },
    '$elemMatch'
  );
});

test('nested allowed operators are accepted', () => {
  assertAllowed(
    {
      type: { $in: ['vehicle', 'building'] },
      overallRating: { $ne: 'pass' },
      createdAt: { $gte: new Date('2024-01-01'), $lte: new Date('2024-12-31') }
    },
    '$in/$ne/$gte/$lte combination'
  );
});

test('field starting with "$" is rejected by caller before validateOperators, and by validateOperators if embedded as key', () => {
  // Simulate what would happen if a dollar-prefixed key somehow reached validateOperators
  // (not in allow-list) — should throw allow-list error
  assertBlocked({ '$badField': 1 }, 'allow-list', 'dollar-prefixed field key');
});

test('ALLOWED_DOLLAR_OPS set contains $elemMatch', () => {
  assert.ok(ALLOWED_DOLLAR_OPS.has('$elemMatch'), '$elemMatch should be in the allow-list');
});

test('ALLOWED_DOLLAR_OPS does not contain $where, $function, $accumulator', () => {
  assert.ok(!ALLOWED_DOLLAR_OPS.has('$where'), '$where should not be in allow-list');
  assert.ok(!ALLOWED_DOLLAR_OPS.has('$function'), '$function should not be in allow-list');
  assert.ok(!ALLOWED_DOLLAR_OPS.has('$accumulator'), '$accumulator should not be in allow-list');
});

// ═══════════════════════════════════════════════════════════
// utils/validateQuery.js — Operator Allow-list & Validation
// ═══════════════════════════════════════════════════════════
// Centralised home for the Query Playground operator allow-list
// and the recursive validateOperators function.  Imported by
// queryController.js.  All other modules that need validation
// must import from here, not re-declare their own copies.
// ═══════════════════════════════════════════════════════════

// ─── Operator Allow-list ─────────────────────────────────
// Operators explicitly approved for the playground.
// Everything else that starts with "$" is rejected.
const ALLOWED_DOLLAR_OPS = new Set([
  '$eq', '$ne', '$gt', '$gte', '$lt', '$lte',
  '$in', '$nin', '$all',
  '$regex', '$options',
  '$exists',
  '$and', '$or', '$not', '$nor',
  '$elemMatch',   // added: needed for matching two conditions on the same array element
]);

// Operators that must never reach the driver (code injection risk).
const DANGEROUS_OPS = new Set(['$where', '$function', '$accumulator']);

/**
 * Recursively walks a MongoDB filter/projection/sort object and
 * throws an Error if any disallowed operator is found.
 *
 * @param {*}      obj  - The object to validate (filter, projection, sort …)
 * @param {string} path - Dot-path prefix used in error messages
 */
function validateOperators(obj, path) {
  path = path || '';
  if (obj === null || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach(function (item, i) { validateOperators(item, path + '[' + i + ']'); });
    return;
  }
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var fullPath = path ? path + '.' + key : key;
    if (key.charAt(0) === '$') {
      if (DANGEROUS_OPS.has(key)) {
        throw new Error('Operator "' + key + '" is not permitted (code-injection risk).');
      }
      if (!ALLOWED_DOLLAR_OPS.has(key)) {
        throw new Error(
          'Operator "' + key + '" is not in the Query Playground allow-list. ' +
          'Allowed: ' + Array.from(ALLOWED_DOLLAR_OPS).join(', ')
        );
      }
    }
    validateOperators(obj[key], fullPath);
  }
}

module.exports = { ALLOWED_DOLLAR_OPS, DANGEROUS_OPS, validateOperators };

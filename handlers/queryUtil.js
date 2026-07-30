// Express's query parser (qs) turns bracket-notation params like
// "?field[$ne]=x" into a plain nested object ({field: {$ne: 'x'}}). No caller
// in camicroscope's frontend or distro's config sends object/array-valued
// query params, so a plain object/array reaching here is a Mongo
// query-operator injection attempt, not legitimate input.
//
// Only flags plain objects/arrays, not class instances (ObjectId, Date,
// RegExp, ...) -- handlers like editHandler legitimately rewrite req.query to
// {_id: <ObjectId instance>} server-side before some of these checks run, and
// an ObjectId is `typeof 'object'` but is not something qs could have parsed
// from a query string.
function isSuspiciousValue(value) {
  if (Array.isArray(value)) return true;
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function hasQueryInjection(query) {
  for (const key in query) {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      if (isSuspiciousValue(query[key])) {
        return true;
      }
    }
  }
  return false;
}

module.exports = {hasQueryInjection};

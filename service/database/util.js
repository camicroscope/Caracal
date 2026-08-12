const { ObjectId } = require("mongodb");

/**
 * Utility function to transform id from String format to ObjectId format
 * See attached link for full reference:
 *
 * @description if the query contains a _id property, transforms it to an
 * ObjectId format.
 * @param {Object} query Incoming Query for database operation
 *
 * @link https://docs.mongodb.com/manual/reference/method/ObjectId/
 */
const transformIdToObjectId = (query) => {
  const payload = { ...query };
  try {
    if (payload["_id"]) {
      payload["_id"] = new ObjectId(payload["_id"]);
    }
    return payload;
  } catch (e) {
    return query;
  }
};

module.exports = { transformIdToObjectId };

const { ObjectID } = require("mongodb");

/**
 * Utility function to transform id from String format to ObjectID format
 * See attached link for full reference:
 *
 * @description if the query contains a _id property, transforms it to an
 * ObjectID format.
 * @param {Object} query Incoming Query for database operation
 *
 * @link https://docs.mongodb.com/manual/reference/method/ObjectId/
 */
const transformIdToObjectId = (query) => {
  if (query["_id"]) {
    query["_id"] = new ObjectID(query["_id"]);
  }

  return query;
};

module.exports = { transformIdToObjectId };

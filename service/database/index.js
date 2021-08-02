const {getConnection} = require("./connector");
const {transformIdToObjectId} = require("./util");

/**
 * @class Mongo
 * @description Handles database operations, called via handler. This is like a generic that
 * is used through the project to perform basic operations on the database.
 */
class Mongo {
  /**
   * Runs the MongoDB find() method to fetch documents.
   *
   * @async
   * @param {string} database Name of the database
   * @param {string} collectionName Name of the collection to run operation on
   * @param {document} query Specifies selection filter using query operators.
   * To return all documents in a collection, omit this parameter or pass an empty document ({}).
   * @param {boolean} [transform=false] check to transform the IDs to ObjectID in response
   *
   * {@link https://docs.mongodb.com/manual/reference/method/db.collection.find/ Read MongoDB Reference}
   */
  static async find(database, collectionName, query, transform = true) {
    try {
      query = transformIdToObjectId(query);
      const opt = {};
      if (query.sort) {
        opt.sort = JSON.parse(query.sort);
        delete query.sort;
      }
      if (query.skip) {
        opt.skip = +query.skip;
        delete query.skip;
      }
      if (query.limit) {
        opt.limit = +query.limit;
        delete query.limit;
      }
      if (query._search_) {
        const _search_ = JSON.parse(query._search_);
        for (let key in _search_) {
          if (Object.prototype.hasOwnProperty.call(_search_, key)) {
            opt[_keyobj] = new RegExp(_search_[key], "i");
          }
        }
      }
      const collection = getConnection(database).collection(collectionName);
      const data = await collection.find(query, opt).toArray();

      /** allow caller method to toggle response transformation */
      if (transform) {
        data.forEach((x) => {
          x["_id"] = {
            $oid: x["_id"],
          };
        });
      }

      return data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
  /**
   * Runs the MongoDB count() method to fetch documents.
   *
   * @async
   * @param {string} database Name of the database
   * @param {string} collectionName Name of the collection to run operation on
   * @param {document} query Specifies selection filter using query operators.
   * To return all documents in a collection, omit this parameter or pass an empty document ({}).
   * @param {boolean} [transform=false] check to transform the IDs to ObjectID in response
   *
   * {@link https://docs.mongodb.com/manual/reference/method/db.collection.find/ Read MongoDB Reference}
   */
  static async count(database, collectionName, query) {
    try {
      query = transformIdToObjectId(query);
      const collection = getConnection(database).collection(collectionName);
      const data = await collection.count(query);
      return data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
  /**
   * Runs a distinct find operation based on given query
   *
   * @async
   * @param {string} database Name of the database
   * @param {string} collectionName Name of the collection to run operations on
   * @param {string} upon Field for which to return distinct values.
   * @param {Document} query A query that specifies the documents from
   * which to retrieve the distinct values.
   *
   * {@link https://docs.mongodb.com/manual/reference/method/db.collection.distinct Read MongoDB Reference}
   */
  static async distinct(database, collectionName, upon, query) {
    try {
      const collection = getConnection(database).collection(collectionName);
      const data = await collection.distinct(upon, query);
      return data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   * Runs insertion operation to create an array of new documents
   *
   * @async
   * @param {string} database Name of the database
   * @param {string} collectionName Name of collection to run operation on
   * @param {Array<document>} data Array of documents to insert into collection
   *
   * {@link https://docs.mongodb.com/manual/reference/method/db.collection.insertMany/  Read MongoDB Reference}
   */
  static async add(database, collectionName, data) {
    /** if not an array, transform into array */
    if (!Array.isArray(data)) {
      data = [data];
    }

    try {
      const collection = getConnection(database).collection(collectionName);
      const res = await collection.insertMany(data);
      return res;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   * Runs the deleteOne operation on the first document that satisfies the filter conditions
   *
   * @async
   * @param {string} database Name of the database
   * @param {string} collectionName Name of collection to run operation on
   * @param {document} query Specifies deletion criteria using query operators
   *
   * {@link https://docs.mongodb.com/manual/reference/method/db.collection.deleteOne/ Read MongoDB Reference}
   */
  static async delete(database, collectionName, filter) {
    try {
      filter = transformIdToObjectId(filter);

      const collection = getConnection(database).collection(collectionName);
      const result = await collection.deleteOne(filter);
      delete result.connection;

      return result;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
  /**
   * Runs the deleteOne operation on the first document that satisfies the filter conditions
   *
   * @async
   * @param {string} database Name of the database
   * @param {string} collectionName Name of collection to run operation on
   * @param {document} query Specifies deletion criteria using query operators
   *
   * {@link https://docs.mongodb.com/manual/reference/method/db.collection.deleteMany/ Read MongoDB Reference}
   */
  static async deleteMany(database, collectionName, filter) {
    try {
      filter = transformIdToObjectId(filter);

      const collection = getConnection(database).collection(collectionName);
      const result = await collection.deleteMany(filter);
      delete result.connection;

      return result;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
  /**
   * Runs aggregate operation on given pipeline
   *
   * @async
   * @param {string} database Name of the database
   * @param {string} collectionName Name of collection to run operation on
   * @param {Array} pipeline Array containing all the aggregation framework commands for the execution.
   *
   * {@link https://docs.mongodb.com/manual/reference/method/db.collection.aggregate/ Read MongoDB Reference}
   */
  static async aggregate(database, collectionName, pipeline) {
    try {
      const collection = getConnection(database).collection(collectionName);
      const result = await collection.aggregate(pipeline).toArray();
      return result;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  /**
   * Runs update operation on documents that satisfy the filter condition.
   *
   * @async
   * @param {string} database Name of the database
   * @param {string} collectionName name of collection to run operation on
   * @param {document} filter selection criteria for the update
   * @param {document|pipeline} updates modifications to apply to filtered documents,
   * can be a document or a aggregation pipeline
   *
   * {@link https://docs.mongodb.com/manual/reference/method/db.collection.update Read MongoDB Reference}
   */
  static async update(database, collectionName, filter, updates) {
    try {
      filter = transformIdToObjectId(filter);

      const collection = await getConnection(database).collection(
          collectionName,
      );
      const result = await collection.update(filter, updates);
      delete result.connection;
      return result;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
  static async updateMany(database, collectionName, filter, updates) {
    try {
      filter = transformIdToObjectId(filter);

      const collection = await getConnection(database).collection(
          collectionName,
      );
      const result = await collection.updateMany(filter, updates);
      delete result.connection;
      return result;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}

/** export to be import using the destructuring syntax */
module.exports = {
  count: Mongo.count,
  add: Mongo.add,
  find: Mongo.find,
  update: Mongo.update,
  updateMany: Mongo.updateMany,
  delete: Mongo.delete,
  deleteMany: Mongo.deleteMany,
  aggregate: Mongo.aggregate,
  distinct: Mongo.distinct,
};

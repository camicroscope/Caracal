const { MongoClient } = require("mongodb");

/**
 * @class MongoDBConnector
 * @description This class is the single point configuration place for all
 * operations that relate to the connection of the application with the
 * database server.
 *
 * This class provides the connection objects that are used by database
 * operations throughout the project.
 */
class MongoDBConnector {
  /**
   * @constructor to initialize connection to database server
   */
  constructor() {
    /** connection specifics */
    const connectionString =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
    const databaseName = process.env.MONGO_DB || "camic";
    const url = `${connectionString}/${databaseName}`;

    /** connection configurations */
    const configs = {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    };

    this.name = databaseName;
    this.client = new MongoClient(url, configs);
  }

  /**
   * @async method to initialize the connection and store in application state
   */
  async init() {
    await this.client.connect();
    console.log(`[database:${this.name}] connected`);
    this.db = {};
    this.db[this.name] = this.client.db(this.name);
  }
}

/** initialize an instance of mongoDB connection and kill process if connection fails */
const connector = new MongoDBConnector();

/**
 * to load connection instances in database operations
 * @param {string} [databaseName=camic] Returns a connection to the said database
 */
const getConnection = (databaseName = "camic") => {
  return connector.db[databaseName];
};

/** export the connector to be used by utility functions */
module.exports = {
  getConnection,
  connector,
};


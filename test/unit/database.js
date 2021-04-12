const chai = require("chai");
const {ObjectID} = require("mongodb");
var should = chai.should();

const {getConnection} = require("./../../service/database/connector");
const MongoDB = require("./../../service/database/index");
const Util = require("./../../service/database/util");

/**
 * The services are designed to operate as independent units and therefore by
 * design, must not depend / interfere with the main codebase. This allows
 * development and debugging without touching the application codebase.
 */
const DB = {
  NAME: "camic",
  COLLECTION: "users",
};

/**
 * all tests for service/database
 */
describe("service/database", () => {
  /** wait for connection before initiating tests */
  before(async () => {
    const connection = () =>
      new Promise((resolve) => {
        setTimeout(resolve(true), 1000 * 2);
      });
    await connection();
  });

  /** test suite for connector */
  describe("connector", () => {
    it("should be defined and callable", () => {
      getConnection.should.not.be.undefined;
      (typeof getConnection).should.equal("function");
    });

    it("should return a valid connection when no argument provided", () => {
      const connection = getConnection();
      connection.should.not.be.undefined;
    });

    it("should return a valid connection when database name provided", () => {
      const connection = getConnection("camic");
      connection.should.not.be.undefined;
      connection.serverConfig.should.not.be.undefined;
    });

    it("should inject configuration objects", () => {
      const connection = getConnection("camic");
      connection.serverConfig.s.options.useUnifiedTopology.should.be.true;
    });
  });

  /** test suite for utility functions */
  describe("util", () => {
    it("should be defined and callable", () => {
      Util.should.not.be.undefined;
      Util.transformIdToObjectId.should.not.be.undefined;
      (typeof Util.transformIdToObjectId).should.equal("function");
    });

    it("should not alter argument if property _id not exist", () => {
      const original = {
        something: "awesome",
        repo: "caracal",
        valid: true,
        version: 1,
        string: "F",
      };

      const processed = Util.transformIdToObjectId(original);
      processed.should.eql(processed);
    });

    it("should not alter original object passed into function", () => {
      const original = {
        foo: "bar",
        number: 1,
        _id: "507f1f77bcf86cd799439011",
      };

      const processed = Util.transformIdToObjectId(original);
      (typeof original._id).should.be.equal("string");
      (typeof processed._id).should.be.equal("object");
    });

    it("should alter datatype of property with valid _id", () => {
      const original = {
        foo: "bar",
        number: 1,
        _id: "507f1f77bcf86cd799439011",
      };

      (typeof original._id).should.be.equal("string");
      const processed = Util.transformIdToObjectId(original);
      (typeof processed._id).should.be.equal("object");
    });

    it("should not break if datatype of id not a valid ObjectID", () => {
      const original = {
        foo: "bar",
        number: 1,
        _id: "507f1_invalid_6cd799439011",
      };

      (typeof original._id).should.be.equal("string");
      const processed = Util.transformIdToObjectId(original);
      (typeof processed._id).should.be.equal("string");
    });
  });

  /** test suite for core functionality */
  describe("service", () => {
    /** dummy payload for unit tests */
    const USERS = [
      {
        _id: new ObjectID(),
        name: "user 1",
        age: 20,
        config: {
          foo: "bar",
        },
      },
      {
        _id: new ObjectID(),
        name: "user 2",
        age: 20,
        config: {
          foo: "bar",
        },
      },
    ];

    /** seed values before execution of each unit */
    beforeEach(async () => {
      await getConnection().collection(DB.COLLECTION).insertMany(USERS);
    });

    /** clear database after each unit */
    afterEach(async () => {
      await getConnection().collection(DB.COLLECTION).deleteMany({age: 20});
    });

    /** ensures that service always provides all database functionality */
    it("should be defined and callable", () => {
      MongoDB.should.not.be.undefined;
      (typeof MongoDB).should.be.equal("object");
      (typeof MongoDB.add).should.be.equal("function");
      (typeof MongoDB.aggregate).should.be.equal("function");
      (typeof MongoDB.delete).should.be.equal("function");
      (typeof MongoDB.distinct).should.be.equal("function");
      (typeof MongoDB.find).should.be.equal("function");
      (typeof MongoDB.update).should.be.equal("function");
    });

    describe(".add", () => {
      /** if it's callable, it means it's defined. */
      it("should be callable", () => {
        (typeof MongoDB.add).should.be.equal("function");
      });

      /** normal insert operations for single document */
      it("should insert single document into collection", async () => {
        const user = {
          _id: new ObjectID(),
          name: "testUser1",
          age: 20,
          config: {
            foo: "bar",
          },
        };

        const res = await MongoDB.add(DB.NAME, DB.COLLECTION, user);
        res.insertedCount.should.be.equal(1);
        res.result.n.should.be.equal(1);
      });

      /** should  */
      it("should insert multiple document into collection", async () => {
        const users = [
          {
            _id: new ObjectID(),
            name: "testUser1",
            age: 20,
            config: {
              foo: "bar",
            },
          },
          {
            _id: new ObjectID(),
            name: "testUser2",
            age: 20,
            config: {
              foo: "bar",
            },
          },
        ];

        const res = await MongoDB.add(DB.NAME, DB.COLLECTION, users);
        res.insertedCount.should.be.equal(2);
        res.result.n.should.be.equal(2);
      });
    });

    /**
     * @todo: unit tests for following methods
     * .aggregate()
     * .delete()
     * .find()
     * .update()
     * .distinct()
     */
  });
});

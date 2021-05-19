const chai = require("chai");
const {ObjectID} = require("mongodb");
var should = chai.should();

const {
  getConnection,
  connector,
} = require("./../../service/database/connector");
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
        connector
            .init()
            .then(() => {
              resolve(true);
            })
            .catch(() => {
              console.error("Error connecting to database");
            });
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
      await getConnection()
          .collection(DB.COLLECTION)
          .deleteMany({for: "aggregate"});
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
      it("should be defined and callable", () => {
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
     */
    describe(".delete", () => {
      /** if its callable, means its defined */
      it("should be defined and callable", () => {
        (typeof MongoDB.delete).should.be.equal("function");
      });

      it("should delete a single document by id", async () => {
        const res = await MongoDB.delete(DB.NAME, DB.COLLECTION, {
          _id: USERS[0]._id,
        });
        res.result.ok.should.be.equal(1);
        res.deletedCount.should.be.equal(1);
      });

      it("should only delete one document even if filter matches many", async () => {
        const res = await MongoDB.delete(DB.NAME, DB.COLLECTION, {
          age: 20,
        });
        res.result.ok.should.be.equal(1);
        res.deletedCount.should.be.equal(1);
      });

      it("should not throw error if filter returns empty data", async () => {
        const res = await MongoDB.delete(DB.NAME, DB.COLLECTION, {
          age: 50,
        });
        res.result.ok.should.be.equal(1);
        res.deletedCount.should.be.equal(0);
      });
    });

    describe(".find", () => {
      /** if its callable, means its defined */
      it("should be defined and callable", () => {
        (typeof MongoDB.find).should.be.equal("function");
      });

      it("should list all data when empty filter provided", async () => {
        const result = await MongoDB.find(DB.NAME, DB.COLLECTION, {});
        result.length.should.be.equal(2);
      });

      it("should list all data matching given filter", async () => {
        const result = await MongoDB.find(DB.NAME, DB.COLLECTION, {age: 20});
        result.length.should.be.equal(2);
      });

      it("should list specific document when filtered via unique id", async () => {
        const result = await MongoDB.find(DB.NAME, DB.COLLECTION, {
          _id: USERS[0]._id,
        });
        result.length.should.be.equal(1);
        result[0].name.should.equal(USERS[0].name);
      });

      it("should return empty array if no data matches given filter", async () => {
        const result = await MongoDB.find(DB.NAME, DB.COLLECTION, {age: 21});
        result.length.should.be.equal(0);
      });
    });

    describe(".update", () => {
      it("should be defined and callable", () => {
        (typeof MongoDB.update).should.be.equal("function");
      });

      it("should update a single document even when filter matches multiple items", async () => {
        const res = await MongoDB.update(
            DB.NAME,
            DB.COLLECTION,
            {age: 20},
            {
              $set: {name: "new name"},
            },
        );
        res.modifiedCount.should.equal(1);
        res.matchedCount.should.equal(1);
      });

      it("should not update any document when filters do not match any document", async () => {
        const res = await MongoDB.update(
            DB.NAME,
            DB.COLLECTION,
            {age: 50},
            {
              $set: {name: "new name"},
            },
        );
        res.modifiedCount.should.equal(0);
        res.matchedCount.should.equal(0);
      });
    });

    describe(".distinct", () => {
      it("should be defined and callable", () => {
        (typeof MongoDB.distinct).should.be.equal("function");
      });

      it("should return array of distinct values of passed filter", async () => {
        const res = await MongoDB.distinct(DB.NAME, DB.COLLECTION, "age", {});
        res.length.should.be.equal(1);
        res[0].should.be.equal(20);
      });

      it("should return all elements if none repeated in passed filter", async () => {
        const res = await MongoDB.distinct(DB.NAME, DB.COLLECTION, "name", {});
        res.length.should.be.equal(2);
      });
    });

    describe(".aggregate", () => {
      it("should be defined and callable", () => {
        (typeof MongoDB.aggregate).should.be.equal("function");
      });

      it("should run a function pipeline on data", async () => {
        await MongoDB.add(DB.NAME, DB.COLLECTION, [
          {
            _id: new ObjectID(),
            name: "user 1",
            type: "a",
            by: "bot",
            price: 10,
            for: "aggregate",
          },
          {
            _id: new ObjectID(),
            name: "user 2",
            type: "a",
            by: "bot",
            price: 20,
            for: "aggregate",
          },
          {
            _id: new ObjectID(),
            name: "user 3",
            type: "b",
            by: "human",
            price: 30,
            for: "aggregate",
          },
          {
            _id: new ObjectID(),
            name: "user 4",
            type: "b",
            by: "human",
            price: 40,
            for: "aggregate",
          },
        ]);

        const res = await MongoDB.aggregate(DB.NAME, DB.COLLECTION, [
          {$match: {type: "a"}},
          {$group: {_id: "$by", total: {$sum: "$price"}}},
          {$sort: {total: -1}},
        ]);

        res.length.should.be.equal(1);
        res[0]._id.should.be.equal("bot");
      });
    });
  });
});

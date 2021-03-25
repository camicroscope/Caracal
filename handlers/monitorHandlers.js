const mongo = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost';
// handle monitoring checks

const monitor = {};

monitor.check = function (type) {
  if (type == 'basic') {
    return new Promise(function (res, rej) {
      const checkMsg = { status: 'up', checkType: 'basic' };
      res(checkMsg);
    });
  }
  if (type == 'mongo') {
    return new Promise(function (res, rej) {
      mongo.MongoClient.connect(MONGO_URI, function (err, db) {
        if (err) {
          rej(err);
        } else {
          res({ status: 'up', checkType: 'mongo' });
        }
      });
    });
  }
};

module.exports = monitor;

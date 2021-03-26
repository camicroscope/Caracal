const {getConnection} = require("../service/database/connector");

/**
 * @param {string} type Monitor to check status of database connection
 * @returns {Promise<{status:string, checkType:string}>} status of service
 */
const check = function(type) {
  return new Promise((resolve, reject) => {
    if (type === "basic") {
      resolve({status: "up", checkType: "basic"});
    } else if (type === "mongo") {
      if (getConnection() === undefined) {
        const error = new Error("Error connecting to database");
        reject(error);
      }
      resolve({status: "up", checkType: "mongo"});
    }
  });
};

module.exports = {check};

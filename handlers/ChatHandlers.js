const mongoDB = require("../service/database");
var DISABLE_SEC = (process.env.DISABLE_SEC === 'true') || false;
var ENABLE_SECURITY_AT = (process.env.ENABLE_SECURITY_AT ? process.env.ENABLE_SECURITY_AT : "") || false;

function addMessage(db, collection) {
  return function(req, res, next) {
    const defaultUserEmail = req.tokenInfo ? req.tokenInfo.email : "sample@mail.com"; // sample user when DISABLE_SEC=true
    const messageData = JSON.parse(req.body);
    messageData.from = defaultUserEmail;
    mongoDB.add(db, collection, messageData).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
}

function searchMessages(db, collection) {
  return function(req, res, next) {
    const keyword = req.query.searchKey;
    const roomId = req.query.roomId;
    const searchQuery = { "body": { "$regex": keyword, "$options": "i" }, "roomId": roomId };
    mongoDB.find(db, collection, searchQuery).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
}

const ChatHandlers = {
  addMessage,
  searchMessages,
}

module.exports = ChatHandlers;

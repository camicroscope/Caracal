const mongoDB = require("../service/database");
var DISABLE_SEC = (process.env.DISABLE_SEC === 'true') || false;
var ENABLE_SECURITY_AT = (process.env.ENABLE_SECURITY_AT ? process.env.ENABLE_SECURITY_AT : "") || false;

function permissionHandlerForCollabRooms(permissionList, test=false) {
  return function(req, res, next) {
    if (!test && DISABLE_SEC || ENABLE_SECURITY_AT && Date.parse(ENABLE_SECURITY_AT) > Date.now()) {
      req.permission_ok = true;
      next();
    } else {
      if (req.tokenInfo.email && req.data && permissionList.indexOf(req.data[0].members.find(member => member.email === req.tokenInfo.email).role) >= 0) {
        req.permission_ok = true;
        next();
      } else {
        req.permission_ok = false;
        let errorMessage = {'statusCode': 401};
        errorMessage.error = 'Permission not granted';
        next(errorMessage);
      }
    }
  };
}

function addDefaultCollabRoomOnSlideCreate(db, collection) {
  return function(req, res, next) {
    const defaultUserEmail = req.tokenInfo ? req.tokenInfo.email : "sample@mail.com"; //sample user when DISABLE_SEC=true
    const collabRoomData = {
      createdBy: defaultUserEmail,
      roomId: String(req.data.ops[0]._id),
      slideId: String(req.data.ops[0]._id),
      members: [{
        email: defaultUserEmail,
        role: 'admin',
      }],
      collabStatus: false,
    };
    mongoDB.add(db, collection, collabRoomData).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
}

function removeCollabRoomOnSlideDelete(db, collection) {
  return function(req, res, next) {
    const query = {
      roomId: String(req.query._id),
    }
    mongoDB.delete(db, collection, query).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
}

const CollabRoomHandlers = {
  permissionHandlerForCollabRooms,
  addDefaultCollabRoomOnSlideCreate,
  removeCollabRoomOnSlideDelete,
}

module.exports = CollabRoomHandlers;

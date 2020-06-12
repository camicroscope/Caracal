var mongo = require('mongodb');

var MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost';
var DISABLE_SEC = (process.env.DISABLE_SEC === 'true') || false;


function mongoFind(database, collection, query) {
  return new Promise(function(res, rej) {
    try {
      mongo.MongoClient.connect(MONGO_URI, function(err, db) {
        if (err) {
          rej(err);
        } else {
          if (query['_id']) {
            query['_id'] = new mongo.ObjectID(query['_id']);
          }
          var dbo = db.db(database);
          dbo.collection(collection).find(query).toArray(function(err, result) {
            if (err) {
              rej(err);
            }
            // compatible wiht bindaas odd format
            result.forEach((x) => {
              x['_id'] = {
                '$oid': x['_id'],
              };
            });
            res(result);
            db.close();
          });
        }
      });
    } catch (error) {
      rej(error);
    }
  });
}

function mongoDistinct(database, collection, upon, query) {
  return new Promise(function(res, rej) {
    try {
      mongo.MongoClient.connect(MONGO_URI, function(err, db) {
        if (err) {
          rej(err);
        } else {
          var dbo = db.db(database);
          dbo.collection(collection).distinct(upon, query, function(err, result) {
            if (err) {
              rej(err);
            }
            res(result);
            db.close();
          });
        }
      });
    } catch (error) {
      console.error(error);
      rej(error);
    }
  });
}

function mongoAdd(database, collection, data) {
  return new Promise(function(res, rej) {
    // if data not array, make it one
    if (!Array.isArray(data)) {
      data = [data];
    }
    try {
      mongo.MongoClient.connect(MONGO_URI, function(err, db) {
        if (err) {
          rej(err);
        } else {
          var dbo = db.db(database);
          dbo.collection(collection).insertMany(data, function(err, result) {
            if (err) {
              rej(err);
            }
            res(result);
            db.close();
          });
        }
      });
    } catch (error) {
      console.error(error);
      rej(error);
    }
  });
}

function mongoDelete(database, collection, query) {
  return new Promise(function(res, rej) {
    mongo.MongoClient.connect(MONGO_URI, function(err, db) {
      try {
        if (err) {
          rej(err);
        } else {
          var dbo = db.db(database);
          if (query['_id']) {
            query['_id'] = new mongo.ObjectID(query['_id']);
          }
          dbo.collection(collection).deleteOne(query, function(err, result) {
            if (err) {
              rej(err);
            }
            delete result.connection;
            res(result);
            db.close();
          });
        }
      } catch (error) {
        console.error(error);
        rej(error);
      }
    });
  });
}

function mongoUpdate(database, collection, query, newVals) {
  return new Promise(function(res, rej) {
    try {
      mongo.MongoClient.connect(MONGO_URI, function(err, db) {
        if (err) {
          rej(err);
        } else {
          var dbo = db.db(database);
          if (query['_id']) {
            query['_id'] = new mongo.ObjectID(query['_id']);
          }
          dbo.collection(collection).updateOne(query, newVals, function(err, result) {
            if (err) {
              console.log(err);
              rej(err);
            }
            delete result.connection;
            res(result);
            db.close();
          });
        }
      });
    } catch (error) {
      rej(error);
    }
  });
}

var General = {};
General.find = function(db, collection) {
  return function(req, res, next) {
    var query = req.query;
    delete query.token;
    mongoFind(db, collection, query).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
};

General.get = function(db, collection) {
  return function(req, res, next) {
    var query = req.query;
    delete query.token;
    mongoFind(db, collection, {_id: req.query.id}).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
};

General.distinct = function(db, collection, upon) {
  return function(req, res, next) {
    var query = req.query;
    delete query.token;
    mongoDistinct(db, collection, upon, query).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
};

General.add = function(db, collection) {
  return function(req, res, next) {
    var data = JSON.parse(req.body);
    mongoAdd(db, collection, data).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
};

General.update = function(db, collection) {
  return function(req, res, next) {
    var query = req.query;
    delete query.token;
    var newVals = {
      $set: JSON.parse(req.body),
    };
    mongoUpdate(db, collection, query, newVals).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
};

General.delete = function(db, collection) {
  return function(req, res, next) {
    var query = req.query;
    delete query.token;
    mongoDelete(db, collection, query).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
};

var Slide = {};
Slide.find = function(req, res, next) {
  // slide, specimen, study, location
  var query = req.query;
  delete query.token;
  mongoFind('slide', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Slide.get = function(req, res, next) {
  // slide, specimen, study, location
  mongoFind('slide', {_id: req.query.id}).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Slide.add = function(req, res, next) {
  var data = JSON.parse(req.body);
  mongoAdd('slide', data).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Slide.update = function(req, res, next) {
  var query = req.query;
  delete query.token;
  var newVals = {
    $set: JSON.parse(req.body),
  };
  mongoUpdate('slide', query, newVals).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Slide.delete = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoDelete('slide', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

var Request = {};
Request.find = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoFind('request', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Request.add = function(req, res, next) {
  var data = JSON.parse(req.body);
  mongoAdd('request', data).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Request.delete = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoDelete('request', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};


var Mark = {};
Mark.find = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoFind('mark', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Mark.get = function(req, res, next) {
  // slide, specimen, study, location
  mongoFind('mark', {_id: req.query.id}).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Mark.add = function(req, res, next) {
  var data = JSON.parse(req.body);
  mongoAdd('mark', data).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
Mark.update = function(req, res, next) {
  var query = req.query;
  delete query.token;
  var newVals = {
    $set: JSON.parse(req.body),
  };
  mongoUpdate('mark', query, newVals).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
Mark.delete = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoDelete('mark', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
// special routes
Mark.spatial = function(req, res, next) {
  var query = req.query;
  delete query.token;
  // handle  x0, y0, x1, y1
  if (req.query.x0 && req.query.x1) {
    query.x = {
      $gt: req.query.x0,
      $lt: req.query.x1,
    };
  }
  delete query.x0;
  delete query.x1;
  if (req.query.y0 && req.query.y1) {
    query.y = {
      $gt: req.query.y0,
      $lt: req.query.y1,
    };
  }
  delete query.y0;
  delete query.y1;
  mongoFind('mark', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
Mark.multi = function(req, res, next) {
  var query = req.query;
  if (query.nameList) {
    query['provenance.analysis.execution_id'] = {
      '$in': JSON.parse(query.nameList),
    };
    delete query.nameList;
  }
  delete query.token;
  // handle  x0, y0, x1, y1, footprint
  if (req.query.x0 && req.query.x1) {
    query.x = {
      $gt: req.query.x0,
      $lt: req.query.x1,
    };
  }
  delete query.x0;
  delete query.x1;
  if (req.query.y0 && req.query.y1) {
    query.y = {
      $gt: req.query.y0,
      $lt: req.query.y1,
    };
  }
  delete query.y0;
  delete query.y1;
  if (req.query.footprint) {
    query.footprint = {
      $lt: req.query.footprint,
    };
  }
  mongoFind('mark', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
Mark.types = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoDistinct('mark', 'provenance.analysis', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

var Heatmap = {};
Heatmap.find = function(req, res, next) {
  // slide, name, subject, study
  var query = req.query;
  delete query.token;
  mongoFind('heatmap', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Heatmap.get = function(req, res, next) {
  // slide, specimen, study, location
  mongoFind('heatmap', {_id: req.query.id}).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Heatmap.add = function(req, res, next) {
  var data = JSON.parse(req.body);
  mongoAdd('heatmap', data).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
Heatmap.update = function(req, res, next) {
  var query = req.query;
  delete query.token;
  var newVals = {
    $set: JSON.parse(req.body),
  };
  mongoUpdate('heatmap', query, newVals).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
Heatmap.delete = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoDelete('heatmap', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
Heatmap.types = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoFind('heatmap', query, {
    'data': 0,
  }).then((x) => {
    x.forEach((x)=>delete x.data);
    req.data = x;
    next();
  }).catch((e) => next(e));
};

var HeatmapEdit = {};
HeatmapEdit.find = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoFind('heatmapEdit', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

HeatmapEdit.get = function(req, res, next) {
  mongoFind('heatmapEdit', {_id: req.query.id}).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

HeatmapEdit.add = function(req, res, next) {
  var data = JSON.parse(req.body);
  mongoAdd('heatmapEdit', data).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
HeatmapEdit.update = function(req, res, next) {
  var query = req.query;
  delete query.token;
  var newVals = {
    $set: JSON.parse(req.body),
  };
  mongoUpdate('heatmapEdit', query, newVals).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
HeatmapEdit.delete = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoDelete('heatmapEdit', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

var Template = {};
Template.find = function(req, res, next) {
  // name, type
  var query = req.query;
  delete query.token;
  mongoFind('template', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Template.get = function(req, res, next) {
  // slide, specimen, study, location
  mongoFind('template', {_id: req.query.id}).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Template.add = function(req, res, next) {
  var data = JSON.parse(req.body);
  mongoAdd('template', data).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
Template.update = function(req, res, next) {
  var query = req.query;
  delete query.token;
  var newVals = {
    $set: JSON.parse(req.body),
  };
  mongoUpdate('template', query, newVals).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
Template.delete = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoDelete('template', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

var Log = {};
Log.find = function(req, res, next) {
  // ?? don't know what fields to use
  var query = req.query;
  delete query.token;
  mongoFind('log', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Log.get = function(req, res, next) {
  // slide, specimen, study, location
  mongoFind('log', {_id: req.query.id}).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Log.add = function(req, res, next) {
  var data = JSON.parse(req.body);
  mongoAdd('log', data).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
Log.update = function(req, res, next) {
  var query = req.query;
  delete query.token;
  var newVals = {
    $set: JSON.parse(req.body),
  };
  mongoUpdate('log', query, newVals).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
Log.delete = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoDelete('log', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

var Config = {};
Config.find = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoFind('config', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Config.get = function(req, res, next) {
  // slide, specimen, study, location
  mongoFind('config', {_id: req.query.id}).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Config.add = function(req, res, next) {
  var data = JSON.parse(req.body);
  mongoAdd('config', data).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
Config.update = function(req, res, next) {
  var query = req.query;
  delete query.token;
  var newVals = {
    $set: JSON.parse(req.body),
  };
  mongoUpdate('config', query, newVals).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
Config.delete = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoDelete('config', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

var User = {};
User.find = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoFind('user', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

User.forLogin = function(email) {
  return mongoFind('user', {'email': email});
};

User.get = function(req, res, next) {
  // slide, specimen, study, location
  mongoFind('user', {_id: req.query.id}).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

User.add = function(req, res, next) {
  var data = JSON.parse(req.body);
  mongoAdd('user', data).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
User.update = function(req, res, next) {
  var query = req.query;
  delete query.token;
  var newVals = {
    $set: JSON.parse(req.body),
  };
  mongoUpdate('user', query, newVals).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
User.delete = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoDelete('user', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

User.wcido = function(req, res, next) {
  var userType = req.query.ut;
  var permissions = {
    slide: {post: true, delete: true, update: true},
    heatmap: {post: true, delete: true, update: true},
    heatmapEdit: {post: true, delete: true, update: true},
    user: {post: true, delete: true, update: true},
    config: {post: true, delete: true, update: true},
    mark: {post: true, delete: true, update: true},
    template: {post: true, delete: true, update: true},
    logs: {post: true, delete: true, update: true},
  };
  if (DISABLE_SEC || userType == 'Admin') {
    res.send(permissions);
  } else if (userType == 'Editor') {
    permissions['user'] = {post: false, delete: false, update: false};
    permissions['slide'] = {post: true, delete: false, update: true};
    res.send(permissions);
  } else if (userType == 'Null') {
    for (const key in permissions) {
      if (permissions.hasOwnProperty(key)) {
        permissions[key] = {post: false, delete: false, update: false};
        if (key == 'logs') {
          permissions[key] = {post: true, delete: false, update: false};
        }
      }
    }
    res.send(permissions);
  } else {
    var error = {error: 'undefined UserType'};
    res.send(error);
  }
};

dataHandlers = {};
dataHandlers.Slide = Slide;
dataHandlers.Request = Request;
dataHandlers.Config = Config;
dataHandlers.HeatmapEdit = HeatmapEdit;
dataHandlers.Heatmap = Heatmap;
dataHandlers.Log = Log;
dataHandlers.Mark = Mark;
dataHandlers.Template = Template;
dataHandlers.User = User;
dataHandlers.General = General;
module.exports = dataHandlers;

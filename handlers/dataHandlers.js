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

function mongoAggregate(database, collection, pipeline) {
  return new Promise(function(res, rej) {
    mongo.MongoClient.connect(MONGO_URI, function(err, db) {
      try {
        if (err) {
          rej(err);
        } else {
          var dbo = db.db(database);
          dbo.collection(collection).aggregate(pipeline).toArray(function(err, result) {
            if (err) {
              rej(err);
            }
            // compatible wiht bindaas odd format
            // result.forEach((x) => {
            //   x['_id'] = {
            //     '$oid': x['_id'],
            //   };
            // });
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

var Presetlabels = {};
// add a label
Presetlabels.add = function(req, res, next) {
  var query = req.query;
  delete query.token;
  var labels = JSON.parse(req.body);
  mongoUpdate('camic', 'configuration', {'config_name': 'preset_label'}, {$push: {configuration: labels}}).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

// update a label
Presetlabels.update = function(req, res, next) {
  var query = req.query;
  delete query.token;
  var labels = JSON.parse(req.body);

  // initial data
  var newVals = {
    $set: {
      'configuration.$.id': labels.id,
      'configuration.$.type': labels.type,
      'configuration.$.mode': labels.mode,
      'configuration.$.color': labels.color,
    },
  };

  // $unset/$set size
  if (labels.size) {
    newVals['$set']['configuration.$.size'] = labels.size;
  } else {
    if (!newVals['$unset']) newVals['$unset'] = {};
    newVals['$unset']['configuration.$.size'] = 1;
  }

  // $unset/$set key
  if (labels.key) {
    newVals['$set']['configuration.$.key'] = labels.key;
  } else {
    if (!newVals['$unset']) newVals['$unset'] = {};
    newVals['$unset']['configuration.$.key'] = 1;
  }

  mongoUpdate('camic', 'configuration',
      {
        'config_name': 'preset_label',
        'configuration.id': query.id,
      }, newVals).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

// remove a label by key
Presetlabels.remove = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoUpdate('camic', 'configuration',
      {
        'config_name': 'preset_label',
      }, {$pull: {configuration: {id: query.id}}}).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

var Mark = {};
// special routes
Mark.spatial = function(req, res, next) {
  var query = req.query;
  delete query.token;
  // handle  x0, y0, x1, y1, footprint
  if (req.query.x0 && req.query.x1) {
    query.x = {
      '$gt': parseFloat(req.query.x0),
      '$lt': parseFloat(req.query.x1),
    };
  }
  delete query.x0;
  delete query.x1;
  if (req.query.y0 && req.query.y1) {
    query.y = {
      '$gt': parseFloat(req.query.y0),
      '$lt': parseFloat(req.query.y1),
    };
  }
  delete query.y0;
  delete query.y1;
  if (query.footprint) {
    query.footprint = {
      '$gt': parseFloat(query.footprint),
    };
  }
  mongoFind('camic', 'mark', query).then((x) => {
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
      '$gt': parseFloat(req.query.x0),
      '$lt': parseFloat(req.query.x1),
    };
  }
  delete query.x0;
  delete query.x1;
  if (req.query.y0 && req.query.y1) {
    query.y = {
      '$gt': parseFloat(req.query.y0),
      '$lt': parseFloat(req.query.y1),
    };
  }
  delete query.y0;
  delete query.y1;
  if (query.footprint) {
    query.footprint = {
      '$gt': parseFloat(query.footprint),
    };
  }
  mongoFind('camic', 'mark', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Mark.findMarkTypes = function(req, res, next) {
  var query = req.query;
  if (query.slide) {
    query['provenance.image.slide'] = query.slide;
    delete query.slide;
  }
  if (query.type) {
    query['provenance.analysis.source'] = query.type;
    delete query.type;
  }
  delete query.token;

  if (query['provenance.analysis.source'] == 'human') {
    const pipeline = [
      {
        "$match": query,
      }, {
        "$group": {
          "_id": {
            "creator": "$creator",
            "analysis": "$provenance.analysis",
            "shape": "$geometries.features.geometry.type",
          },
        },
      },
    ];
    mongoAggregate('camic', 'mark', pipeline).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  } else {
    mongoDistinct('camic', 'mark', 'provenance.analysis', query).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  }
};

var Heatmap = {};
Heatmap.types = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoFind('camic', 'heatmap', query, {
    'data': 0,
  }).then((x) => {
    x.forEach((x)=>delete x.data);
    req.data = x;
    next();
  }).catch((e) => next(e));
};

var User = {};

User.forLogin = function(email) {
  return mongoFind('camic', 'user', {'email': email});
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
dataHandlers.Heatmap = Heatmap;
dataHandlers.Mark = Mark;
dataHandlers.User = User;
dataHandlers.Presetlabels = Presetlabels;

dataHandlers.General = General;
module.exports = dataHandlers;

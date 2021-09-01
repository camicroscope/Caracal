
const DISABLE_SEC = (process.env.DISABLE_SEC === 'true') || false;
const mongoDB = require("../service/database");
const fs = require("fs");
const path = require("path");
const {ObjectID} = require("mongodb");
var General = {};

General.find = function(db, collection) {
  return function(req, res, next) {
    var query = req.query;
    mongoDB.find(db, collection, query).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
};
General.count = function(db, collection) {
  return function(req, res, next) {
    var query = req.query;
    mongoDB.count(db, collection, query).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
};
General.get = function(db, collection) {
  return function(req, res, next) {
    var query = req.query;
    delete query.token;
    mongoDB.find(db, collection, {_id: req.query.id}).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
};

General.distinct = function(db, collection, upon) {
  return function(req, res, next) {
    var query = req.query;
    delete query.token;
    mongoDB.distinct(db, collection, upon, query).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
};

General.add = function(db, collection) {
  return function(req, res, next) {
    var data = JSON.parse(req.body);
    mongoDB.add(db, collection, data).then((x) => {
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
    mongoDB.update(db, collection, query, newVals).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
};

General.delete = function(db, collection) {
  return function(req, res, next) {
    var query = req.query;
    delete query.token;
    mongoDB.delete(db, collection, query).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
};
var Slide = {};
Slide.getEvaluations = function(req, res, next) {
  var query = req.query;
  delete query.token;
  const pipeline = [];

  if (query.cid) {
    pipeline.push({"$match": {"collections": query.cid}});
  }
  pipeline.push(
      {"$project": {"sid": {"$toString": "$_id"}, "collections": 1}},
      {"$lookup": {
        "localField": "sid",
        "from": "evaluation",
        "foreignField": "slide_id",
        "as": "eval",
      }},
  );
  const match = {"$match": {"eval.is_draft": false}};
  if (query.uid) {
    match["$match"]["eval.creator"] = query.uid;
  }
  pipeline.push(match);
  // pipeline.push({"$project": {"collections": 1, "eval": {"$size": "$eval"}}});

  //
  console.log('|| ----------------------- getEvaluations start ----------------------- ||');
  console.log(query);
  console.log(pipeline);
  mongoDB.aggregate('camic', 'slide', pipeline).then((x) => {
    req.data = x;
    console.log(x);
    console.log('|| ----------------------- getEvaluations end ----------------------- ||');
    next();
  }).catch((e) => next(e));
};

var SlideInformativeness = {};
SlideInformativeness.find = function(req, res, next) {
  var query = req.query;
  delete query.token;
  const {uid, cid} = query;
  delete query.uid;
  delete query.cid;
  query._id = {uid, cid};
  console.log('|| ----------------------- SlideInformativeness find start ----------------------- ||');
  console.log(query);
  mongoDB.find('camic', 'slideInformativeness', query).then((x) => {
    req.data = x;
    console.log('|| ----------------------- SlideInformativeness find end ----------------------- ||');
    next();
  }).catch((e) => next(e));
};

// rank slide informative in a collection
SlideInformativeness.rank = async function(req, res, next) {
  var query = req.query;
  delete query.token;
  const {cid, uid, sid, level} = JSON.parse(req.body);
  const condition = {_id: {cid, uid}};
  try {
  // check the data is exist
    const data = await mongoDB.find('camic', 'slideInformativeness', condition, false);
    if (data.length > 0) { // update
      updateDoc = data[0];
      if (level==="1") {
        updateDoc.first = sid;
        if (updateDoc.second&&updateDoc.second===sid) updateDoc.second = null;
        if (updateDoc.third&&updateDoc.third===sid) updateDoc.third = null;
        const index = updateDoc.less.indexOf(sid);
        if (index > -1) {
          updateDoc.less.splice(index, 1);
        }
      } else if (level==="2") {
        updateDoc.second = sid;
        if (updateDoc.first&&updateDoc.first===sid) updateDoc.first = null;
        if (updateDoc.third&&updateDoc.third===sid) updateDoc.third = null;
        const index = updateDoc.less.indexOf(sid);
        if (index > -1) {
          updateDoc.less.splice(index, 1);
        }
      } else if (level==="3") {
        updateDoc.third = sid;
        if (updateDoc.first&&updateDoc.first===sid) updateDoc.first = null;
        if (updateDoc.second&&updateDoc.second===sid) updateDoc.second = null;
        const index = updateDoc.less.indexOf(sid);
        if (index > -1) {
          updateDoc.less.splice(index, 1);
        }
      } else if (level==="less") {
        if (updateDoc.first&&updateDoc.first===sid) updateDoc.first = null;
        if (updateDoc.second&&updateDoc.second===sid) updateDoc.second = null;
        if (updateDoc.third&&updateDoc.third===sid) updateDoc.third = null;
        const index = updateDoc.less.indexOf(sid);
        if (index === -1) {
          updateDoc.less.push(sid);
        }
      }
      console.log('|| ----------------------- rank update ----------------------- ||', condition, updateDoc);
      const rs = await mongoDB.update('camic', 'slideInformativeness', condition, updateDoc);
      req.data = rs;
      next();
    } else { // add
      const newDoc = {
        _id: {cid, uid},
        first: null,
        second: null,
        third: null,
        less: [],
      };
      if (level==="1") {
        newDoc.first = sid;
      } else if (level==="2") {
        newDoc.second = sid;
      } else if (level==="3") {
        newDoc.third = sid;
      } else if (level==="less") {
        newDoc.less.push(sid);
      }
      console.log('|| ----------------------- rank add ----------------------- ||', newDoc);
      const rs = await mongoDB.add('camic', 'slideInformativeness', newDoc);
      req.data = rs;
      next();
    }
  } catch (error) {
    console.log('|| ----------------------- rank error ----------------------- ||', error);
    req.data = error;
    next();
  }
};
var Presetlabels = {};
// add a label
Presetlabels.add = function(req, res, next) {
  var query = req.query;
  delete query.token;
  var labels = JSON.parse(req.body);
  mongoDB.update('camic', 'configuration', {'config_name': 'preset_label'}, {$push: {configuration: labels}}).then((x) => {
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

  mongoDB.update('camic', 'configuration',
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
  mongoDB.update('camic', 'configuration',
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
  mongoDB.find('camic', 'mark', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};

Mark.multi = function(req, res, next) {
  var query = {};

  var postQuery = JSON.parse(req.body);

  // handle slideId
  if (postQuery['provenance.image.slide']) {
    query['provenance.image.slide'] = postQuery['provenance.image.slide'];
  }
  // handle source
  if (postQuery.source) {
    query['provenance.analysis.source'] = postQuery.source;
  }

  // handle notes
  if (postQuery.notes) {
    query['properties.annotations.notes'] = postQuery.notes;
  }

  if (postQuery.ids) {
    query['provenance.analysis.execution_id'] = {'$in': postQuery.ids};
  }

  // handle  x0, y0, x1, y1, footprint
  if (postQuery.x0 && postQuery.x1) {
    query.x = {
      '$gt': parseFloat(postQuery.x0),
      '$lt': parseFloat(postQuery.x1),
    };
  }

  if (postQuery.y0 && postQuery.y1) {
    query.y = {
      '$gt': parseFloat(postQuery.y0),
      '$lt': parseFloat(postQuery.y1),
    };
  }

  if (postQuery.footprint) {
    query.footprint = {
      '$gt': parseFloat(postQuery.footprint),
    };
  }
  console.log('|| --------------------- multi start ---------------------- ||');
  console.log(postQuery);
  console.log(query);
  mongoDB.find('camic', 'mark', query).then((x) => {
    req.data = x;
    console.log('|| --------------------- multi end ---------------------- ||');
    next();
  }).catch((e) => next(e));
};
Mark.getSlidesHumanMarkNum = function(req, res, next) {
  var postQuery = JSON.parse(req.body);
  const pipeline = [
    {
      "$match": {
        "provenance.analysis.source": "human",
        "provenance.image.slide": {"$in": postQuery.sids},
      },
    },
    {"$group": {
      _id: "$provenance.image.slide",
      count: {$sum: 1},
    }},
  ];
  console.log('|| ----------------------- getSlidesHumanMarkNum start ----------------------- ||');
  console.log(postQuery);
  console.log(pipeline);
  mongoDB.aggregate('camic', 'mark', pipeline).then((x) => {
    req.data = x;
    console.log(x);
    console.log('|| ----------------------- getSlidesHumanMarkNum start ----------------------- ||');
    next();
  }).catch((e) => next(e));
},
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
    mongoDB.aggregate('camic', 'mark', pipeline).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  } else {
    mongoDB.distinct('camic', 'mark', 'provenance.analysis', query).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  }
};
Mark.updateMarksLabel = function(req, res, next) {
  var query = req.query;
  delete query.token;
  // initial data

  var newVals = {
    $set: {
      'provenance.analysis.name': query.name,
      'properties.annotations.name': query.name,
      'properties.annotations.notes': query.name,
    },
  };
  mongoDB.update('camic', 'mark',
      {
        'provenance.analysis.labelId': query.id,
      }, newVals).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
var Heatmap = {};
Heatmap.types = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoDB.find('camic', 'heatmap', query, {
    'data': 0,
  }).then((x) => {
    x.forEach((x)=>delete x.data);
    req.data = x;
    next();
  }).catch((e) => next(e));
};

var Collection = {};
Collection.deleteMultiCollections = async function(req, res, next) {
  var query = {};
  var update = {};
  var postQuery = JSON.parse(req.body);
  if (postQuery.ids) {
    query['_id'] = {'$in': postQuery.ids.map((id)=>new ObjectID(id))};
    update = {$pullAll: {collections: postQuery.ids}};
  }
  try {
    const [collectionResponse, slideResponse] = await Promise.all([
      mongoDB.deleteMany('camic', 'collection', query),
      mongoDB.updateMany('camic', 'slide', {}, update),
    ]);
    req.data = {collectionResponse, slideResponse};
    next();
  } catch (e) {
    next(e);
  }
};

Collection.addSlidesToCollection = async function(req, res, next) {
  var postQuery = JSON.parse(req.body);
  var collectionQuery = {};
  var collectionUpdate = {};
  var slideQuery = {};
  var slideUpdate = {};

  if (postQuery.cid) {
    collectionQuery = {'_id': new ObjectID(postQuery.cid)};
    slideUpdate = {$addToSet: {collections: postQuery.cid}};
  }

  if (postQuery.sids) {
    slideQuery['_id'] = {'$in': postQuery.sids.map((id)=>new ObjectID(id))};
    collectionUpdate = {$addToSet: {slides: {$each: postQuery.sids}}};
  }
  try {
    const [collectionResponse, slideResponse] = await Promise.all([
      mongoDB.updateMany('camic', 'collection', collectionQuery, collectionUpdate),
      mongoDB.updateMany('camic', 'slide', slideQuery, slideUpdate),
    ]);
    req.data = {collectionResponse, slideResponse};
    next();
  } catch (e) {
    next(e);
  }
};

Collection.removeSlidesFromCollection = async function(req, res, next) {
  var postQuery = JSON.parse(req.body);
  var collectionQuery = {};
  var collectionUpdate = {};
  var slideQuery = {};
  var slideUpdate = {};

  if (postQuery.cid) {
    collectionQuery = {'_id': new ObjectID(postQuery.cid)};
    slideUpdate = {$pull: {collections: postQuery.cid}};
  }

  if (postQuery.sids) {
    slideQuery['_id'] = {'$in': postQuery.sids.map((id)=>new ObjectID(id))};
    collectionUpdate = {$pullAll: {slides: postQuery.sids}};
  }
  try {
    const [collectionResponse, slideResponse] = await Promise.all([
      mongoDB.updateMany('camic', 'collection', collectionQuery, collectionUpdate),
      mongoDB.updateMany('camic', 'slide', slideQuery, slideUpdate),
    ]);
    req.data = {slideResponse, collectionResponse};
    next();
  } catch (e) {
    next(e);
  }
};


var User = {};
User.forLogin = function(email) {
  return mongoDB.find('camic', 'user', {'email': email});
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
var SlideMetadata = {};
SlideMetadata.get = function(req, res, next) {
  const strPath = req.query.path;
  try {
    if (fs.existsSync(strPath)) {
      var ext = path.extname(strPath);
      switch (ext) {
        case '.json':
          fs.readFile(strPath, (err, data) => {
            if (err) throw err;
            res.json(JSON.parse(data));
          });
          break;
        case '.csv':
          fs.readFile(strPath, (err, data) => {
            if (err) throw err;
            const baseName = path.extname(strPath);
            res.header('Content-Type', 'text/csv');
            res.attachment(baseName);
            res.send(data);
          });
          break;
        default:
          console.error(`Metadata format doesn't support.`);
          res.json({hasError: true, error: `Metadata format doesn't support.`});
          break;
      }
    } else {
      console.error(`Metadata file doesn't exsit.`);
      res.json({hasError: true, error: `Metadata file doesn't exsit.`});
    }
  } catch (err) {
    console.error(err);
    res.json({hasError: true, error: err});
  }
};

dataHandlers = {};
dataHandlers.Heatmap = Heatmap;
dataHandlers.Collection = Collection;
dataHandlers.Slide = Slide;
dataHandlers.Mark = Mark;
dataHandlers.User = User;
dataHandlers.Presetlabels = Presetlabels;
dataHandlers.SlideMetadata = SlideMetadata;
dataHandlers.SlideInformativeness = SlideInformativeness;
dataHandlers.General = General;
module.exports = dataHandlers;

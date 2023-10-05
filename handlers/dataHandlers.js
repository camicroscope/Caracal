
const DISABLE_SEC = (process.env.DISABLE_SEC === 'true') || false;
const mongoDB = require("../service/database");
const fs = require("fs");
const path = require("path");
const {ObjectID} = require("mongodb");
const os = require('os');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const AdmZip = require('adm-zip');
var General = {};

General.find = function(db, collection) {
  return function(req, res, next) {
    var query = req.query;
    for (let key in query) {
      if (query[key]=='false' || query[key]=='true') {
        query[key] = query[key] == 'true';
      }
    }
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
    // -- customized code for reading user info from header START -- //
    if (data.creator&&req.headers['x-remote-user']) {
      data.creator = req.headers['x-remote-user'];
    }
    data['create_date'] = new Date();
    // -- customized code for reading user info from header END -- //
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
    // -- customized code for reading user info from header START -- //
    const vals = JSON.parse(req.body);
    if (vals.updater&&req.headers['x-remote-user']) {
      vals.updater = req.headers['x-remote-user'];
    }
    vals['update_date'] = new Date();
    var newVals = {
      $set: vals,
    };
    // -- customized code for reading user info from header END -- //
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
  mongoDB.aggregate('camic', 'slide', pipeline).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};


var SlideInformativeness = {};
SlideInformativeness.find = function(req, res, next) {
  var query = req.query;
  delete query.token;
  mongoDB.find('camic', 'slideInformativeness', query).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
};
SlideInformativeness.removeRank = async function(req, res, next) {
  var query = req.query;
  delete query.token;
  const {cid, creator, sid} = JSON.parse(req.body);
  const condition = {cid};
  if (creator) condition.creator = creator;
  try {
    // check the data is exist
    const data = await mongoDB.find('camic', 'slideInformativeness', condition, false);
    if (data.length > 0) {
      updateDoc = data[0];
      if (updateDoc.first == sid) updateDoc.first = null;
      if (updateDoc.second == sid) updateDoc.second = null;
      if (updateDoc.third == sid) updateDoc.third = null;
      const index = updateDoc.less.indexOf(sid);
      if (index !== -1) {
        updateDoc.less.splice(index, 1);
      }
      // update
      const rs = await mongoDB.update('camic', 'slideInformativeness', condition, updateDoc);
      req.data = rs;
      next();
    } else {
      // add
      req.data = null;
      next();
    }
  } catch (error) {
    req.data = error;
    next();
  }
};
// rank slide informative in a collection
SlideInformativeness.rank = async function(req, res, next) {
  var query = req.query;
  delete query.token;
  const {cid, creator, sid, level} = JSON.parse(req.body);
  const condition = {cid};
  if (creator) condition.creator = creator;
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
        updateDoc.updator = creator;
      }

      const rs = await mongoDB.update('camic', 'slideInformativeness', condition, updateDoc);
      req.data = rs;

      next();
    } else { // add
      const newDoc = {
        cid,
        first: null,
        second: null,
        third: null,
        less: [],
      };
      if (creator) newDoc.creator = creator;
      if (level==="1") {
        newDoc.first = sid;
      } else if (level==="2") {
        newDoc.second = sid;
      } else if (level==="3") {
        newDoc.third = sid;
      } else if (level==="less") {
        newDoc.less.push(sid);
      }
      const rs = await mongoDB.add('camic', 'slideInformativeness', newDoc);
      req.data = rs;
      next();
    }
  } catch (error) {
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

  mongoDB.find('camic', 'mark', query).then((x) => {
    req.data = x;
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
  if (postQuery.uid) pipeline["$match"]["creator"] = postQuery.uid;

  mongoDB.aggregate('camic', 'mark', pipeline).then((x) => {
    req.data = x;
    next();
  }).catch((e) => next(e));
},

Mark.findCurrentUserMarkTypes = function(req, res, next) {
  var query = req.query;
  if (query.creator) {
    query['creator'] = query.creator;
    delete query.creator;
  } else if (req.headers['x-remote-user']) {
    query['creator'] = req.headers['x-remote-user'];
  }
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
Mark.findMarkTypes = function(req, res, next) {
  var query = req.query;
  if (query.creator) {
    query['creator'] = query.creator;
    delete query.creator;
  }
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
  var informativeFilter = {};
  if (postQuery.cid) {
    collectionQuery = {'_id': new ObjectID(postQuery.cid)};
    collectionQuery2 = {'_id': new ObjectID(postQuery.cid), 'users': {'$exists': true}};
    slideUpdate = {$addToSet: {collections: postQuery.cid}};
    informativeFilter = {'cid': postQuery.cid};
  }

  if (postQuery.sids) {
    slideQuery['_id'] = {'$in': postQuery.sids.map((id)=>new ObjectID(id))};
    collectionUpdate = {$addToSet: {slides: {$each: postQuery.sids}}};
    collectionUpdate2 = {$set: {'users.$[].task_status': false}};
  }
  try {
    const [collectionResponse, collectionResponse2, slideResponse, slideInformativeness] = await Promise.all([
      mongoDB.updateMany('camic', 'collection', collectionQuery, collectionUpdate),
      mongoDB.updateMany('camic', 'collection', collectionQuery2, collectionUpdate2),
      mongoDB.updateMany('camic', 'slide', slideQuery, slideUpdate),
      mongoDB.deleteMany('camic', 'slideInformativeness', informativeFilter),
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
    collectionQuery2 = {'_id': new ObjectID(postQuery.cid), 'users': {'$exists': true}};
    slideUpdate = {$pull: {collections: postQuery.cid}};
    informativeFilter = {'cid': postQuery.cid};
  }
  if (postQuery.sids) {
    slideQuery['_id'] = {'$in': postQuery.sids.map((id)=>new ObjectID(id))};
    collectionUpdate = {$pullAll: {slides: postQuery.sids}};
    collectionUpdate2 = {$set: {'users.$[].task_status': false}};
  }
  try {
    const [collectionResponse, collectionResponse2, slideResponse, slideInformativenessResponse] = await Promise.all([
      mongoDB.updateMany('camic', 'collection', collectionQuery, collectionUpdate),
      mongoDB.updateMany('camic', 'collection', collectionQuery2, collectionUpdate2),
      mongoDB.updateMany('camic', 'slide', slideQuery, slideUpdate),
      mongoDB.deleteMany('camic', 'slideInformativeness', informativeFilter),
    ]);
    req.data = {slideResponse, collectionResponse};
    next();
  } catch (e) {
    next(e);
  }
};

Collection.addUsersToCollection = async function(req, res, next) {
  var postQuery = JSON.parse(req.body);
  var query = {};
  var update = {};

  if (postQuery.cid) {
    query = {'_id': new ObjectID(postQuery.cid)};
  }

  if (postQuery.ukeys) {
    const users = postQuery.ukeys.map((ukey) => {
      return {'user': ukey, 'task_status': false};
    });
    update = {$addToSet: {users: {$each: users}}};
  }
  try {
    mongoDB.updateMany('camic', 'collection', query, update).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  } catch (error) {
    next(e);
  }
};

Collection.removeUsersFromCollection = async function(req, res, next) {
  var postQuery = JSON.parse(req.body);
  var query = {};
  var update = {};

  if (postQuery.cid) {
    query = {'_id': new ObjectID(postQuery.cid)};
  }

  if (postQuery.ukeys) {
    update = {$pull: {users: {user: {$in: postQuery.ukeys}}}};
  }
  try {
    mongoDB.updateMany('camic', 'collection', query, update).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  } catch (error) {
    next(e);
  }
};

Collection.getCollectionTaskStatus = function(req, res, next) {
  var query;
  if (req.query.cid) query = {_id: new ObjectID(req.query.cid)};
  if (req.query.sid) query = {slides: req.query.sid};
  if (req.query.ukey) query = {"users.user": req.query.ukey};
  try {
    mongoDB.find('camic', 'collection', query).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  } catch (error) {
    next(e);
  }
};

Collection.setCollectionTaskStatus = function(req, res, next) {
  let status = req.query.status;
  status = (status === 'true');
  var query={};
  if (req.query.cid) query["_id"] = new ObjectID(req.query.cid);
  if (req.query.sid) query["slides"] = req.query.sid;
  if (req.query.ukey) query["users.user"] = req.query.ukey;
  try {
    mongoDB.updateMany('camic', 'collection', query, {'$set': {'users.$.task_status': status}}).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  } catch (error) {
    next(e);
  }
};

var SeerService = {};
SeerService.collectionDataExports = async function(req, res, next) {
  try {
    const params = JSON.parse(req.body);
    // generate user map
    const userCollectionsMap = new Map();
    params.forEach(({id, users})=>{
      users.forEach((u)=>{
        if (!userCollectionsMap.has(u.user)) userCollectionsMap.set(u.user, new Set());
        const collectionIds = userCollectionsMap.get(u.user);
        collectionIds.add(id);
      });
    });
    // create a temp
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `exports_`));
    var zip = new AdmZip();
    for (const [user, collectionIds] of userCollectionsMap.entries()) {
      const {collectionMap, slideMap} = await SeerService.getCollectionsData(Array.from(collectionIds), user);
      // create user dir
      fs.mkdirSync(`${tmpDir}/${user}`);

      slideMap.forEach((data, slideId)=>{
        const {slide, evaluation, marks} = data;
        const locPath = slide.location.split('/'); // TODO
        const wsiFileName = locPath[locPath.length-1];
        // create marks json for slide
        try {
          fs.writeFileSync(`${tmpDir}/${user}/${slide.name}.json`, JSON.stringify(marks));
          console.log(`${tmpDir}/${user}/${slide.name}.json Done writing to file.`);
        } catch (err) {
          console.log(`${tmpDir}/${user}/${slide.name}.json Error writing to file`, err);
        }
        // create slide info
        data.csvData = {
          wsiFileName,
          tokenId: slide.token_id,
          imageId: slide.name,
          tumorSiteCodeAndLabel: '',
          slideQualitySatisfactory: +evaluation.slide_quality,
          tumorPresent: evaluation.tumor_present==undefined?'':+evaluation.tumor_present,
          tumorHistologyAccurate: evaluation.tumor_histology==undefined?'':+evaluation.tumor_histology,
          informativenessYN: evaluation.informativeness==undefined?'':+evaluation.informativeness,
          absoluteInformativeness: evaluation.absolute_informativeness?+evaluation.absolute_informativeness: 0,
          tumorHistologyCorrected: evaluation.comments?evaluation.comments.trim(): '',
          level: evaluation.level? 1:0,

          creator: evaluation.creator,
          tumorROIFilename: `${slide.name}.json`,
          annotatingPathologist: evaluation.creator,
          exportDate: new Date(),
          lastAnnotationDate: new Date(), // TODO
        };
      });

      // create collection csv file
      for (let [collectionId, data] of collectionMap) {
        // create csv
        const csvWriter = createCsvWriter({
          path: `${tmpDir}/${user}/${data.text}.csv`,
          header: [
            {id: 'wsiFileName', title: 'WSI file name'},
            {id: 'tokenId', title: 'Token ID'},
            {id: 'imageId', title: 'Image ID'},
            {id: 'tumorSiteCodeAndLabel', title: 'Tumor Site Code and Label'},
            {id: 'slideQualitySatisfactory', title: 'Slide Quality Satisfactory'},
            {id: 'tumorPresent', title: 'Tumor Present'},
            {id: 'tumorHistologyAccurate', title: 'Tumor Histology Accurate'},
            {id: 'informativenessYN', title: 'Informativeness__YN'},
            {id: 'relativeInformativeness', title: 'Relative Informativeness'},
            {id: 'absoluteInformativeness', title: 'Absolute Informativeness'},
            {id: 'tumorHistologyCorrected', title: 'Tumor Histology Corrected'},
            {id: 'level', title: 'Level'},
            {id: 'tumorROIFilename', title: 'Tumor ROI Filename'},
            {id: 'annotatingPathologist', title: 'Annotating Pathologist'},
            {id: 'exportDate', title: 'Export Date'},
            {id: 'lastAnnotationDate', title: 'Last Annotation Date'},
          ],
        });
        const csvData = [];

        // first?, second?, third?
        const {first, second, third} = data.relativeInformative;

        data.slides.forEach((sid)=>{
          const slideData = slideMap.get(sid);
          // Relative Informativeness need to add
          const tumorPresent = slideData.csvData.tumorPresent;
          if (tumorPresent == 1 && sid == first) {
            slideData.csvData.relativeInformativeness = '1';
          } else if (tumorPresent == 1 && sid == second) {
            slideData.csvData.relativeInformativeness = '2';
          } else if (tumorPresent == 1 && sid == third) {
            slideData.csvData.relativeInformativeness = '3';
          } else {
            slideData.csvData.relativeInformativeness = '';
          }
          csvData.push(slideData.csvData);
        });
        await csvWriter.writeRecords(csvData);
      }
    }
    zip.addLocalFolder(`${tmpDir}`);
    const buffer = zip.toBuffer();


    // this is the code for downloading!
    // here we have to specify 3 things:
    // 1. type of content that we are downloading
    // 2. name of file to be downloaded
    // 3. length or size of the downloaded file!
    const zipName = `seer_data_export_${Date.now()}.zip`;
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename=${zipName}`);
    res.set('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

SeerService.getSlidesEvalAndHumanAnnotCountByCollectionId = async function(req, res, next) {
  const cid = req.query.cid;
  // user
  const creator = req.headers['x-remote-user'];
  try {
    // get slide info
    const collection = await mongoDB.find('camic', 'collection', {_id: new ObjectID(cid)});

    if (collection&&Array.isArray(collection)&&collection[0]) {
      const sids = collection[0].slides;
      // get evaluation infos
      const evaluations = await mongoDB.find(
          'camic',
          'evaluation',
          {
            'creator': creator,
            'slide_id': {'$in': sids},
          },
      );

      // get human annotation counts
      const pipeline = [
        {
          "$match": {
            "creator": creator,
            "provenance.analysis.source": "human",
            "provenance.image.slide": {"$in": sids},
          },
        },
        {"$group": {
          _id: "$provenance.image.slide",
          count: {$sum: 1},
        }},
      ];
      const humanAnnotationCounts = await mongoDB.aggregate('camic', 'mark', pipeline);

      req.data = {evaluations, humanAnnotationCounts};

      next();
    } else {
      req.data = null;
      next();
    }
  } catch (error) {
    next(error);
  }
};

SeerService.getCollectionsData = async function(cids, user) {
  try {
    // get parameter from request
    const collObjectIds = cids.map((cid)=>new ObjectID(cid));
    const collQuery = {'_id': {'$in': collObjectIds}};
    // if (uid) collQuery.creator = uid;

    // get collection data and create collection map
    const collData = await mongoDB.find('camic', 'collection', collQuery, false);
    const collectionMap = new Map();
    collData.forEach((coll)=>{
      collectionMap.set(coll._id.toString(), coll);
    });


    // get all slide id
    const slideIds = Array.from(new Set(collData.map((d)=> d.slides?d.slides:[]).flat()));
    // slide map key is slideId
    const slideMap = new Map();
    slideIds.forEach((sid) => slideMap.set(sid, {slide: null, evaluation: null, marks: []}));

    // get all slide info
    const slideQuery = {'_id': {'$in': slideIds.map((sid)=>new ObjectID(sid))}};
    const slideData = await mongoDB.find('camic', 'slide', slideQuery, false);

    slideData.forEach((slide)=>{
      const sData = slideMap.get(slide._id.toString());
      if (sData) sData.slide = slide;
    });

    // get all evaluation info
    const evalQuery = {'slide_id': {'$in': slideIds}, 'creator': user, 'is_draft': false};
    // if (uid) evalQuery.creator = uid;
    const evalData = await mongoDB.find('camic', 'evaluation', evalQuery, false);

    evalData.forEach((eval)=>{
      const eData = slideMap.get(eval.slide_id);

      eval.evaluation.creator = eval.creator;
      eval.evaluation.level = eval.level;
      if (eData) eData.evaluation = eval.evaluation;
    });
    // get all human annotaions
    const annotQuery = {
      "provenance.analysis.source": "human",
      "provenance.image.slide": {"$in": slideIds},
      "creator": user,
    };

    const annotData = await mongoDB.find('camic', 'mark', annotQuery, false);

    annotData.forEach((mark)=>{
      const mData = slideMap.get(mark.provenance.image.slide);
      if (mData&&mData.marks&&Array.isArray(mData.marks)) mData.marks.push(mark);
    });

    // get status
    const cidQuery = {'cid': {'$in': cids}, "creator": user};
    // if (uid) slideInfoQuery.creator = uid;
    const relativeInformativenessData = await mongoDB.find('camic', 'slideInformativeness', cidQuery, false);

    relativeInformativenessData.forEach((relative)=>{
      const rData = collectionMap.get(relative.cid);

      if (rData) rData.relativeInformative = relative;
    });

    return {collectionMap, slideMap};
  } catch (error) {
    console.error(error);
  }
};

var User = {};
User.forLogin = function(email) {
  return mongoDB.find('camic', 'user', {'email': email});
};

User.getCurrentUser = function(req, res, next) {
  if (req.headers['x-remote-user']) {
    const key = req.headers['x-remote-user'];
    try {
      mongoDB.find('camic', 'user', {'key': key}).then((x) => {
        req.data = x;
        next();
      }).catch((e) => next(e));
    } catch (error) {
      next(error);
    }
  } else {
    res.status(401).send('{"err":"no x-remote-user found in headers"}');
  }
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
// -- customized code for reading user info from header START -- //
function setCreatorAsUserHandler() {
  return function(req, res, next) {
    if (req.headers['x-remote-user']) {
      req.query.creator = req.headers['x-remote-user'];
    } else {
      console.warn('|| ---------- setCreatorAsUserHandler: No "x-remote-user" in request header ----- ||');
    }
    next();
  };
}
function setUpdaterAsUserHandler() {
  return function(req, res, next) {
    if (req.headers['x-remote-user']) {
      req.query.updater = req.headers['x-remote-user'];
    } else {
      console.warn('|| ---------- setUpdaterAsUserHandler: No "x-remote-user" in request header ----- ||');
    }
    next();
  };
}
// -- customized code for reading user info from header END -- //

dataHandlers = {};
dataHandlers.Heatmap = Heatmap;
dataHandlers.Collection = Collection;
dataHandlers.Slide = Slide;
dataHandlers.Mark = Mark;
dataHandlers.User = User;
dataHandlers.Presetlabels = Presetlabels;
dataHandlers.SlideMetadata = SlideMetadata;
dataHandlers.SlideInformativeness = SlideInformativeness;
dataHandlers.SeerService = SeerService;
dataHandlers.General = General;
// -- customized code for reading user info from header START -- //
dataHandlers.setCreatorAsUserHandler = setCreatorAsUserHandler;
dataHandlers.setUpdaterAsUserHandler = setUpdaterAsUserHandler;
// -- customized code for reading user info from header END -- //
module.exports = dataHandlers;

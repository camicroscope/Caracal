const DISABLE_SEC = (process.env.DISABLE_SEC === 'true') || false;
const mongoDB = require("../service/database");
const path = require('node:path');

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

General.findWithRegex = function(db, collection) {
  return function(req, res, next) {
    var query = req.query;
    for (let i in query) {
      if (query.hasOwnProperty(i)) {
        query[i] = new RegExp(query[i], 'i'); // case insensitive search
      }
    }
    mongoDB.find(db, collection, query).then((x) => {
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
Mark.segmentationCountByExecid = async function(req, res, next) {
  var query = req.query;
  delete query.token;

  // handle  x0, y0, x1, y1
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
  try {
    // {"$match": {"provenance.image.slide": {"$in": sids}}},
    const data = await mongoDB.aggregate('camic', 'mark',
        [
          {"$match": query},
          {"$group": {_id: "$provenance.analysis.execution_id", count: {$sum: 1}}},
        ]);
    console.log(data);
    req.data = data;
    next();
  } catch (error) {
    req.data = {error};
    next();
  }
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

var FSChanged = {};

function badPath(path) {
  if (path.includes("..")) return true;
  if (path.includes("/./")) return true;
  if (path.includes("//")) return true;
  if (path.startsWith(".")) return true;
  return false;
}

FSChanged.added = function(db, collection, loader) {
  return function(req, res) {
    var query = req.query;
    if (!query.hasOwnProperty("filepath")) {
      res.send({error: "filepath parameter undefined"});
      return;
    }
    if (query.filepath == '' || query.filepath.endsWith("/") || query.filepath.startsWith("/")) {
      res.send({error: "expected a relative path to an image file"});
      return;
    }
    if (badPath(query.filepath)) {
      res.send({error: "filepath not canonical or invalid"});
      return;
    }

    // If contains any other file from the subfolder, do nothing.
    // otherwise, add it as a new entry.
    // Likewise for single files in the flat images directory.
    var parentDir = path.dirname(query.filepath);

    var identifier;
    if (parentDir == '.') {
      // This is a single file not in any subfolder, and does not have companion files
      identifier = query.filepath;
    } else {
      // This is a file in a subdirectory.
      // caMicroscope design decision: every subdir in the images directory is one image
      // so traverse up if needed.
      do {
        identifier = parentDir;
        parentDir = path.dirname(parentDir);
      } while (parentDir != '.');
    }

    var filepath = query.filepath;
    var name = path.basename(filepath);

    fetch(loader + "/data/one/" + filepath).then((r) => {
      if (!r.ok) {
        res.send({error: "SlideLoader error: perhaps the filepath points to an inexistant file?"});
        return;
      }
      r.json().then((data) => {
        if (data.error) {
          res.send({error: "SlideLoader error: the filepath points to an inexistant file?"});
          return;
        }
        data.name = name;

        mongoDB.find(db, collection).then((slides) => {
          // Here, we can be more fault tolerant and handle the case that despite still being an entry,
          // it was somehow deleted from the filesystem.
          // It may be replaced with any other file in the folder or the user requested path
          // given that we verify that it exists.
          // but that's the purpose of FSChanged.removed
          if (slides.findLast((s) => s["filepath"] && s["filepath"].includes(identifier))) {
            // Success, to allow the client to notify for every new file, even if that won't make a new series.
            res.send({success: "another file from the same subdirectory is already in database"});
            return;
          }
          mongoDB.add(db, collection, data).then(() => {
            res.send({success: "added successfully"});
          }).catch((e) => {
            res.send({error: "mongo failure"});
            console.log(e);
          });
        }).catch((e) => {
          res.send({error: "mongo failure"});
          console.log(e);
        });
      });
    });
  };
};


FSChanged.removed = function(db, collection, loader) {
  return function(req, res) {
    var query = req.query;
    if (!query.hasOwnProperty("filepath")) {
      res.send({error: "filepath parameter undefined"});
      return;
    }
    if (query.filepath == '' || query.filepath.endsWith("/") || query.filepath.startsWith("/")) {
      res.send({error: "expected a relative path to an image file"});
      return;
    }
    if (badPath(query.filepath)) {
      res.send({error: "filepath not canonical or invalid"});
      return;
    }

    (async () => {
      var identifier; // scanning pattern
      var replace; // true: replace entries. false: delete entries.
      var replacer; // MongoDB object

      // check that the file doesn't exist
      try {
        var metadata = await fetch(loader + "/data/one/" + query.filepath);
        metadata = await metadata.json();
      } catch (e) {
        res.send({error: "slideloader failure"});
        console.log(e);
        return;
      }
      if (!metadata.hasOwnProperty("error")) {
        res.send({error: "file " + query.filepath + " still exists"});
        return;
      }

      var parentDir = path.dirname(query.filepath);
      if (parentDir == '.') {
        // file in the top level folder
        // Delete entries with identifier.
        replace = false;
        identifier = query.filepath;
      } else {
        // This is a file in a subdirectory.
        // caMicroscope design decision: every subdir in the images directory is one image
        // so traverse up if needed.
        do {
          identifier = parentDir;
          parentDir = path.dirname(parentDir);
        } while (parentDir != '.');
        var basename = path.basename(query.filepath);
        // get folder contents. Pick any replacements from the array.
        // if no other files in the folder, delete db entries
        try {
          var contents = await fetch(loader + "/data/folder/" + identifier);
          contents = await contents.json();
          contents = contents.contents;
        } catch (e) {
          res.send({error: "slideloader failure"});
          console.log(e);
          return;
        }
        if (contents.length == 0) {
          // Delete DB entries
          replace = false;
        } else {
          // Replace DB entries
          replace = true;
          // TODO: here it would be better to check if this is a folder and if it's a folder
          // use any tree search to find a file and if none check other r.contents entries
          var newFilePath = identifier + '/' + contents[0];
          try {
            replacer = await fetch(loader + "/data/one/" + newFilePath);
            replacer = await replacer.json();
          } catch (e) {
            res.send({error: "slideloader failure"});
            console.log(e);
            return;
          }
          if (replacer.hasOwnProperty("error")) {
            // See the TODO above
            res.send({error: "picked " + newFilePath + " which could not be reader"});
            return;
          }
          replacer = {$set: replacer};
        }
      }

      try {
        var slides = await mongoDB.find(db, collection);
      } catch (e) {
        res.send({error: "mongo failure"});
        console.log(e);
        return;
      }

      if (replace) {
        for (const entry of slides) {
          if (entry["filepath"] && entry["filepath"].includes(identifier)) {
            try {
              replacer.$set.name = entry.name;
              await mongoDB.update(db, collection, {_id: entry._id.$oid}, replacer);
            } catch (e) {
              console.log(e);
            }
          }
        }
        res.send({success: "replaced if any entries were found"});
      } else {
        for (const entry of slides) {
          if (entry["filepath"] && entry["filepath"].includes(identifier)) {
            try {
              await mongoDB.delete(db, collection, {"_id": entry._id.$oid});
            } catch (e) {
              console.log(e);
            }
          }
        }
        res.send({success: "removed entries if any"});
      }
    })();
  };
};

dataHandlers = {};
dataHandlers.Heatmap = Heatmap;
dataHandlers.Mark = Mark;
dataHandlers.User = User;
dataHandlers.Presetlabels = Presetlabels;
dataHandlers.FSChanged = FSChanged;

dataHandlers.General = General;
module.exports = dataHandlers;

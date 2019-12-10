var mongo = require('mongodb');

var MONGO_URI = process.env.MONGO_URI || "mongodb://localhost"
var MONGO_DB = process.env.MONGO_DB || "camic"

function mongoFind(collection, query){
  return new Promise(function(res, rej){
    mongo.MongoClient.connect(MONGO_URI, function(err, db) {
    if (err){
      rej(err)
    } else {
      var dbo = db.db(MONGO_DB);
        dbo.collection(collection).find(query).toArray(function(err, result) {
          if (err){
            rej(err)
          }
          res(result)
          db.close();
        });
      }
    });
  })
}

function mongoGet(collection, id){
  return new Promise(function(res, rej){
    mongo.MongoClient.connect(MONGO_URI, function(err, db) {
    if (err){
      rej(err)
    } else {
      var dbo = db.db(MONGO_DB);
        dbo.collection(collection).find({"_id": id}).toArray(function(err, result) {
          if (err){
            rej(err)
          }
          res(result)
          db.close();
        });
      }
    });
  })
}

function mongoDistinct(collection, upon, query){
  return new Promise(function(res, rej){
    mongo.MongoClient.connect(MONGO_URI, function(err, db) {
    if (err){
      rej(err)
    } else {
      var dbo = db.db(MONGO_DB);
        dbo.collection(collection).distinct(upon, query).toArray(function(err, result) {
          if (err){
            rej(err)
          }
          res(result)
          db.close();
        });
      }
    });
  })
}

function mongoAdd(collection, data){
  return new Promise(function(res, rej){
    mongo.MongoClient.connect(MONGO_URI, function(err, db) {
    if (err){
      rej(err)
    } else {
      var dbo = db.db(MONGO_DB);
        dbo.collection(collection).insertMany(data, function(err, result) {
          if (err){
            rej(err)
          }
          res(result)
          db.close();
        });
      }
    });
  })
}

function mongoDelete(collection, query){
  return new Promise(function(res, rej){
    mongo.MongoClient.connect(MONGO_URI, function(err, db) {
    if (err){
      rej(err)
    } else {
      var dbo = db.db(MONGO_DB);
        dbo.collection(collection).deleteOne(data, function(err, result) {
          if (err){
            rej(err)
          }
          res(result)
          db.close();
        });
    }
    });
  })
}

function mongoUpdate(collection, query, newVals){
  return new Promise(function(res, rej){
    mongo.MongoClient.connect(MONGO_URI, function(err, db) {
    if (err){
      rej(err)
    } else {
      var dbo = db.db(MONGO_DB);
        dbo.collection(collection).updateOne(query, newVals, function(err, result) {
          if (err){
            rej(err)
          }
          res(result)
          db.close();
        });
    }
    });
  })
}


var Slide = {}
Slide.find = function(req, res, next){
  // slide, specimen, study, location
  var query = req.query
  delete query.token
  mongoFind("slide", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Slide.get = function(req, res, next){
  // slide, specimen, study, location
  mongoGet("slide", req.query.id).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Slide.add = function(req, res, next){
  var data = JSON.parse(req.body)
  mongoAdd("slide", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Slide.update = function(req, res, next){
  var query = req.query
  delete query.token
  var newVals = {$set: JSON.parse(req.body)}
  mongoUpdate("slide", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Slide.delete = function(req, res, next){
  var query = req.query
  delete query.token
  mongoDelete("slide", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var Mark = {}
Mark.find = function(req, res, next){
  var query = req.query
  delete query.token
  mongoFind("mark", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Mark.get = function(req, res, next){
  // slide, specimen, study, location
  mongoGet("mark", req.query.id).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Mark.add = function(req, res, next){
  var data = JSON.parse(req.body)
  mongoAdd("mark", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Mark.update = function(req, res, next){
  var query = req.query
  delete query.token
  var newVals = {$set: JSON.parse(req.body)}
  mongoUpdate("mark", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Mark.delete = function(req, res, next){
  var query = req.query
  delete query.token
  mongoDelete("mark", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
// special routes
Mark.spatial = function(req, res, next){
  var query = req.query
  delete query.token
  // handle  x0, y0, x1, y1
  if (req.query.x0 && req.query.x1){
    query.x = {$gt : req.query.x0, $lt : req.query.x1}
  }
  delete query.x0
  delete query.x1
  if (req.query.y0 && req.query.y1){
    query.y = {$gt : req.query.y0, $lt : req.query.y1}
  }
  delete query.y0
  delete query.y1
  mongoFind("mark", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Mark.multi = function(req, res, next){
  var query = req.query
  delete query.token
  // handle  x0, y0, x1, y1, footprint
  if (req.query.x0 && req.query.x1){
    query.x = {$gt : req.query.x0, $lt : req.query.x1}
  }
  delete query.x0
  delete query.x1
  if (req.query.y0 && req.query.y1){
    query.y = {$gt : req.query.y0, $lt : req.query.y1}
  }
  delete query.y0
  delete query.y1
  if (req.query.footprint){
    query.footprint = {$lt : req.query.footprint}
  }

  mongoFind("mark", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Mark.types = function(req, res, next){
  var query = req.query
  delete query.token
  mongoDistinct("mark", "provenance.analysis", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var Heatmap = {}
Heatmap.find = function(req, res, next){
  //slide, name, subject, study
  var query = req.query
  delete query.token
  mongoFind("heatmap", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Heatmap.get = function(req, res, next){
  // slide, specimen, study, location
  mongoGet("heatmap", req.query.id).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Heatmap.add = function(req, res, next){
  var data = JSON.parse(req.body)
  mongoAdd("heatmap", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Heatmap.update = function(req, res, next){
  var query = req.query
  delete query.token
  var newVals = {$set: JSON.parse(req.body)}
  mongoUpdate("heatmap", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Heatmap.delete = function(req, res, next){
  var query = req.query
  delete query.token
  mongoDelete("heatmap", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Heatmap.types = function(req, res, next){
  //slide, name, subject, study
  var query = req.query
  delete query.token
  mongoFind("heatmap", "provenance.analysis", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var HeatmapEdit = {}
HeatmapEdit.find = function(req, res, next){
  //user, slide, name
  var query = req.query
  delete query.token
  mongoFind("heatmapEdit", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

HeatmapEdit.get = function(req, res, next){
  // slide, specimen, study, location
  mongoGet("heatmapEdit", req.query.id).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

HeatmapEdit.add = function(req, res, next){
  var data = JSON.parse(req.body)
  mongoAdd("heatmapEdit", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
HeatmapEdit.update = function(req, res, next){
  var query = req.query
  delete query.token
  var newVals = {$set: JSON.parse(req.body)}
  mongoUpdate("heatmapEdit", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
HeatmapEdit.delete = function(req, res, next){
  var query = req.query
  delete query.token
  mongoDelete("heatmapEdit", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var Template = {}
Template.find = function(req, res, next){
  // name, type
  var query = req.query
  delete query.token
  mongoFind("template", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Template.get = function(req, res, next){
  // slide, specimen, study, location
  mongoGet("template", req.query.id).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Template.add = function(req, res, next){
  var data = JSON.parse(req.body)
  mongoAdd("template", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Template.update = function(req, res, next){
  var query = req.query
  delete query.token
  var newVals = {$set: JSON.parse(req.body)}
  mongoUpdate("template", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Template.delete = function(req, res, next){
  var query = req.query
  delete query.token
  mongoDelete("template", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var Log = {}
Log.find = function(req, res, next){
  // ?? don't know what fields to use
  var query = req.query
  delete query.token
  mongoFind("log", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Log.get = function(req, res, next){
  // slide, specimen, study, location
  mongoGet("log", req.query.id).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Log.add = function(req, res, next){
  var data = JSON.parse(req.body)
  mongoAdd("log", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Log.update = function(req, res, next){
  var query = req.query
  delete query.token
  var newVals = {$set: JSON.parse(req.body)}
  mongoUpdate("log", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Log.delete = function(req, res, next){
  var query = req.query
  delete query.token
  mongoDelete("log", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var Config = {}
Config.find = function(req, res, next){
  var query = req.query
  delete query.token
  mongoFind("config", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Config.get = function(req, res, next){
  // slide, specimen, study, location
  mongoGet("config", req.query.id).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Config.add = function(req, res, next){
  var data = JSON.parse(req.body)
  mongoAdd("config", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Config.update = function(req, res, next){
  var query = req.query
  delete query.token
  var newVals = {$set: JSON.parse(req.body)}
  mongoUpdate("config", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Config.delete = function(req, res, next){
  var query = req.query
  delete query.token
  mongoDelete("config", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var User = {}
User.find = function(req, res, next){
  var query = req.query
  delete query.token
  mongoFind("user", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

User.get = function(req, res, next){
  // slide, specimen, study, location
  mongoGet("user", req.query.id).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

User.add = function(req, res, next){
  var data = JSON.parse(req.body)
  mongoAdd("user", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
User.update = function(req, res, next){
  var query = req.query
  delete query.token
  var newVals = {$set: JSON.parse(req.body)}
  mongoUpdate("user", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
User.delete = function(req, res, next){
  var query = req.query
  delete query.token
  mongoDelete("user", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

dataHandlers = {}
dataHandlers.Slide = Slide
dataHandlers.Config = Config
dataHandlers.HeatmapEdit = HeatmapEdit
dataHandlers.Heatmap = Heatmap
dataHandlers.Log = Log
dataHandlers.Mark = Mark
dataHandlers.Template = Template
dataHandlers.User = User
module.exports = dataHandlers

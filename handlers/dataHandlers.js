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
  var query = {}
  mongoFind("slide", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Slide.add = function(req, res, next){
  var data = [{}]
  mongoAdd("slide", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Slide.update = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
  mongoUpdate("slide", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Slide.delete = function(req, res, next){
  var query = {}
  mongoDelete("slide", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var Mark = {}
Mark.find = function(req, res, next){
  var query = {}
  mongoFind("mark", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Mark.add = function(req, res, next){
  var data = [{}]
  mongoAdd("mark", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Mark.update = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
  mongoUpdate("mark", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Mark.delete = function(req, res, next){
  var query = {}
  mongoDelete("mark", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var Heatmap = {}
Heatmap.find = function(req, res, next){
  var query = {}
  mongoFind("heatmap", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Heatmap.add = function(req, res, next){
  var data = [{}]
  mongoAdd("heatmap", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Heatmap.update = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
  mongoUpdate("heatmap", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Heatmap.delete = function(req, res, next){
  var query = {}
  mongoDelete("heatmap", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var HeatmapEdit = {}
HeatmapEdit.find = function(req, res, next){
  var query = {}
  mongoFind("heatmapEdit", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

HeatmapEdit.add = function(req, res, next){
  var data = [{}]
  mongoAdd("heatmapEdit", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
HeatmapEdit.update = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
  mongoUpdate("heatmapEdit", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
HeatmapEdit.delete = function(req, res, next){
  var query = {}
  mongoDelete("heatmapEdit", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var Template = {}
Template.find = function(req, res, next){
  var query = {}
  mongoFind("template", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Template.add = function(req, res, next){
  var data = [{}]
  mongoAdd("template", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Template.update = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
  mongoUpdate("template", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Template.delete = function(req, res, next){
  var query = {}
  mongoDelete("template", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var Log = {}
Log.find = function(req, res, next){
  var query = {}
  mongoFind("log", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Log.add = function(req, res, next){
  var data = [{}]
  mongoAdd("log", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Log.update = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
  mongoUpdate("log", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Log.delete = function(req, res, next){
  var query = {}
  mongoDelete("log", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var Config = {}
Config.find = function(req, res, next){
  var query = {}
  mongoFind("config", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

Config.add = function(req, res, next){
  var data = [{}]
  mongoAdd("config", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Config.update = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
  mongoUpdate("config", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Config.delete = function(req, res, next){
  var query = {}
  mongoDelete("config", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

var User = {}
User.find = function(req, res, next){
  var query = {}
  mongoFind("user", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}

User.add = function(req, res, next){
  var data = [{}]
  mongoAdd("user", data).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
User.update = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
  mongoUpdate("user", query, newVals).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
User.delete = function(req, res, next){
  var query = {}
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

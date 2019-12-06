var mongo = require('mongodb');

var MONGO_URI = process.env.MONGO_URI || "mongodb://localhost"
var MONGO_DB = process.env.MONGO_DB || "camic"

function mongoFind(collection, query){
  return new Promise(function(res, rej){
    mongo.MongoClient.connect(MONGO_URI, function(err, db) {
    if (err){
      rej(err)
    }
    var dbo = db.db(MONGO_DB);
      dbo.collection(collection).find(query).toArray(function(err, result) {
        if (err){
          rej(err)
        }
        res(result)
        db.close();
      });
    });
  })
}

function mongoAdd(collection, data){
  return new Promise(function(res, rej){
    mongo.MongoClient.connect(MONGO_URI, function(err, db) {
    if (err){
      rej(err)
    }
    var dbo = db.db(MONGO_DB);
      dbo.collection(collection).insertMany(data, function(err, result) {
        if (err){
          rej(err)
        }
        res(result)
        db.close();
      });
    });
  })
}

function mongoDelete(collection, query){
  return new Promise(function(res, rej){
    mongo.MongoClient.connect(MONGO_URI, function(err, db) {
    if (err){
      rej(err)
    }
    var dbo = db.db(MONGO_DB);
      dbo.collection(collection).deleteOne(data, function(err, result) {
        if (err){
          rej(err)
        }
        res(result)
        db.close();
      });
    });
  })
}

function mongoUpdate(collection, query, newVals){
  return new Promise(function(res, rej){
    mongo.MongoClient.connect(MONGO_URI, function(err, db) {
    if (err){
      rej(err)
    }
    var dbo = db.db(MONGO_DB);
      dbo.collection(collection).updateOne(query, newVals, function(err, result) {
        if (err){
          rej(err)
        }
        res(result)
        db.close();
      });
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
  mongoAdd("slide", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Slide.update = function(req, res, next){
  var query = {}
  mongoUpdate("slide", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Slide.delete = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
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
  mongoAdd("mark", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Mark.update = function(req, res, next){
  var query = {}
  mongoUpdate("mark", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Mark.delete = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
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
  mongoAdd("heatmap", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Heatmap.update = function(req, res, next){
  var query = {}
  mongoUpdate("heatmap", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Heatmap.delete = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
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
  mongoAdd("heatmapEdit", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
HeatmapEdit.update = function(req, res, next){
  var query = {}
  mongoUpdate("heatmapEdit", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
HeatmapEdit.delete = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
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
  mongoAdd("template", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Template.update = function(req, res, next){
  var query = {}
  mongoUpdate("template", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Template.delete = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
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
  mongoAdd("log", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Log.update = function(req, res, next){
  var query = {}
  mongoUpdate("log", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Log.delete = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
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
  mongoAdd("config", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Config.update = function(req, res, next){
  var query = {}
  mongoUpdate("config", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
Config.delete = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
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
  mongoAdd("user", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
User.update = function(req, res, next){
  var query = {}
  mongoUpdate("user", query).then(x=>{
    req.data = x
    next()
  }).catch(e=>next(e))
}
User.delete = function(req, res, next){
  var query = {}
  var newVals = {$set: {}}
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

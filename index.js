const express = require('express')

var proxy = require('http-proxy-middleware');
const https = require('https')
var cookieParser = require('cookie-parser')

// handlers
const auth = require("./handlers/authHandlers.js")
const userFunction = require("./handlers/userFunction.js")
const iipHandler = require("./handlers/iipHandler.js")
const permissionHandler = require("./handlers/permssionHandler.js")
const filterHandler = require("./handlers/iipHandler.js")
const dataHandlers = require("./handlers/dataHandlers.js")

var PORT = process.env.PORT || 8010


const app = express();
app.use(cookieParser())

// handle non-json raw body for post
app.use(function(req, res, next) {
  var data = '';
  req.setEncoding(null);
  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {
    req.rawBody = data;
    next();
  });
});

// auth related services
app.get("/auth/check", auth.jwkTokenTrade(auth.CLIENT, auth.PRIKEY, userFunction))
app.get("/auth/renew", auth.tokenTrade(auth.PUBKEY, auth.PRIKEY, userFunction))

// public files, don't use login handler here
app.use(express.static('camicroscope'))

// iip, proxy
app.use("/iip", auth.loginHandler(auth.PUBKEY))
// just for test
// app.use("/iip", permissionHandler(["Admin"]))
app.use("/iip", iipHandler)

// data, mongo
app.use("/data", auth.loginHandler(auth.PUBKEY))
// slide
app.use("/data/slide/find", dataHandlers.Slide.find)
app.use("/data/slide/add", dataHandlers.Slide.add)
app.use("/data/slide/delete", dataHandlers.Slide.delete)
app.use("/data/slide/update", dataHandlers.Slide.update)
// mark
app.use("/data/slide/find", dataHandlers.Mark.find)
app.use("/data/slide/add", dataHandlers.Mark.add)
app.use("/data/slide/delete", dataHandlers.Mark.delete)
app.use("/data/slide/update", dataHandlers.Mark.update)
// template
app.use("/data/template/find", dataHandlers.Template.find)
app.use("/data/template/add", dataHandlers.Template.add)
app.use("/data/template/delete", dataHandlers.Template.delete)
app.use("/data/template/update", dataHandlers.Template.update)
// heatmap
app.use("/data/heatmap/find", dataHandlers.Heatmap.find)
app.use("/data/heatmap/add", dataHandlers.Heatmap.add)
app.use("/data/heatmap/delete", dataHandlers.Heatmap.delete)
app.use("/data/heatmap/update", dataHandlers.Heatmap.update)
// heatmapEdit
app.use("/data/heatmapEdit/find", dataHandlers.HeatmapEdit.find)
app.use("/data/heatmapEdit/add", dataHandlers.HeatmapEdit.add)
app.use("/data/heatmapEdit/delete", dataHandlers.HeatmapEdit.delete)
app.use("/data/heatmapEdit/update", dataHandlers.HeatmapEdit.update)
// log
app.use("/data/log/find", dataHandlers.Log.find)
app.use("/data/log/add", dataHandlers.Log.add)
app.use("/data/log/delete", dataHandlers.Log.delete)
app.use("/data/log/update", dataHandlers.Log.update)
// config
app.use("/data/config/find", dataHandlers.Config.find)
app.use("/data/config/add", dataHandlers.Config.add)
app.use("/data/config/delete", dataHandlers.Config.delete)
app.use("/data/config/update", dataHandlers.Config.update)
// user
app.use("/data/user/find", dataHandlers.User.find)
app.use("/data/user/add", dataHandlers.User.add)
app.use("/data/user/delete", dataHandlers.User.delete)
app.use("/data/user/update", dataHandlers.User.update)


// render mongo returns/data
app.use("/data", function(req, res, next){
  res.send(req.data)
})


app.listen(PORT, () => console.log('listening on ' + PORT))

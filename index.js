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
// render mongo data
app.use("/data", function(req, res, next){
  res.send(req.data)
})


app.listen(PORT, () => console.log('listening on ' + PORT))

const express = require('express');

var proxy = require('http-proxy-middleware');
const https = require('https');
var cookieParser = require('cookie-parser');
var throng = require('throng');

// handlers
const auth = require('./handlers/authHandlers.js');
const userFunction = require('./handlers/userFunction.js');
const iipHandler = require('./handlers/iipHandler.js');
const loaderHandler = require('./handlers/loaderHandler.js');
const permissionHandler = require('./handlers/permssionHandler.js');
const dataHandlers = require('./handlers/dataHandlers.js');
// TODO validation of data

var WORKERS = process.env.NUM_THREADS || 4;

var PORT = process.env.PORT || 4010;


const app = express();
app.use(cookieParser());

// handle non-json raw body for post
app.use(function(req, res, next) {
  var data = '';
  req.setEncoding(null);
  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {
    req.body = data;
    next();
  });
});

// auth related services
app.get('/auth/Token/check', auth.jwkTokenTrade(auth.CLIENT, auth.PRIKEY, userFunction));
app.get('/auth/Token/renew', auth.tokenTrade(auth.PUBKEY, auth.PRIKEY, userFunction));

// public files, don't use login handler here
app.use(express.static('static'));
app.use(express.static('camicroscope'));

// iip, proxy
app.use('/img/IIP/raw/', auth.loginHandler(auth.PUBKEY));
app.use('/img/IIP/raw/', iipHandler);

// loader, proxy
app.use('/loader/', auth.loginHandler(auth.PUBKEY));
app.use('/loader/', permissionHandler(['Admin', 'Editor']));
app.use('/loader/', loaderHandler);

// data, mongo
app.use('/data', auth.loginHandler(auth.PUBKEY));
// slide
app.use('/data/Slide/find', dataHandlers.Slide.find);
app.use('/data/Slide/find', auth.filterHandler('data', 'userFilter', 'filter'));
app.use('/data/Slide/post', permissionHandler(['Admin', 'Editor']));
app.use('/data/Slide/post', dataHandlers.Slide.add);
app.use('/data/Slide/delete', permissionHandler(['Admin', 'Editor']));
app.use('/data/Slide/delete', dataHandlers.Slide.find);
app.use('/data/Slide/delete', auth.editHandler('data', 'userFilter', 'filter'));
app.use('/data/Slide/delete', dataHandlers.Slide.delete);
app.use('/data/Slide/update', permissionHandler(['Admin', 'Editor']));
app.use('/data/Slide/update', dataHandlers.Slide.find);
app.use('/data/Slide/update', auth.editHandler('data', 'userFilter', 'filter'));
app.use('/data/Slide/update', dataHandlers.Slide.update);
// mark
app.use('/data/Mark/find', dataHandlers.Mark.find);
app.use('/data/Mark/spatial', dataHandlers.Mark.spatial);
app.use('/data/Mark/multi', dataHandlers.Mark.multi);
app.use('/data/Mark/types', dataHandlers.Mark.types);
app.use('/data/Mark/post', permissionHandler(['Admin', 'Editor']));
app.use('/data/Mark/post', dataHandlers.Mark.add);
app.use('/data/Mark/delete', permissionHandler(['Admin', 'Editor']));
app.use('/data/Mark/delete', dataHandlers.Mark.delete);
app.use('/data/Mark/update', permissionHandler(['Admin', 'Editor']));
app.use('/data/Mark/update', dataHandlers.Mark.update);
// template
app.use('/data/Template/find', dataHandlers.Template.find);
app.use('/data/Template/post', permissionHandler(['Admin', 'Editor']));
app.use('/data/Template/post', dataHandlers.Template.add);
app.use('/data/Template/delete', permissionHandler(['Admin', 'Editor']));
app.use('/data/Template/delete', dataHandlers.Template.delete);
app.use('/data/Template/update', permissionHandler(['Admin', 'Editor']));
app.use('/data/Template/update', dataHandlers.Template.update);
// heatmap
app.use('/data/Heatmap/find', dataHandlers.Heatmap.find);
app.use('/data/Heatmap/types', dataHandlers.Heatmap.types);
app.use('/data/Heatmap/post', permissionHandler(['Admin', 'Editor']));
app.use('/data/Heatmap/post', dataHandlers.Heatmap.add);
app.use('/data/Heatmap/delete', permissionHandler(['Admin', 'Editor']));
app.use('/data/Heatmap/delete', dataHandlers.Heatmap.delete);
app.use('/data/Heatmap/update', permissionHandler(['Admin', 'Editor']));
app.use('/data/Heatmap/update', dataHandlers.Heatmap.update);
// heatmapEdit
app.use('/data/HeatmapEdit/find', dataHandlers.HeatmapEdit.find);
app.use('/data/HeatmapEdit/post', permissionHandler(['Admin', 'Editor']));
app.use('/data/HeatmapEdit/post', dataHandlers.HeatmapEdit.add);
app.use('/data/HeatmapEdit/delete', permissionHandler(['Admin', 'Editor']));
app.use('/data/HeatmapEdit/delete', dataHandlers.HeatmapEdit.delete);
app.use('/data/HeatmapEdit/update', permissionHandler(['Admin', 'Editor']));
app.use('/data/HeatmapEdit/update', dataHandlers.HeatmapEdit.update);
// log
app.use('/data/Log/find', dataHandlers.Log.find);
// anyone can add a log
app.use('/data/Log/post', dataHandlers.Log.add);
app.use('/data/Log/delete', permissionHandler(['Admin', 'Editor']));
app.use('/data/Log/delete', dataHandlers.Log.delete);
app.use('/data/Log/update', permissionHandler(['Admin', 'Editor']));
app.use('/data/Log/update', dataHandlers.Log.update);
// config
app.use('/data/Configuration/find', dataHandlers.Config.find);
app.use('/data/Configuration/post', permissionHandler(['Admin', 'Editor']));
app.use('/data/Configuration/post', dataHandlers.Config.add);
app.use('/data/Configuration/delete', permissionHandler(['Admin', 'Editor']));
app.use('/data/Configuration/delete', dataHandlers.Config.delete);
app.use('/data/Configuration/update', permissionHandler(['Admin', 'Editor']));
app.use('/data/Configuration/update', dataHandlers.Config.update);
// user
app.use('/data/User/find', dataHandlers.User.find);
app.use('/data/User/post', permissionHandler(['Admin']));
app.use('/data/User/post', dataHandlers.User.add);
app.use('/data/User/delete', permissionHandler(['Admin']));
app.use('/data/user/delete', dataHandlers.User.delete);
app.use('/data/User/update', permissionHandler(['Admin']));
app.use('/data/User/update', dataHandlers.User.update);

// render mongo returns/data
app.use('/data', function(req, res, next) {
  res.json(req.data);
});

// error handler
app.use(function(err, req, res, next) {
  console.error(JSON.stringify(err));
  let statusCode = err.statusCode || 500;
  // wrap strings in a json
  if (typeof err === 'string' || err instanceof String) {
    err = {'error': err};
  }
  res.status(statusCode).json(err);
});

var startApp = function(app) {
  return function() {
    app.listen(PORT, () => console.log('listening on ' + PORT));
  };
};

throng(WORKERS, startApp(app));

module.exports = app; // for tests

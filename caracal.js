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
app.get('/auth/Token/proto', auth.protoTokenExists());


// public files, don't use login handler here
app.use(express.static('static'));
app.use(express.static('camicroscope'));

// iip, proxy
app.use('/img/IIP/raw/', auth.loginHandler(auth.PUBKEY));
app.use('/img/IIP/raw/', iipHandler);

// loader, proxy
app.use('/loader/', auth.loginHandler(auth.PUBKEY));
app.use('/loader/', permissionHandler(['Admin', 'Editor']));
app.use('/loader/slide/delete', permissionHandler(['Admin']));
app.use('/loader/', loaderHandler);

// data, mongo
app.use('/data', auth.loginHandler(auth.PUBKEY));
// slide
app.get('/data/Slide/find', dataHandlers.Slide.find);
app.get('/data/Slide/find', auth.filterHandler('data', 'userFilter', 'filter'));
app.post('/data/Slide/post', permissionHandler(['Admin', 'Editor']));
app.post('/data/Slide/post', dataHandlers.Slide.add);
app.delete('/data/Slide/delete', permissionHandler(['Admin']));
app.delete('/data/Slide/delete', dataHandlers.Slide.find);
app.delete('/data/Slide/delete', auth.editHandler('data', 'userFilter', 'filter'));
app.delete('/data/Slide/delete', dataHandlers.Slide.delete);
app.post('/data/Slide/update', permissionHandler(['Admin', 'Editor']));
app.post('/data/Slide/update', dataHandlers.Slide.find);
app.post('/data/Slide/update', auth.editHandler('data', 'userFilter', 'filter'));
app.post('/data/Slide/update', dataHandlers.Slide.update);
// Requests
app.get('/data/Request/find', permissionHandler(['Editor', 'Admin']));
app.get('/data/Request/find', dataHandlers.Request.find);
app.get('/data/Request/find', auth.filterHandler('data', 'userFilter', 'filter'));
app.post('/data/Request/add', dataHandlers.Request.add);
app.delete('/data/Request/delete', permissionHandler(['Editor', 'Admin']));
app.delete('/data/Request/delete', dataHandlers.Request.find);
app.delete('/data/Request/delete', auth.editHandler('data', 'userFilter', 'filter'));
app.delete('/data/Request/delete', dataHandlers.Request.delete);
// mark
app.get('/data/Mark/find', dataHandlers.Mark.find);
app.get('/data/Mark/spatial', dataHandlers.Mark.spatial);
app.get('/data/Mark/multi', dataHandlers.Mark.multi);
app.get('/data/Mark/types', dataHandlers.Mark.types);
app.post('/data/Mark/post', permissionHandler(['Admin', 'Editor']));
app.post('/data/Mark/post', dataHandlers.Mark.add);
app.delete('/data/Mark/delete', dataHandlers.Mark.find);
app.delete('/data/Mark/delete', auth.editHandler('data'));
app.delete('/data/Mark/delete', permissionHandler(['Admin', 'Editor']));
app.delete('/data/Mark/delete', dataHandlers.Mark.delete);
app.post('/data/Mark/update', dataHandlers.Mark.find);
app.post('/data/Mark/update', auth.editHandler('data'));
app.post('/data/Mark/update', permissionHandler(['Admin', 'Editor']));
app.post('/data/Mark/update', dataHandlers.Mark.update);
// template
app.get('/data/Template/find', dataHandlers.Template.find);
app.post('/data/Template/post', permissionHandler(['Admin', 'Editor']));
app.post('/data/Template/post', dataHandlers.Template.add);
app.delete('/data/Template/delete', permissionHandler(['Admin', 'Editor']));
app.delete('/data/Template/delete', dataHandlers.Template.delete);
app.post('/data/Template/update', permissionHandler(['Admin', 'Editor']));
app.post('/data/Template/update', dataHandlers.Template.update);
// heatmap
app.get('/data/Heatmap/find', dataHandlers.Heatmap.find);
app.get('/data/Heatmap/types', dataHandlers.Heatmap.types);
app.post('/data/Heatmap/post', permissionHandler(['Admin', 'Editor']));
app.post('/data/Heatmap/post', dataHandlers.Heatmap.add);
app.delete('/data/Heatmap/delete', dataHandlers.Heatmap.find);
app.delete('/data/Heatmap/delete', auth.editHandler('data'));
app.delete('/data/Heatmap/delete', permissionHandler(['Admin', 'Editor']));
app.delete('/data/Heatmap/delete', dataHandlers.Heatmap.delete);
app.post('/data/Heatmap/update', dataHandlers.Heatmap.find);
app.post('/data/Heatmap/update', auth.editHandler('data'));
app.post('/data/Heatmap/update', permissionHandler(['Admin', 'Editor']));
app.post('/data/Heatmap/update', dataHandlers.Heatmap.update);
// heatmapEdit
app.get('/data/HeatmapEdit/find', dataHandlers.HeatmapEdit.find);
app.post('/data/HeatmapEdit/post', permissionHandler(['Admin', 'Editor']));
app.post('/data/HeatmapEdit/post', dataHandlers.HeatmapEdit.add);
app.delete('/data/HeatmapEdit/delete', dataHandlers.HeatmapEdit.find);
app.delete('/data/HeatmapEdit/delete', auth.editHandler('data'));
app.delete('/data/HeatmapEdit/delete', permissionHandler(['Admin', 'Editor']));
app.delete('/data/HeatmapEdit/delete', dataHandlers.HeatmapEdit.delete);
app.post('/data/HeatmapEdit/update', dataHandlers.HeatmapEdit.find);
app.post('/data/HeatmapEdit/update', auth.editHandler('data'));
app.post('/data/HeatmapEdit/update', permissionHandler(['Admin', 'Editor']));
app.post('/data/HeatmapEdit/update', dataHandlers.HeatmapEdit.update);
// log
app.get('/data/Log/find', dataHandlers.Log.find);
// anyone can add a log
app.post('/data/Log/post', dataHandlers.Log.add);
app.delete('/data/Log/delete', permissionHandler(['Admin', 'Editor']));
app.delete('/data/Log/delete', dataHandlers.Log.delete);
app.post('/data/Log/update', permissionHandler(['Admin', 'Editor']));
app.post('/data/Log/update', dataHandlers.Log.update);
// config
app.get('/data/Configuration/find', dataHandlers.Config.find);
app.post('/data/Configuration/post', permissionHandler(['Admin', 'Editor']));
app.post('/data/Configuration/post', dataHandlers.Config.add);
app.delete('/data/Configuration/delete', permissionHandler(['Admin', 'Editor']));
app.delete('/data/Configuration/delete', dataHandlers.Config.delete);
app.post('/data/Configuration/update', permissionHandler(['Admin', 'Editor']));
app.post('/data/Configuration/update', dataHandlers.Config.update);
// user
app.get('/data/User/find', dataHandlers.User.find);
app.post('/data/User/post', permissionHandler(['Admin']));
app.post('/data/User/post', dataHandlers.User.add);
app.delete('/data/User/delete', permissionHandler(['Admin']));
app.delete('/data/user/delete', dataHandlers.User.delete);
app.post('/data/User/update', permissionHandler(['Admin']));
app.post('/data/User/update', dataHandlers.User.update);
app.get('/data/User/wcido', dataHandlers.User.wcido);

// render mongo returns/data
app.use('/data', function(req, res, next) {
  if (!req.data) {
    res.status(404).json({});
  }
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

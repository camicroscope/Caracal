const express = require('express');

var proxy = require('http-proxy-middleware');
const https = require('https');
var cookieParser = require('cookie-parser');
var throng = require('throng');
var routeConfig = require("./routes.json");

// handlers
const auth = require('./handlers/authHandlers.js');
const userFunction = require('./handlers/userFunction.js');
const iipHandler = require('./handlers/iipHandler.js');
const proxyHandler = require('./handlers/proxyHandler.js');
const permissionHandler = require('./handlers/permssionHandler.js');
const dataHandlers = require('./handlers/dataHandlers.js');
const sanitizeBody = require('./handlers/sanitizeHandler.js');
const DataSet = require('./handlers/datasetHandler.js');
const Model = require('./handlers/modelTrainer.js');
// TODO validation of data

var WORKERS = process.env.NUM_THREADS || 4;

var PORT = process.env.PORT || 4010;


const app = express();
app.use(cookieParser());


// workbench utilities
app.post('/workbench/uploadDataset', express.json({limit: '100mb'}), DataSet.getDataset);
app.post('/workbench/trainModel', express.json(), Model.trainModel);
app.post('/workbench/deleteUserData', express.json(), DataSet.deleteData);
app.post('/workbench/modelDownload', express.json(), (req, res) => {
  let downloadURL = '/workbench/download/' + req.body.userFolder;
  app.get(downloadURL, (req1, res1) =>
    res1.download('./dataset/' + req.body.userFolder + '/' + req.body.Params.modelName + '.zip'),
  );
  res.json({url: downloadURL});
});


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
app.get('/auth/Token/proto', auth.firstSetupUserSignupExists());

// TODO way to populate this semi-automatically?
var HANDLERS = {
  "loginHandler": function() {
    return auth.loginHandler(auth.PUBKEY);
  },
  "sanitizeBody": function() {
    return sanitizeBody;
  },
  "mongoFind": dataHandlers.General.find,
  "mongoAdd": dataHandlers.General.add,
  "mongoUpdate": dataHandlers.General.update,
  "mongoDelete": dataHandlers.General.delete,
  "mongoDistinct": dataHandlers.General.distinct,
  "filterHandler": auth.filterHandler,
  "permissionHandler": permissionHandler,
  "editHandler": auth.editHandler,
  "proxyHandler": proxyHandler,
  "iipHandler": function() {
    return iipHandler;
  },
  "markMulti": function() {
    return dataHandlers.Mark.multi;
  },
  "markSpatial": function() {
    return dataHandlers.Mark.spatial;
  },
  "heatmapTypes": function() {
    return dataHandlers.Heatmap.types;
  },
  "wcido": function() {
    return dataHandlers.User.wcido;
  },
};

// register configurable services
// TODO verify all
for (let i in routeConfig) {
  if (Object.prototype.hasOwnProperty.call(routeConfig, i)) {
    let rule = routeConfig[i];
    if (!rule.method) {
      console.error('rule number '+ i +' has no "method"');
      process.exit(1);
    }
    if (rule.method == 'static') {
      if (!rule.use) {
        console.error('rule number '+ i +' is static and has no "use"');
        process.exit(1);
      }
      app.use(express.static(rule.use));
    } else {
      for (let j in rule.handlers) {
        if (Object.prototype.hasOwnProperty.call(rule.handlers, j)) {
          let handler = rule.handlers[j];
          if (!rule.route) {
            console.error('rule number '+ i +' has no "route"');
            process.exit(1);
          }
          if (!handler.function) {
            console.error('rule number '+ i +' handler ' + j + ' has no "function"');
            process.exit(1);
          }
          if (! HANDLERS.hasOwnProperty(handler.function)) {
            console.error('handler named "'+ handler.function + '" not found (rule '+ i +' handler ' + j + ')');
            process.exit(1);
          }
          let args = handler.args || [];
          // handler.function needs to be in handlers
          app[rule.method](rule.route, HANDLERS[handler.function](...args));
        }
      }
    }
  }
}

// render mongo returns/data
app.use('/data', function(req, res, next) {
  if (!req.data) {
    res.status(404).json({});
  }
  res.json(req.data);
});

// error handler
app.use(function(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  // wrap strings in a json
  if (typeof err === 'string' || err instanceof String) {
    err = {'error': err};
    console.error(err);
  } else {
    console.error(err.error || err.message || err.toString());
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

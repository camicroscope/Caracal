require('dotenv').config();
const express = require('express');

var proxy = require('http-proxy-middleware');
const https = require('https');
var cookieParser = require('cookie-parser');
var throng = require('throng');
var routeConfig = require("./routes.json");
var cspConfig = require("./contentSecurityPolicy.json");
var helmet = require('helmet');
const fs = require('fs');

// handlers
const auth = require('./handlers/authHandlers.js');
const monitor = require('./handlers/monitorHandlers.js');
const userFunction = require('./handlers/userFunction.js');
const iipHandlers = require('./handlers/iipHandler.js');
const pdbIipHandlers = require('./handlers/pathdbIipHandler.js');
const proxyHandler = require('./handlers/proxyHandler.js');
const permissionHandler = require('./handlers/permssionHandler.js');
const dataHandlers = require('./handlers/dataHandlers.js');
const fileHandlers = require('./handlers/fileHandlers.js');
const sanitizeBody = require('./handlers/sanitizeHandler.js');
const envEcho = require("./handlers/envEcho.js");
const DataTransformationHandler = require('./handlers/dataTransformationHandler.js');


const {connector} = require("./service/database/connector");

var WORKERS = process.env.NUM_THREADS || 4;

var PORT = process.env.PORT || 4010;

var MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost';

var DISABLE_CSP = process.env.DISABLE_CSP || false;

var RUN_INDEXER = process.env.RUN_INDEXER || false;

const app = express();
app.use(cookieParser());

if (!DISABLE_CSP) {
  app.use(helmet.contentSecurityPolicy({
    directives: cspConfig,
  }));
}

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
  "loginWithHeader": auth.loginWithHeader(auth.PRIKEY, userFunction),
  "sanitizeBody": function() {
    return sanitizeBody;
  },
  "monitorCheck": monitor.check,
  "mongoFind": dataHandlers.General.find,
  "mongoPaginatedFind": dataHandlers.General.paginatedFind,
  "mongoFindWithRegex": dataHandlers.General.findWithRegex,
  "mongoAdd": dataHandlers.General.add,
  "mongoUpdate": dataHandlers.General.update,
  "mongoDelete": dataHandlers.General.delete,
  "mongoDistinct": dataHandlers.General.distinct,
  "mongoCount": dataHandlers.General.count,
  "filterHandler": auth.filterHandler,
  "permissionHandler": permissionHandler,
  "editHandler": auth.editHandler,
  "proxyHandler": proxyHandler,
  "envEcho": envEcho,
  "writeFile": fileHandlers.writeFile,
  "iipHandler": function() {
    return iipHandlers.iipHandler;
  },
  "preIip": function() {
    return iipHandlers.preIip;
  },
  "iipCheck": function() {
    return pdbIipHandlers.iipCheck;
  },
  "markMulti": function() {
    return dataHandlers.Mark.multi;
  },
  "markSpatial": function() {
    return dataHandlers.Mark.spatial;
  },
  "markSegmentationCount": function() {
    return dataHandlers.Mark.segmentationCountByExecid;
  },
  "findMarkTypes": function() {
    return dataHandlers.Mark.findMarkTypes;
  },
  "updateMarksLabel": function() {
    return dataHandlers.Mark.updateMarksLabel;
  },
  "heatmapTypes": function() {
    return dataHandlers.Heatmap.types;
  },
  "wcido": function() {
    return dataHandlers.User.wcido;
  },
  "addPresetlabels": function() {
    return dataHandlers.Presetlabels.add;
  },
  "updatePresetlabels": function() {
    return dataHandlers.Presetlabels.update;
  },
  "removePresetlabels": function() {
    return dataHandlers.Presetlabels.remove;
  },
  "addedFileToFS": dataHandlers.FSChanged.added,
  "removedFileFromFS": dataHandlers.FSChanged.removed,
};

// TODO! -- remove these by fully depreciating tfjs serverside
function disabledRoute() {
  return function(req, res) {
    res.status(500).send('{"err":"This TF route is disabled"}');
  };
}
HANDLERS["getDataset"] = disabledRoute;
HANDLERS["trainModel"] = disabledRoute;
HANDLERS["deleteDataset"] = disabledRoute;
HANDLERS["sendTrainedModel"] = disabledRoute;

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

function startApp(app) {
  // Prepare for SSL/HTTPS
  var httpsOptions = {};
  try {
    var sslPkPath = "./ssl/privatekey.pem";
    var sslCertPath = "./ssl/certificate.pem";
    if (fs.existsSync(sslPkPath) && fs.existsSync(sslCertPath)) {
      console.info("Starting in HTTPS Mode mode");
      httpsOptions.key = fs.readFileSync(sslPkPath, 'utf8');
      httpsOptions.cert = fs.readFileSync(sslCertPath, 'utf8');
    }
  } catch (err) {
    console.error(err);
  }
  if (httpsOptions.key && httpsOptions.cert) {
    https.createServer(httpsOptions, app).listen(PORT, () => console.log('listening HTTPS on ' + PORT));
  } else {
    app.listen(PORT, () => console.log('listening on ' + PORT));
  }
};

// call this only once no matter what
function masterHandler() {
  connector.init().then(() => {
    const handler = new DataTransformationHandler(MONGO_URI, './json/configuration.json');
    handler.startHandler();
  }).then(()=>{
    if (RUN_INDEXER) {
      const indexer = require('./idx_mongo.js');
      try {
        indexer.collections();
        indexer.indexes();
        indexer.defaults();
        console.log("added indexes");
      } catch (e) {
        console.log("error in indexer, ", e);
      }
    }
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
// for each worker
function workerHandler() {
  connector.init().then(() => {
    const handler = new DataTransformationHandler(MONGO_URI, './json/configuration.json');
    handler.startHandler();
  }).then(()=>{
    startApp(app);
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

throng({master: masterHandler, start: workerHandler, count: WORKERS});

module.exports = app; // for tests

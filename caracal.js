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
const iipHandler = require('./handlers/iipHandler.js');
const proxyHandler = require('./handlers/proxyHandler.js');
const permissionHandler = require('./handlers/permssionHandler.js');
const dataHandlers = require('./handlers/dataHandlers.js');
const sanitizeBody = require('./handlers/sanitizeHandler.js');
const DataTransformationHandler = require('./handlers/dataTransformationHandler.js');

const mongoDB = require('./service/database');
const nodemailer = require('nodemailer');
const Agenda = require("agenda");

const {generateTableBody} = require("./service/database/util");

// TODO -- make optional
const DISABLE_TF = true; // DUE TO PRODUCTION STABILITY ISSUES WITH TFJS

if (!DISABLE_TF) {
  const DataSet = require('./handlers/datasetHandler.js');
  const Model = require('./handlers/modelTrainer.js');
}

const {connector} = require("./service/database/connector");

var WORKERS = process.env.NUM_THREADS || 4;

var PORT = process.env.PORT || 4010;

var MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost';

var DISABLE_CSP = process.env.DISABLE_CSP || false;

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
  "sanitizeBody": function() {
    return sanitizeBody;
  },
  "monitorCheck": monitor.check,
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
  "findLabelingStat": function() {
    return dataHandlers.Slide.findLabelingStat;
  },
  "markMulti": function() {
    return dataHandlers.Mark.multi;
  },
  "markSpatial": function() {
    return dataHandlers.Mark.spatial;
  },
  "countLabelingBySlide": function() {
    return dataHandlers.Slide.countLabeling;
  },
  "findMarkTypes": function() {
    return dataHandlers.Mark.findMarkTypes;
  },
  "updateMarksLabel": function() {
    return dataHandlers.Mark.updateMarksLabel;
  },
  "labelingPushAnnotation": function() {
    return dataHandlers.Labeling.pushAnnotation;
  },
  "labelingPullAnnotation": function() {
    return dataHandlers.Labeling.pullAnnotation;
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
  "advancedFindLabelingAnnotation": function() {
    return dataHandlers.LabelingAnnotation.advancedFind;
  },
  "findByTypeOrCreator": function() {
    return dataHandlers.LabelingAnnotation.findByTypeOrCreator;
  },
};

if (!DISABLE_TF) {
  HANDLERS["getDataset"] = DataSet.getDataset;
  HANDLERS["trainModel"] = Model.trainModel;
  HANDLERS["deleteDataset"] = DataSet.deleteData;
  HANDLERS["sendTrainedModel"] = Model.sendTrainedModel;
} else {
  function disabledRoute() {
    return function(req, res) {
      res.status(500).send('{"err":"This TF route is disabled"}');
    };
  }
  HANDLERS["getDataset"] = disabledRoute;
  HANDLERS["trainModel"] = disabledRoute;
  HANDLERS["deleteDataset"] = disabledRoute;
  HANDLERS["sendTrainedModel"] = disabledRoute;
}

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
};

throng(WORKERS, startApp(app));

/** initialize DataTransformationHandler only after database is ready */
connector.init().then(() => {
  const handler = new DataTransformationHandler(MONGO_URI, './json/configuration.json');
  handler.startHandler();
}).catch((e) => {
  console.error("error connecting to database");
  process.exit(1);
});

async function sendEmail(transportOption, contextOption) {
  var transporter = nodemailer.createTransport(transportOption);
  await transporter.sendMail(contextOption, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email Sent: ' + info.response);
    }
  });
}

// agenda test start
const mongoConnectionString = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
var agenda = new Agenda({db: {address: `${mongoConnectionString}/camic`, collection: 'agendaJobs'}});

agenda.on( "ready", async function() {
  await agenda.start();
  console.log("Agenda Start ... ");
  await agenda.every("00 00 * * 6", "send email report");
  console.log(`Agenda Every: ${'00 00 * * 6'} send email report... `);
  // await agenda.every("5 minutes", "send email report");
});

agenda.define(
    "send email report",
    async (job) => {
      console.log('Agenda Job Start ...');
      // get email option
      const emailOption = await mongoDB.find('camic', 'configuration', {config_name: 'email_option'});
      if (emailOption&&
        Array.isArray(emailOption)&&
        emailOption[0]&&
        emailOption[0].configuration.transport_option&&
        emailOption[0].configuration.context_option) {
        // get email option
        const transportOption = emailOption[0].configuration.transport_option;
        const contextOption = emailOption[0].configuration.context_option;

        // get current date and start date (a week before current date)
        var currentDate = new Date();
        var timestamp = currentDate.valueOf();
        var startDate = new Date(timestamp - 7*24*3600*1000);
        // get all annotations
        const labelingAnnotations = await mongoDB.find('camic', 'labelingAnnotation', {create_date: {
          '$gte': startDate,
          '$lt': currentDate,
        }}, false);

        const html = generateEmail(startDate, currentDate, labelingAnnotations);
        contextOption.subject = `Label Annotaions Summary ${startDate.toLocaleString()} - ${currentDate.toLocaleString()}`;
        contextOption.html = html;
        await sendEmail(transportOption, contextOption);
      } else {
        console.log('|| ----------------- no email option ---------------- ||');
      }
      console.log('Agenda Job End ...');
    },
);

function generateEmail(firstDay, lastDay, labelingAnnotations) {
  return `<h2>Label Annotaions: ${firstDay.toLocaleString()} - ${lastDay.toLocaleString()}</h2>
  <table style="width:100%;border-collapse:collapse;">
    <thead><tr>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>ID</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>Slide Name</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>X</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>Y</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>Width</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>Height</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>Annotation Type</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>Annotation Percent Stroma</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>Annotation TIL Density</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>Alias</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>View Width</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>View Height</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>View Magnification Level</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>Creator</th>
      <th style='border: 1px solid #ddd;padding: 8px; font-weight: bold;'>Create Date Time</th>
      </tr></thead>
  ${generateTableBody(labelingAnnotations)}
  </table>
  <p><strong>Total Annotations:</strong> ${labelingAnnotations.length}</p>`;
}

module.exports = app; // for tests

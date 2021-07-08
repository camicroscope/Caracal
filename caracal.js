/* eslint-disable object-shorthand */
/* eslint-disable func-names */
/**
 * object-shorthand and func-names is disabled because arrow functions (preferred by eslint) and
 * traditional functions are not the same. The main difference comes from the fact that arrow
 * functions lexically.
 *
 * Therefore before due testing, it is not safe to migrate to shorthands with arrow functions.
 *
 * @link https://dmitripavlutin.com/differences-between-arrow-and-regular-functions/
 */

/** load environment variables */
require('dotenv').config();

/**
 * NodeJS Modules
 */
const https = require('https');
const fs = require('fs');

/**
 * NPM Modules
 *
 * @todo: proxy configuraiton
 */
const throng = require('throng');
const helmet = require('helmet');
const express = require('express');
// const proxy = require('http-proxy-middleware');
const cookieParser = require('cookie-parser');

/**
 * Route Mappings and Content Security Policy
 */
const cspConfig = require('./contentSecurityPolicy.json');
const routeConfig = require('./routes.json');

/**
 * Certificate path configurations
 */
const sslPath = {
  privateKey: './ssl/privatekey.pem',
  certificate: './ssl/certificate.pem',
};

/**
 * Application Handlers
 *
 * permissionHandlers => to be elimiated as RBAC is implemented
 */
const auth = require('./handlers/authHandlers');
const monitor = require('./handlers/monitorHandlers');
const userFunction = require('./handlers/userFunction');
const iipHandler = require('./handlers/iipHandler');
const proxyHandler = require('./handlers/proxyHandler');
// const permissionHandler = require('./handlers/permssionHandler');
const dataHandlers = require('./handlers/dataHandlers');
const sanitizeBody = require('./handlers/sanitizeHandler');
const DataSet = require('./handlers/datasetHandler');
const Model = require('./handlers/modelTrainer');
const DataTransformationHandler = require('./handlers/dataTransformationHandler');

/**
 * Application Services
 */
const { connector } = require('./service/database/connector');
const { roleStatusCheck } = require('./service/roles/definitions');
const { RouteProcessor } = require('./service/roles/middleware');

/**
 * Application Constants based on environment
 *
 * PORT => to listen for HTTP requests
 * WORKERS => Number of workers / instances of application that are launched
 * MONGO_URI => connection string for mongodb database
 * DISABLE_CSP => true to disable content security policy
 */
const PORT = process.env.PORT || 4010;
const WORKERS = process.env.NUM_THREADS || 1;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost';
const DISABLE_CSP = process.env.DISABLE_CSP || false;

/** express.js configurations */
const app = express();
app.use(cookieParser());

if (!DISABLE_CSP) {
  app.use(
    helmet.contentSecurityPolicy({
      directives: cspConfig,
    }),
  );
}

/** parse binary data into request.body */
app.use((req, res, next) => {
  let data = '';
  req.setEncoding(null);
  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', () => {
    req.body = data;
    next();
  });
});

/** routes for authentication */
app.get(
  '/auth/Token/check',
  auth.jwkTokenTrade(auth.CLIENT, auth.PRIKEY, userFunction),
);
app.get(
  '/auth/Token/renew',
  auth.tokenTrade(auth.PUBKEY, auth.PRIKEY, userFunction),
);
app.get('/auth/Token/proto', auth.firstSetupUserSignupExists());

/**
 * Linking all handlers to bind to the application at runtime
 *
 * @todo : populate these semi-automatically
 */
const HANDLERS = {
  monitorCheck: monitor.check,
  mongoFind: dataHandlers.General.find,
  mongoAdd: dataHandlers.General.add,
  mongoUpdate: dataHandlers.General.update,
  mongoDelete: dataHandlers.General.delete,
  mongoDistinct: dataHandlers.General.distinct,
  filterHandler: auth.filterHandler,
  editHandler: auth.editHandler,
  getDataset: DataSet.getDataset,
  trainModel: Model.trainModel,
  deleteDataset: DataSet.deleteData,
  sendTrainedModel: Model.sendTrainedModel,
  proxyHandler,
  loginHandler: function () {
    return auth.loginHandler(auth.PUBKEY);
  },
  sanitizeBody: function () {
    return sanitizeBody;
  },
  iipHandler: function () {
    return iipHandler;
  },
  markMulti: function () {
    return dataHandlers.Mark.multi;
  },
  markSpatial: function () {
    return dataHandlers.Mark.spatial;
  },
  findMarkTypes: function () {
    return dataHandlers.Mark.findMarkTypes;
  },
  heatmapTypes: function () {
    return dataHandlers.Heatmap.types;
  },
  wcido: function () {
    return dataHandlers.User.wcido;
  },
  addPresetlabels: function () {
    return dataHandlers.Presetlabels.add;
  },
  updatePresetlabels: function () {
    return dataHandlers.Presetlabels.update;
  },
  removePresetlabels: function () {
    return dataHandlers.Presetlabels.remove;
  },
};

/**
 * Bind routes.json configuration to application at rumtime.
 *
 * there is no need to check for validity of routes.json during runtine because
 * a dedicated service is written to validate and test the route configurations.
 *
 * It is run at built time (of container) and therefore addiitonal checks to ensure
 * that all required fields are specified are no longer needed.
 */
Object.keys(routeConfig).forEach((index) => {
  const rule = routeConfig[index];

  /** to add directory as a static location to be directly served */
  if (rule.method === 'static') {
    app.use(express.static(rule.use));
    return;
  }

  /** to link a function / middleware to the application */
  Object.keys(rule.handlers).forEach((handlerIndex) => {
    if (Object.prototype.hasOwnProperty.call(rule.handlers, handlerIndex)) {
      const handler = rule.handlers[handlerIndex];
      const args = handler.args || [];

      if (typeof HANDLERS[handler.function] !== 'function') {
        console.error(handler);
      }

      /** register a route with handler and arguments dynamically */
      app[rule.method](rule.route, HANDLERS[handler.function](...args));
    } else {
      console.error(handlerIndex);
    }
  });
});

/** route to test data exchange */
app.use('/data', (req, res) => {
  if (!req.data) {
    return res.status(404).json({});
  }
  return res.json(req.data);
});

app.use(RouteProcessor);

/** sending error response if application fails */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`Last layer reached, code ${statusCode}`);
  let errorResponse = err;

  if (typeof err === 'string') {
    errorResponse = { error: err };
    console.log(`error : ${errorResponse}`);
    return res.status(statusCode).json(errorResponse);
  }

  console.error(err.error || err.message || err.toString());
  return res.status(statusCode).json({ err, code: statusCode });
});

/**
 * export application to be consumed in two modules.
 * - tests
 * - server.js to launch a cluster
 */
module.exports = app;

/**
 * Bootstraps an application that is launched via throng / process manager
 * @param {Application} app instance of express application
 * @returns void
 */
const startApp = (application) => () => {
  const httpsOptions = {};
  try {
    const sslPkPath = sslPath.privateKey;
    const sslCertPath = sslPkPath.publicKey;

    if (fs.existsSync(sslPkPath) && fs.existsSync(sslCertPath)) {
      console.info('Starting in HTTPS Mode mode');
      httpsOptions.key = fs.readFileSync(sslPkPath, 'utf8');
      httpsOptions.cert = fs.readFileSync(sslCertPath, 'utf8');
    }
  } catch (err) {
    console.error('Error adding ssl certificates');
    console.error(err);
  }

  /** if https ready, launch with ssl, else without */
  if (httpsOptions.key && httpsOptions.cert) {
    https
      .createServer(httpsOptions, application)
      .listen(PORT, () => console.log(`listening HTTPS on ${PORT}`));
  } else {
    application.listen(PORT, () => console.log(`listening HTTP on ${PORT}`));
  }
};

/** launch the application as multiple workers */
throng(WORKERS, startApp(app));

/** initialize DataTransformationHandler only after database is ready */
connector
  .init()
  .then(() => {
    const handler = new DataTransformationHandler(
      MONGO_URI,
      './json/configuration.json',
    );

    /** display the status of roles and print out all role configurations */
    roleStatusCheck();
    handler.startHandler();
  })
  .catch((e) => {
    console.error('error connecting to database');
    console.error(e);
    process.exit(1);
  });

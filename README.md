<h2 align="center">
  <a href="http://camicroscope.org/"><img src="https://avatars2.githubusercontent.com/u/12075069?s=400&v=4" style="background-color:rgba(0,0,0,0);" height=230 alt="camicroscope: a web-based image viewer optimized for large bio-medical image data viewing"></a>
</h2>

# Caracal

Conslidated Attribute Registry, Access Control, and Loader proxy

## routes
The routes.json sets up each route functionally as a list, executed on startup in order.
Static routes simply describe folders to host statically, and require "method" set to static and "use" to the folder to host.
Other routes require method to be set to the required supported http method (e.g. get, post), the route prefix as "route", and a list of "handlers"
Each handler should have args set to the initialization arguments for the handler, and "function" set to the handler's registered name.

Routes are setup in this method primarily so that caMicroscope deployments can be customized, but this means that caracal can be used for entirely different projects.

## Handlers
Handlers are the specific functions designed for use by routes. They should have pattern `handler(...args) = function(req, res, next)`

## Environment variables Used
All possible configuration variables are listed in `.env.example`. Renaming the file to `.env`  will inject all the environment variables.

|variable | Description | default |
|---|---|---|
| WORKERS | number of child processes | 4 |
|JWK_URL | jwks url for id provider | (*required*) |
|PORT | the port to use | 4010 |
|AUD | jwt audience to accept | (if unset, does not check)|
|ISS | jwt issuer to accept |(if unset, does not check)|
|EXPIRY | expire in time for jwks| 1d |
|DISABLE_SEC | set truthy to disable permission and login handlers | false |
|DISABLE_CSP | set truthy to disable content security policy headers | false |
|ALLOW_PUBLIC | set truthy to allow public users | false |
|IIP_PATH | IIP server location | http://ca-iip |
|MONGO_URI | mongo connection uri | mongodb://localhost |
|MONGO_DB | mongo db to use, default camic |
|RUN_INDEXER | add indexes and defaults for mongo, default true |
|GENERATE_KEY_IF_MISSING | automatic generate key in server in not found | false |
|ENABLE_SECURITY_AT| time at which to enable security; [see parsable times](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)| (not active) |


## files used
`key/key` and `key/key.pub` are used for internal jwts for this service. You can use key/make_key.sh to generate these, or otherwise add your own.
`./ssl/privatekey.pem` and `./ssl/certificate.pem` are used to enable SSL; if these are present, this application will start in SSL/HTTPS mode.
The CSP headers are generated from `contentSecurityPolicy.json`.

## User property variables
These are set in userFunction and injected into the token.

userType -- Null, Editor, Admin as userTypes (e.g. Admin can create users, Editor can create marks, Null can't create anything except logs)

userFilter -- list of values which must be present in given field in filtered data responses

### Special filter values
\*\* -- immune to filters (can see everything)
Public -- users with no userFilter are assigned this filter
An item with no filter value is returned in all cases, and is thus also public.

## Local Development Environment
In order to quickly setup a development environment, make use of the `setup_script.sh` script. This will setup the project, initialize and seed the database configurations, import routes and initialize environment config files and generate the keys required.

First clone <a href = "https://github.com/camicroscope/Caracal">Caracal</a>, <a href = "https://github.com/camicroscope/caMicroscope">caMicroscope</a> and the <a href = "https://github.com/camicroscope/Distro">Distro</a> repositories and make sure that all of them are in the same parent directory.

Run the script with  `./setup_script` or `bash ./setup_script.sh`

The script is configured to load a database named "`camic`" from server at "`127.0.0.1`". In order to specify different name and host, simply pass the two while calling the script, like `./setup_script custom_host custom_database_name`

Run `npm start` to start the application and see it running at `localhost:4010`

# caboodle
Conslidated Backend, Auth, and Security Services (placeholder name)


## routes
camicroscope is served as static files on /
auth login and check are in /auth/
iip images are used within /iip/
mongo data interactions are within /data/


## Environment variables Used
JWK_URL -- jwks url for id provider (*required*)

PORT -- the port to use, default 8010

AUD -- jwt audience to accept (if unset, does not check)

ISS -- jwt issuer to accept (if unset, does not check)

EXPIRY -- expire in time for jwks

DISABLE_SEC -- set truthy to disable permission and login handlers

IIP_PATH -- IIP server location, default http://ca-iip

LOADER_PATH -- loader utility location, default http://ca-load/

MONGO_URI -- mongo connection uri, default mongodb://localhost

MONGO_DB -- mongo db to use, default camic


## files used
key/key and key/key.pub are used for internal jwts for this service. You can use key/make_key.sh to generate these, or otherwise add your own


## User related variables
These are set in userFunction into the token.

userType -- Null, Editor, Admin as userTypes (e.g. Admin can create users, Editor can create marks, Null can't create anything except logs)

userFilter -- list of values which must be present in given field in filtered data responses

### Special filter values
\*\* -- immune to filters (can see everything)
Public -- users with no userFilter are assigned this filter

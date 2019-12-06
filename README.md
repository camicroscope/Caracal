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
MONGO_URI -- mongo connection uri, default mongodb://localhost
MONGO_DB -- mongo db to use, default camic


## files used
key/key and key/key.pub are used for internal jwts for this service. You can use key/make_key.sh to generate these, or otherwise add your own

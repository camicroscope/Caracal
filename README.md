<h2 align="center">
  <a href="http://camicroscope.org/"><img src="https://avatars2.githubusercontent.com/u/12075069?s=400&v=4" style="background-color:rgba(0,0,0,0);" height=230 alt="camicroscope: a web-based image viewer optimized for large bio-medical image data viewing"></a>
</h2>

# Caracal

Conslidated Backend, Auth, and Security Services


## routes
- camicroscope is served as static files on /
- auth login and check are in /auth/
- iip images are used within /iip/
- mongo data interactions are within /data/


## Environment variables Used
|variable | Description | default |
|---|---|---|
| WORKERS | number of child processes | 4 |
|JWK_URL | jwks url for id provider | (*required*) |
|PORT | the port to use | 4010 |
|AUD | jwt audience to accept | (if unset, does not check)|
|ISS | jwt issuer to accept |(if unset, does not check)|
|EXPIRY | expire in time for jwks| 1d |
|DISABLE_SEC | set truthy to disable permission and login handlers | false |
|ALLOW_PUBLIC | set truthy to allow public users | false |
|IIP_PATH | IIP server location | http://ca-iip |
|LOADER_PATH | loader utility location | http://ca-load/ |
|MONGO_URI | mongo connection uri | mongodb://localhost |
|MONGO_DB | mongo db to use, default camic |
|GENERATE_KEY_IF_MISSING | automatic generate key in server in not found | false |
|ENABLE_SECURITY_AT| time at which to enable security; [see parsable times](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)| (not active) |

## files used
key/key and key/key.pub are used for internal jwts for this service. You can use key/make_key.sh to generate these, or otherwise add your own

## User property variables
These are set in userFunction and injected into the token.

userType -- Null, Editor, Admin as userTypes (e.g. Admin can create users, Editor can create marks, Null can't create anything except logs)

userFilter -- list of values which must be present in given field in filtered data responses

### Special filter values
\*\* -- immune to filters (can see everything)
Public -- users with no userFilter are assigned this filter
An item with no filter value is returned in all cases, and is thus also public.

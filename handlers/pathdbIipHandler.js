const proxy = require('http-proxy-middleware');
const fetch = require('node-fetch');

var IIP_PATH = process.env.IIP_PATH || 'http://ca-iip/';
var PDB_URL = process.env.PDB_URL ||`https://quip-pathdb/`

pdbIipHandler = function(req, res, next) {
  if (req.query && req.query.slide && req.query.tsq) {
    // expected query args:
    // - slide - pathdb slide node id
    // - tsq - tile server "query"
    let lookup_url = PDB_URL + "/node/" + req.query.slide + "?_format=json"
    // LOOK AT - headers may need transform??
    fetch(lookup_url, {headers: req.headers}).then(x=>x.json()).then(x=>{
      // get path
      if (x && x['field_iip_path'] && x['field_iip_path'].length && x['field_iip_path']['value']){
        let filepath = x['field_iip_path']['value']
        // TODO ensure the ts arg is safe, and cannot smuggle in an existing filepath/overwrite
        req.new_iip_path = "?DeepZoom=" + filepath + req.query.ts
        proxy({
           secure: false,
           onError(err, req, res) {
             console.log(err);
             err.statusCode = 500;
             next(err);
           },
           changeOrigin: true,
           target: IIP_PATH,
           pathRewrite: function(path, req) {
             // do I need to check here??
             return req.new_iip_path
           },
           onProxyReq: function(proxyReq, req, res) {
             if (req.method == 'POST') {
               proxyReq.write(req.body);
               proxyReq.end();
             }
           },
         })(req, res, next);
      } else {
        let err = {}
        err.message = "Unexpected pathdb return format"
        err.statusCode = 500;
      }
    }).catch(e=>{
      console.error(e);
      next(e);
    })
  } else {
    let err = {}
    err.message = "malformed tile url"
    err.statusCode = 400;
    next(err);
  }
}



module.exports = pdbIipHandler;

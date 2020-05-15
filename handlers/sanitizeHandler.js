var ERR_ON_SANITIZE = (process.env.ERR_ON_SANITIZE === 'true') || false;


String.prototype.replaceAll = function(str1, str2, ignore)
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

function sanitizeBody(req, res, next){
  // handle req body edgecases
  if (ERR_ON_SANITIZE){
    if (req.body.indexOf("<") >=0 || req.body.indexOf(">") >=0){
      let e = new Error("Characters < and > are disallowed.");
      next(e)
    } else {
      next()
    }
  } else {
    req.body = req.body.replaceAll("<", "")
    req.body = req.body.replaceAll(">", "")
    next()
  }
}

module.exports = sanitizeBody;

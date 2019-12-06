function permissionHandler(permissionList){
  return function(req, res, next){
    if(req.tokenInfo.userType && permissionList.indexOf(req.tokenInfo.userType) >=0){
      req.permission_ok = true;
      next()
    } else {
      req.permission_ok = false;
      next("Permission not granted")
    }
  }
}

module.exports = permissionHandler

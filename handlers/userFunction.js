// userFunction -- used for login given id provider token

function userFunction(token){
  return new Promise(function(res, rej){
    token.userType = "Admin"
    // ** means we are immune to filters
    token.userFilter = ["**"]
    res(token)
  })
}


module.exports = userFunction

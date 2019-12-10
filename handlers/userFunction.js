// userFunction -- used for login given id provider token

function userFunction(token){
  return new Promise(function(res, rej){
    newToken = {}
    newToken.userType = "Admin"
    // ** means we are immune to filters
    newToken.userFilter = ["**"]
    newToken.sub = token.sub
    newToken.email = token.email
    newToken.name = token.name
    newtoken.picture = token.picture
    res(newToken)
  })
}


module.exports = userFunction

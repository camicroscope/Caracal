// simple userFunction

function userFunction(token){
  return new Promise(function(res, rej){
    token.userType = "Admin"
    res(token)
  })
}


module.exports = userFunction

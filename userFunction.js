// simple userFunction

function userFunction(token){
  return new Promise(function(res, rej){
    res(token)
  })
}


module.exports = userFunction

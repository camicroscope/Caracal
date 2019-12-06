const express = require('express')
const auth = require("./auth.js")

var proxy = require('http-proxy-middleware');
const https = require('https')
var cookieParser = require('cookie-parser')
var userFunction = require("./userFunction.js")

var PORT = process.env.PORT || 8010

const app = express();
app.use(cookieParser())

// user function for camic


// auth related services
app.get("/auth/check", auth.jwk_token_trade(auth.CLIENT, auth.PRIKEY, userFunction))
app.get("/auth/renew", auth.token_trade(auth.PUBKEY, auth.PRIKEY, userFunction))

app.listen(PORT, () => console.log('listening on ' + PORT))

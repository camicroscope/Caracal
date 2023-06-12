const kc = require('./keycloakHandlers.js');
const auth = require('./authHandlers.js');
const sgMail = require('@sendgrid/mail');
const mongoDB = require("../service/database");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
let defaultAddresses = '["rbirmin@emory.edu", "brandon.gallas@fda.hhs.gov", "Emma.Gardecki@fda.hhs.gov"]';
let adminAddressRaw = process.env.ADMIN_EMAILS || defaultAddresses;
let adminAddress = JSON.parse(adminAddressRaw);
let resetURL = process.env.RESET_URL || "https://wolf.cci.emory.edu/camic_htt/apps/registration/resetPassword.html";

// handlers for special routes

function sendMail(to, subject, message) {
  const msg = {
    to: to, // Change to your recipient
    from: adminAddress, // Must be a "verified sender"
    subject: subject,
    html: message,
  };
  return sgMail
      .send(msg)
      .then(() => {
        console.log('Email sent');
      })
      .catch((error) => {
        console.error(error);
      });
}

function userRegistrationFlow() {
  return function(req, res, next) {
    var data = JSON.parse(req.body);
    let firstName = data.firstName;
    let lastName = data.lastName;
    let email = data.email;
    // generate a password randomly
    // let password = Math.random().toString(36).slice(2)
    // console.log(username, " - ", password)
    // kc signup
    kc.addKcUser(firstName, lastName, email).then(()=>{
      // email to admin that new low-power user created.
      let adminMsg = `<p>A new account for ${firstName} ${lastName} with email ${email} has been created with limited access.
                           Check the user queue to assign this and other users to collections.</p>`;
      sendMail(adminAddress, "caMicroscope : New User Sign up", adminMsg);
      res.json({'username': email});
      next();
    }).catch((e)=>next(e));
  };
}


function requestResetPassword() {
  return function(req, res, next) {
    var data = JSON.parse(req.body);
    email = data.email;
    let user = {sub: email, email: email, type: "Reset Password Only"};
    // generate token for this user
    if (auth.AUD) {
      user.audience = auth.AUD;
    }
    if (auth.ISS) {
      user.issuer = auth.ISS;
    }
    let token = auth.makeJwt(user, auth.PRIKEY, auth.EXPIRY);
    // send email to address with link with token
    let resetMsg = `<p>Welcome to caMicroscope! Please go the following page to reset your caMicroscope password. Ignore this email if this request is in error.<br/>
                        <a href="${resetURL + "?token=" + token}">Reset your password</a>
                         </p>`;
    // TODO remove this log for prod
    console.log(resetMsg);
    sendMail(email, "caMicroscope : Welcome", resetMsg);
    res.json({'username': email});
    next();
  };
}

// reset the user's password based on current token
function resetPassword() {
  return function(req, res, next) {
    // must be after login handler
    token = req.tokenInfo;
    var data = JSON.parse(req.body);
    password = data.password;
    email = token.email;
    // set password
    kc.resetPassword(email, password).then(()=>{
      res.json({'username': email});
      next();
    }).catch((e)=>next(e));
  };
}

function getOwnUser(db, collection) {
  return function(req, res, next) {
    let token = auth.tokenVerify(req, auth.PRIKEY);
    mongoDB.find(db, collection, {email: token.email}).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
}

function editOwnUser(db, collection) {
  return function(req, res, next) {
    let token = auth.tokenVerify(req, auth.PRIKEY);
    let updates = req.body;
    // don't let users update some fields.
    delete update.email;
    delete update.collections;
    delete update.userFilter;
    delete update.userType;
    delete update.create_date;
    delete update['_id'];
    var newVals = {
      $set: JSON.parse(req.body),
    };
    mongoDB.update(db, collection, {email: token.email}, newVals).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
}

var customHandlers = {};
customHandlers.userRegistrationFlow = userRegistrationFlow;
customHandlers.resetPassword = resetPassword;
customHandlers.requestResetPassword = requestResetPassword;
module.exports = customHandlers;

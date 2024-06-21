const kc = require('./keycloakHandlers.js');
const auth = require('./authHandlers.js');
const sgMail = require('@sendgrid/mail');
const mongoDB = require("../service/database");

var dataHandlers = require('./dataHandlers.js');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
let defaultAddresses = '["rbirmin@emory.edu", "brandon.gallas@fda.hhs.gov", "Emma.Gardecki@fda.hhs.gov"]';
let adminAddressRaw = process.env.ADMIN_EMAILS || defaultAddresses;
let adminAddress = JSON.parse(adminAddressRaw);
let fromAddress = process.env.FROM_ADDRESS || "rbirmin@emory.edu";
let resetURL = process.env.RESET_URL || "https://wolf.cci.emory.edu/camic_htt/apps/registration/resetPassword.html";

// handlers for special routes

function sendMail(to, subject, message) {
  const msg = {
    to: to, // Change to your recipient
    from: fromAddress, // Must be a "verified sender"
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
      let adminMsg = `<p>This email was auto-generated to alert you to a new user account created on caMicroscope.
      The account has limited access. Please check the User Management
      page and update the user type and assigned collections as appropriate.</p>
      <br/>
      <p>User name: <b>${firstName} ${lastName}</b></p>
      <p>User email: <b>${email}</b></p>`;
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
    let resetMsg = `<h1>Welcome to caMicroscope!</h1>
                  <p>You are receiving this email because you have requested either a new account or a password reset.</p>
                  <p>Your username is the email address entered during registration: ${email}</p>
                  
                  <p>Please click this link to reset your caMicroscope password: <a href="${resetURL + "?token=" + token}">Reset your password</a>
                  
                  <p>The password reset link lasts for 24 hours.
                  
                  <p>If the password reset link has expired, the login page has a "Forgot Password" button, or you can follow <a href="https://wolf.cci.emory.edu/camic/htt/apps/registration/resetPassword.html">this direct link</a> to get another email to reset your password. Please give the system a few minutes to send the email.</p>
                  
                  <p>Please let us know if you are still unable to log in after trying this. We can set a temporary password for you if needed.</p>
                  
                  <p>Thank you for your time,<br/>
                  <a href="https://didsr.github.io/HTT.home/assets/pages/team">The HTT project management team</a>
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
    delete updates.email;
    delete updates.collections;
    delete updates.userFilter;
    delete updates.userType;
    delete updates.create_date;
    delete updates['_id'];
    var newVals = {
      $set: JSON.parse(req.body),
    };
    mongoDB.update(db, collection, {email: token.email}, newVals).then((x) => {
      req.data = x;
      next();
    }).catch((e) => next(e));
  };
}

function impersonate() {
  return function(req, res, next) {
    dataHandlers.User.forLogin(req.body.email).then((x)=>{
        const newToken = {};
        newToken.userType = x[0].userType || 'Null';
        newToken.userFilter = x[0].userFilter || ['Public'];
        newToken.sub = req.body.email;
        newToken.email = req.body.email;
        newToken.name = req.body.email;
        newToken.data = x[0];
        req.data = newToken;
        next()
    });
  };
}

var customHandlers = {};
customHandlers.userRegistrationFlow = userRegistrationFlow;
customHandlers.resetPassword = resetPassword;
customHandlers.requestResetPassword = requestResetPassword;
customHandlers.impersonate = impersonate;
module.exports = customHandlers;

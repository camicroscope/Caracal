const sendmail = require('sendmail')({silent: true});
const kc = require('./keycloakHandlers.js');
const auth = require('./authHandlers.js');

let adminAddress = process.env.ADMIN_EMAIL || "rbirmin@emory.edu";
let resetURL = process.env.RESET_URL || "https://wolf.cci.emory.edu/camic_htt/reset.html";

// handlers for special routes

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
      // email to user at email with password
      let userEmail = `<p>Your account has been created with limited access, and will be given more complete access after being reviewed by the administrative team.</p>
                            <hr>
                            <p><b>Username:</b> ${email}</p>

                            <p>Thank you for participating.</p>`;
      sendmail({
        from: adminAddress,
        to: email,
        subject: "Your caMicroscope login",
        html: userEmail,
      },
      function(err, reply) {
        console.log(err && err.stack);
        console.dir(reply);
      });
      // email to admin that new low-power user created.
      let adminEmail = `<p>A new account for ${firstName} ${lastName} with email ${email} has been created with limited access.
                           Check the user queue to assign this and other users to collections.</p>`;
      sendmail({
        from: adminAddress,
        to: adminAddress,
        subject: "New caMicroscope user",
        html: adminEmail,
      },
      function(err, reply) {
        console.log(err && err.stack);
        console.dir(reply);
      });
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
    let resetEmail = `<p>Go the following page to resetr your caMicroscope password. Ignore this email if this request is in error.<br/>
                        <a href="${resetURL + "?token=" + token}>Reset your password</a>"
                         </p>`;
    // TODO remove this log for prod
    console.log(resetEmail)
    sendmail({
      from: adminAddress,
      to: email,
      subject: "caMicroscope Password Reset",
      html: resetEmail,
    },
    function(err, reply) {
      console.log(err && err.stack);
      console.dir(reply);
      next(err);
    });
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
    resetPassword(email, password).then(()=>next()).catch((e)=>next(e));
  };
}

var customHandlers = {};
customHandlers.userRegistrationFlow = userRegistrationFlow;
customHandlers.resetPassword = resetPassword;
customHandlers.requestResetPassword = requestResetPassword;
module.exports = customHandlers;

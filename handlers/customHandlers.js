const sendmail = require('sendmail')({silent: true});
const kc = require('./keycloakHandlers.js');

let adminAddress = process.env.ADMIN_EMAIL || "rbirmin@emory.edu";

// handlers for special routes

function userRegistrationFlow(){
  return function(req, res, next){
    var data = JSON.parse(req.body);
    let firstName = data.firstName;
    let lastName = data.lastName;
    let email = data.email;
    let username = email;
    // generate a password randomly
    let password = Math.random().toString(36).slice(2)
    // generate a username from email or name?
    // kc signup
    kc.addKcUser(firstName,lastName,email,username,password).then(()=>{
      // email to user at email with password
      let userEmail = `<p>Your account has been created with limited access, and will be given more complete access after being reviewed by the administrative team.</p>
                            <hr>
                            <p><b>Username:</b> ${username}</p>
                            <p><b>Password:</b> ${password}</p>

                            <p>Thank you for participating.</p>`;
      sendmail({
        from: adminAddress,
        to: email,
        subject: "Your caMicroscope login",
        html: userEmail
        },
        function (err, reply) {
          console.log(err && err.stack)
          console.dir(reply)
      });
      // email to admin that new low-power user created.
      let adminEmail = `<p>A new account for ${firstName} ${lastName} with email ${email} has been created with limited access.
                           Check the user queue to assign this and other users to collections.</p>`;
      sendmail({
       from: adminAddress,
       to: adminAddress,
       subject: "New caMicroscope user",
       html: adminEmail
       },
       function (err, reply) {
         console.log(err && err.stack)
         console.dir(reply)
      });
      next();
    }).catch(e=>next(e));
  }
}

var customHandlers = {};
customHandlers.userRegistrationFlow = userRegistrationFlow;
module.exports = customHandlers;

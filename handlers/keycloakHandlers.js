const fetch = require('cross-fetch');
const auth = require('./authHandlers.js');

const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN || "admin";
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || "password";
const KEYCLOAK_HOST = process.env.KEYCLOAK_HOST || "http://ca-key:8080";
const KEYCLOAK_APP_REALM = process.env.KEYCLOAK_APP_REALM || "camic";

async function addKcUser(firstName, lastName, email) {
  let adminInfo = {
    'username': KEYCLOAK_ADMIN,
    'password': KEYCLOAK_ADMIN_PASSWORD,
    'grant_type': "password",
    'client_id': "admin-cli",
  };
  let adminKeys = await fetch(KEYCLOAK_HOST + '/realms/master/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(adminInfo),
  }).then((x)=>x.json());
  // add user
  let userDetail = {
    "firstName": firstName,
    "lastName": lastName,
    "email": email,
    "username": email,
    "enabled": "true",
  };
  // create the user in keycloak.
  // this call doesn't seem to return anything except a status code?
  fetch(KEYCLOAK_HOST + '/admin/realms/' + KEYCLOAK_APP_REALM + '/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminKeys['access_token'],
    },
    body: JSON.stringify(userDetail),
  }).then(async (response)=>{
    // Important! if userCreate fails, it's probably because the user already exists.
    // DO NOT set/reset password for users which already exist this way.
    if (response.status >= 400) {
      throw new Error("User create gave status code " + response.status);
    } else {
      console.info("Created User w/o password for " + email);
    }
  });
}

async function resetPassword(email, password) {
  let adminInfo = {
    'username': KEYCLOAK_ADMIN,
    'password': KEYCLOAK_ADMIN_PASSWORD,
    'grant_type': "password",
    'client_id': "admin-cli",
  };
  let adminKeys = await fetch(KEYCLOAK_HOST + '/realms/master/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(adminInfo),
  }).then((x)=>x.json());
  // get all user ids, then find the one we just made
  let userInfo = await fetch(KEYCLOAK_HOST + '/admin/realms/' + KEYCLOAK_APP_REALM + '/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminKeys['access_token'],
    },
  }).then((x)=>x.json());
  console.log(userInfo);
  let thisUserInfo = userInfo.filter((y)=>y['username'] == email);
  if (thisUserInfo && thisUserInfo.length && thisUserInfo[0]['id']) {
    let passwordResetBody = {
      "type": "password",
      "temporary": false,
      "value": password,
    };
    let passwordReset = await fetch(KEYCLOAK_HOST + '/admin/realms/' +
        KEYCLOAK_APP_REALM + '/users/' + thisUserInfo[0]['id'] + '/reset-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + adminKeys['access_token'],
      },
      body: JSON.stringify(passwordResetBody),
    });
    console.info("Set password for " + email);
  } else {
    throw new Error("User was not successfully created/found for username " + email);
  }
}

function createUser() {
  return function(req, res, next) {
    var data = JSON.parse(req.body);
    firstName = data.firstName;
    lastName = data.lastName;
    email = data.email;
    password = data.password;
    addKcUser(firstName, lastName, email).then(()=>next()).catch((e)=>next(e));
  };
}

keycloakHandlers = {};
keycloakHandlers.createUser = createUser;
keycloakHandlers.addKcUser = addKcUser;
keycloakHandlers.resetPassword = resetPassword;


module.exports = keycloakHandlers;
const fetch = require('cross-fetch');

const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN || "admin";
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || "password";
const KEYCLOAK_HOST = process.env.KEYCLOAK_HOST || "http://ca-key:8080";

async function createUser(){
  let userInfo = {
    'username': KEYCLOAK_ADMIN,
    'password': KEYCLOAK_ADMIN_PASSWORD,
    'grant_type': "password",
    'client_id': "admin-cli"
  }
  let adminKeys = await fetch(KEYCLOAK_HOST + '/realms/master/protocol/openid-connect/token',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(userInfo)
  }).then(x=>x.json())
  console.log(adminKeys)
  // get admin token
  ////-- https://www.appsdeveloperblog.com/keycloak-rest-api-create-a-new-user/
  // add user
}

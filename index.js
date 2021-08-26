const run = require('./main.js').run;

const params = {
  provisioningHost: '<INSERT_PROVISIONING_HOST>',
  idScope: '<INSERT_ID_SCOPE>',
  registrationId: '<INSERT_REGISTRATION_ID>',
  symmetricKey: '<INSERT_SYMMETRIC_KEY>',
}

run(params);
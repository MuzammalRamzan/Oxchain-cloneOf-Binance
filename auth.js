var authenticator = require("authenticator");
const jwt = require("jsonwebtoken");

function apiKeyChecker(api_key_data) {
  return new Promise((resolve) => {
    if (api_key_data === process.env.API_KEY) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

function verifyToken(pin, twofa) {
  var formattedToken = authenticator.generateToken(twofa);
  return new Promise((resolve) => {
    console.log("pin: " + pin);
    console.log(formattedToken);
    if (pin === formattedToken) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

const getToken = (user) => {
  return jwt.sign(user, 'secret');
};

module.exports = {
  apiKeyChecker: apiKeyChecker,
  verifyToken: verifyToken,
  getToken
};

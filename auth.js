var authenticator = require("authenticator");

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
    if (pin === formattedToken) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

module.exports = {
  apiKeyChecker: apiKeyChecker,
  verifyToken: verifyToken,
};

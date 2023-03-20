var authenticator = require("authenticator");
var authFile = require("../../auth.js");

const get2fa = async function (req, res) {

  var formattedKey = authenticator.generateKey();
  res.json({ status: "success", data: formattedKey });
};

module.exports = get2fa;

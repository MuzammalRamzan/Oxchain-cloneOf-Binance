var authenticator = require("authenticator");
var authFile = require("../../auth.js");

const get2fa = async function (req, res) {
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var formattedKey = authenticator.generateKey();
    res.json({ status: "success", data: formattedKey });
  } else {
    res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
  }
};

module.exports = get2fa;

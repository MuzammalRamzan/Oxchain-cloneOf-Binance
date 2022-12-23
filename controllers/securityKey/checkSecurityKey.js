const SecurityKey = require("../../models/SecurityKey");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");

const checkSecurityKey = (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;

  authFile.apiKeyChecker(api_key_result).then((result) => {
    if (result === true) {
      SecurityKey.findOne({
        user_id: user_id,
        status: 1,
        key: utilities.hashData(req.body.key),
      }).then((securityKey) => {
        if (securityKey != null) {
          res.json({ status: "success", data: "", showableMessage: "Success" });
        } else {
          res.json({ status: "fail", message: "wrong_key", showableMessage: "Wrong key" });
        }
      });
    }
  });
};

module.exports = checkSecurityKey;

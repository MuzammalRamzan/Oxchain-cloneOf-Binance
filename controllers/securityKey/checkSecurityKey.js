const SecurityKey = require("../../models/SecurityKey");
var authFile = require("../../auth.js");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");

const checkSecurityKey = (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;

  authFile.apiKeyChecker(api_key_result).then(async (result) => {
    if (result === true) {
      let key = req.headers["key"];

      if (!key) {
        return res.json({ status: "fail", message: "key_not_found" });
      }

      if (!req.body.device_id || !req.body.user_id) {
        return res.json({ status: "fail", message: "invalid_params (key, user id, device_id)" });
      }

      let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


      if (checkKey === "expired") {
        return res.json({ status: "fail", message: "key_expired" });
      }

      if (!checkKey) {
        return res.json({ status: "fail", message: "invalid_key" });
      }

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

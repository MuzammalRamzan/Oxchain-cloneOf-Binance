var authenticator = require("authenticator");
var authFile = require("../../auth.js");
var Device = require("../../models/Device");
var User = require("../../models/User");

const getVerificationMethod = async function (req, res) {
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

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
    let user = await User.findOne({
      _id: req.body.user_id,
      status: 1,
    }).exec();

    if (user != null) {
      var twofa = user["twofa"];
      var twofa_status = user["twofa_status"];
      var email = user["email"];
      var phone = user["phone_number"];

      if (email != null && phone != null) {
        res.json({
          status: "success",
          data: "both",
        });
      } else {
        if (email != null) {
          res.json({ status: "success", data: "email" });
        } else if (phone != null) {
          res.json({ status: "success", data: "phone" });
        }
      }
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
  }
};

module.exports = getVerificationMethod;

const User = require("../models/User");
const MailVerification = require("../models/MailVerification");
var authFile = require("../auth.js");
var mailer = require("../mailer.js");
var OneStepWithdraw = require("../models/OneStepWithdraw");

const checkOneStepWithdraw = async function (req, res) {
  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    OneStepWithdraw.findOne(
      { status: 1, user_id: req.body.user_id },
      function (err, result) {
        if (err) {
          res.json({ status: "fail", message: "not_enabled" });
        } else {
          res.json({ status: "success", data: "enabled" });
        }
      }
    );
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = checkOneStepWithdraw;

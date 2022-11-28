const User = require("../../models/User");
const LoginLogs = require("../../models/LoginLogs");
var authFile = require("../../auth.js");

const twoFactor = async function (req, res) {
  var twofapin = req.body.twofapin;
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var wantToTrust = req.body.wantToTrust;
  var log_id = req.body.log_id;
  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var user = await User.findOne({
      _id: user_id,
    }).exec();

    if (user != null) {
      var twofa = user["twofa"];

      var result2 = await authFile.verifyToken(twofapin, twofa);

      if (result2 === true) {
        if (wantToTrust == "yes") {
          var update = { trust: "yes" };
          var log = await LoginLogs.findOneAndUpdate(
            { _id: log_id },
            update
          ).exec();
          res.json({ status: "success", data: "2fa_success" });
        } else {
          res.json({ status: "success", message: "2fa_success" });
        }
      } else {
        res.json({ status: "fail", message: "2fa_failed", showableMessage: "2FA Failed" });
      }
    } else {
      res.json({ status: "fail", message: "login_failed", showableMessage: "Login Failed" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
  }
};

module.exports = twoFactor;

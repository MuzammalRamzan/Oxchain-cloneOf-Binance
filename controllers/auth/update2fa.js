const User = require("../../models/User");
var authFile = require("../../auth.js");
const MailVerification = require("../../models/MailVerification");
const SMSVerification = require("../../models/SMSVerification");

const update2fa = async function (req, res) {
  var user_id = req.body.user_id;
  var twofa = req.body.twofa;
  var twofapin = req.body.twofapin;
  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {

    let key = req.headers["key"];

    if (!key) {
      return res.json({ status: "fail", message: "key_not_found" });
    }

    if (!req.body.device_id || !req.body.user_id) {
      return res.json({ status: "fail", message: "invalid_params" });
    }

    let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


    if (checkKey === "expired") {
      return res.json({ status: "fail", message: "key_expired" });
    }

    if (!checkKey) {
      return res.json({ status: "fail", message: "invalid_key" });
    }

    const filter = { _id: user_id };
    const update = { twofa: twofa };

    var result2 = await authFile.verifyToken(twofapin, twofa);

    if (result2 === true) {

      let user = await User.findOne({
        _id: user_id,
      }).exec();

      var email = user["email"];
      var phone = user["phone_number"];
      let check1 = "";
      let check3 = "";

      if (email != undefined && email != null && email != "") {
        check1 = await MailVerification.findOne({
          user_id: user_id,
          reason: "update_2fa",
          pin: req.body.mailPin,
          status: 0,
        }).exec();
        if (!check1)
          return res.json({
            status: "fail",
            message: "verification_failed",
            showableMessage: "Wrong Mail Pin",
          });
      }

      if (phone != undefined && phone != null && phone != "") {
        check3 = await SMSVerification.findOne
          ({
            user_id: user_id,
            reason: "update_2fa",
            pin: req.body.smsPin,
            status: 0,
          }).exec();

        if (!check3)
          return res.json({
            status: "fail",
            message: "verification_failed",
            showableMessage: "Wrong SMS Pin",
          });
      }

      if (check1 != "") {
        check1.status = 1;
        check1.save();
      }

      if (check3 != "") {
        check3.status = 1;
        check3.save();
      }

      user.twofa = twofa;
      await user.save();

      return res.json({ status: "success", message: "2fa_updated", showableMessage: "2FA Enabled" });
    } else {
      return res.json({ status: "fail", message: "wrong_auth_pin", showableMessage: "Wrong Auth Pin" });
    }
  } else {
    return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
  }
};

module.exports = update2fa;

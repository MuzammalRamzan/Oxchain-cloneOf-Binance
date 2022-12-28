const User = require("../../models/User");
const RegisterMail = require("../../models/RegisterMail");
const RegisterSMS = require("../../models/RegisterSMS");
const MailVerification = require("../../models/MailVerification");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");
const ChangeLogsModel = require("../../models/ChangeLogs");

const changePassword = async function (req, res) {
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var password = req.body.password;
  var old_password = req.body.old_password;

  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {

    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    if (user != null) {

      if (user.password != utilities.hashData(old_password)) return res.json({ status: "fail", message: "wrong_password", showableMessage: "Wrong Password" });

      var email = user["email"];
      var phone = user["phone"];

      let check1 = "";
      let check3 = "";

      if (email != undefined && email != null && email != "") {
        check1 = await MailVerification.findOne({
          user_id: user_id,
          reason: "change_password",
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
        check3 = await RegisterSMS.findOne
          ({
            user_id: user_id,
            reason: "change_password",
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

      user.password = utilities.hashData(password);
      user.save();

      let changeLog = new ChangeLogsModel({
        user_id: user_id,
        type: "Change Password",
        device: req.body.device ?? "Unknown",
        ip: req.body.ip ?? "Unknown",
        city: req.body.city ?? "Unknown",
      });
      changeLog.save();

      res.json({ status: "success", message: "password_changed", showableMessage: "Password Changed" });

    } else {
      res.json({ status: "fail", message: "user_not_found", showableMessage: "User not found" });
    }


  } else {
    res.json({ status: "fail", message: "403 Forbidden", showableMessage: "403 Forbidden" });
  }
};

module.exports = changePassword;

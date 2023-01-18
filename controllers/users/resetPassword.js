const User = require("../../models/User");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");
const MailVerification = require("../../models/MailVerification");
const SMSVerification = require("../../models/SMSVerification");

const resetPassword = async function (req, res) {
  var user_id = req.body.user_id;
  var password = utilities.hashData(req.body.password);

  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (user_id == undefined || user_id == null || user_id == "") {
    return res.json({
      status: "fail",
      message: "user_id_required",
      showableMessage: "User ID is required",
    });
  }

  if (password == undefined || password == null || password == "") {

    return res.json({
      status: "fail",
      message: "password_required",
      showableMessage: "Password is required",
    });
  }

  if (user_id.length != 24) return res.json({ status: "fail", message: "user_id_invalid", showableMessage: "User ID is invalid" });


  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    if (user != null) {

      var email = user["email"];
      var phone = user["phone_number"];

      let check1 = "";
      let check3 = "";


      

      
      if (email != undefined && email != null && email != "") {
        check1 = await MailVerification.findOne({
          user_id: user_id,
          reason: "reset_password",
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
            reason: "reset_password",
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

      user.password = password;

      user.save();
      return res.json({ status: "success", message: "password_changed", showableMessage: "Password Changed" });
    }
    else {
      return res.json({ status: "fail", message: "user_not_found", showableMessage: "User not found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden", showableMessage: "403 Forbidden" });
  }
};

module.exports = resetPassword;

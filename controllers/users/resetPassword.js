

const User = require("../../models/User");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");
const MailVerification = require("../../models/MailVerification");
const SMSVerification = require("../../models/SMSVerification");
const mailer = require("../../mailer");

const resetPassword = async function (req, res) {
  var password = utilities.hashData(req.body.password);

  var type = req.body.type;
  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);



  if (password == undefined || password == null || password == "") {

    return res.json({
      status: "fail",
      message: "password_required",
      showableMessage: "Password is required",
    });
  }



  let user = "";
  if (result === true) {


    if (type == "email") {

      if (req.body.email == undefined || req.body.email == null || req.body.email == "") {
        return res.json({
          status: "fail",
          message: "email_required",
          showableMessage: "Email is required",
        });
      }

      user = await User.findOne({
        email: req.body.email,
      }).exec();
    }
    if (type == "phone") {

      if (req.body.country_code == undefined || req.body.country_code == null || req.body.country_code == "" || req.body.phone_number == undefined || req.body.phone_number == null || req.body.phone_number == "") {
        return res.json({
          status: "fail",
          message: "phone_required",
          showableMessage: "Phone is required",
        });
      }

      user = await User.findOne({
        country_code: req.body.country_code,
        phone_number: req.body.phone_number,
      }).exec();
    }

    if (user != null) {

      var email = user["email"];
      var phone = user["phone_number"];

      let check1 = "";
      let check3 = "";


      if (email != undefined && email != null && email != "") {
        check1 = await MailVerification.findOne({
          user_id: user._id,
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
            user_id: user._id,
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

      if (user.email != undefined && user.email != null && user.email != "") {
        mailer.sendMail(user.email, "Reset Password", "Your password has been resetted. If you didn't do this, please contact us immediately.");
      }

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


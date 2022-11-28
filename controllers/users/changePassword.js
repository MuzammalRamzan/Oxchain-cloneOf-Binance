const User = require("../../models/User");
const RegisterMail = require("../../models/RegisterMail");
const RegisterSMS = require("../../models/RegisterSMS");
const MailVerification = require("../../models/MailVerification");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");

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

    let pinVerified = false;
    if (user != null) {
      var twofa = user["twofa"];
      var db_password = user["password"];

      let emailVerifiedCheck = await RegisterMail.findOne({
        user_id: user_id,
        status: 1,
      }).exec();

      let smsVerifiedCheck = await RegisterSMS.findOne({
        user_id: user_id,
        status: 1,
      }).exec();

      if (emailVerifiedCheck != null) {
        let pinCheck = await MailVerification.findOne({
          user_id: user_id,
          pin: req.body.pin,
          reason: "change_password",
        }).exec();

        if (pinCheck != null) {
          pinVerified = true;
        }
      } else {
        if (smsVerifiedCheck != null) {
          let pinCheck = await MailVerification.findOne({
            user_id: user_id,
            pin: req.body.pin,
            reason: "change_password",
          }).exec();

          if (pinCheck != null) {
            pinVerified = true;
          }
        }
      }
      const filter = { _id: user_id, status: 1 };
      if (pinVerified === true) {
        if (utilities.hashData(old_password) == db_password) {
          var result2 = "";
          if (twofa != null) {
            result2 = await authFile.verifyToken(twofapin, twofa);
          } else {
            var check = await RegisterMail.findOne({
              email: user["email"],
              pin: twofapin,
            }).exec();
            if (check != null) {
              result2 = true;
            }
          }

          if (result2 === true) {
            const update = { password: utilities.hashData(password) };
            User.findOneAndUpdate(filter, update, (err, doc) => {
              if (err) {
                res.json({ status: "fail", message: err });
              } else {
                res.json({ status: "success", data: "update_success" });
              }
            });
          } else {
            res.json({ status: "fail", message: "2fa_failed", showableMessage: "2FA Failed" });
          }
        } else {
          res.json({ status: "fail", message: "wrong_old_password", showableMessage: "Wrong Old Password" });
        }
      } else {
        res.json({ status: "fail", message: "pin_failed", showableMessage: "Pin Failed" });
      }
    } else {
      res.json({ status: "fail", message: "user_not_found", showableMessage: "User not Found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden", showableMessage: "403 Forbidden" });
  }
};

module.exports = changePassword;

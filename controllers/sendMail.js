const User = require("../models/User");
const MailVerification = require("../models/MailVerification");
var authFile = require("../auth.js");
var mailer = require("../mailer.js");

const sendMail = async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var reason = req.body.reason;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    if (user != null) {
      var pin = 0000;

      mailer.sendMail(
        user["email"],
        "Oxhain verification",
        "Pin : " + pin,
        function (err, data) {
          if (err) {
            console.log("Error " + err);
          } else {
            console.log("sms sent");
          }
        }
      );

      let check = await MailVerification.findOne({
        user_id: user_id,
        reason: reason,
        status: 0,
      }).exec();

      if (check != null) {
        MailVerification.updateOne(
          { user_id: user["_id"], reason: reason, status: 0 },
          { $set: { pin: pin } },
          function (err, result) {
            if (err) {
              res.json({ status: "fail", message: err });
            } else {
              res.json({ status: "success", data: "mail_send" });
            }
          }
        );
      } else {
        const newPin = new MailVerification({
          user_id: user["_id"],
          pin: pin,
          reason: reason,
          status: 0,
        });

        newPin.save(function (err) {
          if (err) {
            res.json({ status: "fail", message: err });
          } else {
            res.json({ status: "success", data: "mail_send" });
          }
        });
      }
    } else {
      res.json({ status: "fail", message: "user_not_found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = sendMail;

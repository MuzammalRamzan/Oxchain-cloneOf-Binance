const User = require("../models/Test");
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
      var pin = Math.floor(100000 + Math.random() * 900000);

      mailer.sendSMS(
        user["phone_number"],
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

      const newPin = new SMSVerification({
        phone_number: user["phone_number"],
        pin: pin,
        reason: reason,
        status: 0,
      });

      newPin.save(function (err) {
        if (err) {
          res.json({ status: "fail", message: err });
        } else {
          res.json({ status: "success", data: "sms_sent" });
        }
      });
    } else {
      res.json({ status: "fail", message: "user_not_found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = sendMail;

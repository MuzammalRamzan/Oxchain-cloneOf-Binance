const User = require("../models/User");
const MailVerification = require("../models/MailVerification");
var authFile = require("../auth.js");
var mailer = require("../mailer.js");

const sendMail = async function (req, res) {

  let newMail = "";
  if (req.body.newMail != null && req.body.newMail != "" && req.body.newMail != undefined) {
    newMail = req.body.newMail;
    let user = await User.findOne({
      email: newMail,
    }).exec();

    if (user != null) {
      res.json({ status: "fail", message: "email_already_exist", showableMessage: "Email already exist" });
      return;
    }

  }
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
      var pin = "0000";

      var pin2 = "0000";

      if (reason == "change_email_new" && newMail != "") {


        let check = await MailVerification.findOne({
          user_id: user_id,
          reason: "change_email_new",
        }).exec();


        mailer.sendMail(
          newMail,
          "Oxhain verification",
          "Pin : " + pin2,
          function (err, data) {
            if (err) {
              console.log("Error " + err);
            } else {
              console.log("sms sent");
            }
          }
        );

        if (check != null) {
          await MailVerification.findOneAndUpdate(
            { user_id: user["_id"], reason: "change_email_new" },
            { pin: pin, status: "0", }
          );
        } else {
          newPin = new MailVerification({
            user_id: user["_id"],
            pin: pin2,
            reason: "change_email_new",
            status: 0,
          });
          newPin.save();
        }

        res.json({ status: "success", data: "mail_send", showableMessage: "Mail send" });



      }
      else {





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
        }).exec();

        if (check != null) {
          MailVerification.updateOne(
            { user_id: user["_id"], reason: reason },
            { pin: pin, status: "0" },
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
      }
    } else {
      res.json({ status: "fail", message: "user_not_found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = sendMail;

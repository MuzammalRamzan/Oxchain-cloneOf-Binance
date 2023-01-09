const User = require("../models/User");
const SMSVerification = require("../models/SMSVerification");
var authFile = require("../auth.js");
var mailer = require("../mailer.js");


const sendSMS = async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var reason = req.body.reason;
  let newPhone = req.body.newPhone ?? "";
  let country_code = req.body.country_code ?? "90";

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    if (user != null) {
      var pin = "0000";

      var pin2 = "0000";


      if (reason == "change_phone_new" && newPhone != "") {


        let checkForPhone = await User.findOne({
          phone_number: newPhone,
          country_code: country_code,
        }).exec();


        if (checkForPhone != null) {
          return res.json({ status: "fail", message: "phone_already_exist", showableMessage: "Phone already exist" });
        }

        let check = await SMSVerification.findOne({
          user_id: user_id,
          reason: "change_phone_new",
        }).exec();


        mailer.sendSMS(
          newPhone,
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
          await SMSVerification.findOneAndUpdate(
            { user_id: user["_id"], reason: "change_phone_new" },
            { pin: pin2, status: "0" },
          );
        } else {
          newPin = new SMSVerification({
            user_id: user["_id"],
            pin: pin2,
            reason: "change_phone_new",
            status: 0,
          });
          newPin.save();
        }


        mailer.sendSMS(
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

        res.json({ status: "success", data: "sms_send", showableMessage: "SMS send" });
      }
      else {



        let check2 = await SMSVerification.findOne({
          user_id: user_id,
          reason: reason,
        }).exec();

        if (check2 != null) {
          SMSVerification.updateOne(
            { user_id: user["_id"], reason: reason },
            { pin: pin, status: "0" },
            function (err, result) {
              if (err) {
                res.json({ status: "fail", message: err });
              } else {
                res.json({ status: "success", data: "sms_send" });
              }
            }
          );
        } else {
          const newPin = new SMSVerification({
            user_id: user["_id"],
            pin: pin,
            reason: reason,
            status: 0,
          });

          newPin.save(function (err) {
            if (err) {
              res.json({ status: "fail", message: err });
            } else {
              res.json({ status: "success", data: "sms_send" });
            }
          });
        }
      }



    }
    else {
      res.json({ status: "fail", message: "user_not_found" });

    }


  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = sendSMS;

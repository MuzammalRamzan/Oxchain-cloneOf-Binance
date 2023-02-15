

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
    }).exec();

    if (user != null) {

      if (user.status == "1" || user.status == "5") {
      }
      else {
        return res.json({ status: "fail", message: "user_not_found", showableMessage: "User not found" });
      }

      var pin = "0000";


      if (reason == "change_phone_new") {

        if (req.body.newPhone == "" || req.body.newPhone == null || req.body.newPhone == undefined) {
          return res.json({ status: "fail", message: "phone_number_not_found", showableMessage: "Phone number not found" });
        }

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


        let dataTest = await mailer.sendSMS(
          country_code,
          newPhone,
          "Pin : " + pin,
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
            { pin: pin, status: 0 },
          );
        } else {
          newPin = new SMSVerification({
            user_id: user["_id"],
            pin: pin,
            reason: "change_phone_new",
            status: 0,
          });
          newPin.save();
        }

        res.json({ status: "success", data: "sms_send", showableMessage: "SMS send" });
      }
      else {
        phone_number = user.phone_number;
        country_code = user.country_code;

        let check2 = await SMSVerification.findOne({
          user_id: user_id,
          reason: reason,
        }).exec();


        await mailer.sendSMS(
          country_code,
          phone_number,
          "Pin : " + pin,
          function (err, data) {
            if (err) {
              console.log("Error " + err);
            } else {
              console.log("sms sent");
            }
          }
        );


        if (check2 != null) {

          console.log(check2);
          SMSVerification.findOneAndUpdate(
            { user_id: user["_id"] },
            { pin: pin, status: "0", reason: reason, },
            function (err, result) {
              if (err) {
                res.json({ status: "fail", message: err });
              } else {
                res.json({ status: "success", data: "sms_send_d" });
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


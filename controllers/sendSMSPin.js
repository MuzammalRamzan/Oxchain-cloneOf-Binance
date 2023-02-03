const RegisterSMS = require("../models/RegisterSMS");
var authFile = require("../auth.js");
var mailer = require("../mailer.js");
let UserModel = require("../models/User");

const sendSMSPin = async (req, res) => {
  var api_key_result = req.body.api_key;
  var country_code = req.body.country_code;
  var phone_number = req.body.phone;
  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {

    if (!country_code || country_code == undefined || country_code == null || country_code == "" || !phone_number || phone_number == undefined || phone_number == null || phone_number == "") {
      return res.json({
        status: "fail",
        message: "phone and country code required",
        showableMessage: "Phone is required",
      });
    }

    let userCheck = await UserModel.findOne({
      country_code: country_code,
      phone_number: phone_number,
    }).exec();

    if (userCheck) {
      return res.json({
        status: "fail",
        message: "phone_already_registered",
        showableMessage: "Phone already registered",
      });
    }

    let check = await RegisterSMS.findOne({
      country_code: country_code,
      phone_number: phone_number,
    }).exec();


    let pin = "000000";
    let expireTime = Date.now() + 1 * 60 * 1000;
    if (check) {
      check.pin = pin;
      check.status = 0;
      check.expiryTime = expireTime
      check.save();
    }
    else {
      const newPin = new RegisterSMS({
        country_code: country_code,
        phone_number: phone_number,
        pin: pin,
        expiryTime: expireTime,
        status: 0,
      });
      newPin.save();
    }

    let sendSMSResponse = await mailer.sendSMS(
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

    return res.json({
      status: "success",
      message: "pin_sent",
      showableMessage: "Pin sent",
    });

  } else {
    return res.json({ status: "fail", message: "Forbidden 403" });
  }
};

module.exports = sendSMSPin;

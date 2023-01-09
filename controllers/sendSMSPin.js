const RegisterSMS = require("../models/RegisterSMS");
var authFile = require("../auth.js");
var mailer = require("../mailer.js");

const sendSMSPin = async (req, res) => {
  var api_key_result = req.body.api_key;
  var phone = req.body.phone;
  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var pin;
    if (process.env.NODE_ENV === "product") {
      pin = "000000";
    } else {
      pin = Math.floor(100000 + Math.random() * 900000);
    }

    const newPin = new RegisterSMS({
      phone_number: phone,
      pin: pin,
    });

    let smsCheck = await RegisterSMS.findOne({ phone: phone }).exec();
    if (smsCheck == null) {
      if (newPin.save()) {
        newPin.save();
        mailer.sendSMS(phone, "Your pin code is " + pin + ".");
        res.json({ status: "success", message: "pin_sent" });
      } else {
        res.json({ status: "fail", message: "an_error_occured" });
      }
    } else {
      RegisterSMS.findOneAndUpdate(
        { phone_number: phone },
        { pin: pin },
        function (err, room) {
          if (err) {
            console.log(err);
          } else {
            mailer.sendSMS(phone, "Your pin code is " + pin + ".");
            res.json({ status: "success", message: "pin_sent" });
          }
        }
      );
    }
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
};

module.exports = sendSMSPin;

const RegisterMail = require("../models/RegisterMail");
var authFile = require("../auth.js");
var mailer = require("../mailer.js");

const sendMailPin = async (req, res) => {
  var api_key_result = req.body.api_key;
  var email = req.body.email;
  let result = await authFile.apiKeyChecker(api_key_result);

  console.log(result);
  if (result === true) {
    var pin = "000000";

    const newPin = new RegisterMail({
      email: email,
      pin: pin,
    });

    let mailCheck = await RegisterMail.findOne({ email: email }).exec();
    if (mailCheck == null) {
      if (newPin.save()) {
        mailer.sendMail(email, "Pin Code", "Your pin code is " + pin + ".");
        res.json({ status: "success", message: "pin_sent" });
      } else {
        res.json({ status: "fail", message: "an_error_occured" });
      }
    } else {
      RegisterMail.findOneAndUpdate(
        { email: email },
        { pin: pin },
        function (err, room) {
          if (err) {
            console.log(err);
          } else {
            mailer.sendMail(email, "Pin Code", "Your pin code is " + pin + ".");
            res.json({ status: "success", message: "pin_sent" });
          }
        }
      );
    }
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
};

module.exports = sendMailPin;

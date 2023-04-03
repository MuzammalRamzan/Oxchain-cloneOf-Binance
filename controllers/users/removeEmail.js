const UserModel = require('../../models/User');
var authFile = require('../../auth');
const mailer = require('../../mailer');
const SMSVerification = require("../../models/SMSVerification");
const MailVerification = require("../../models/MailVerification");

const removeEmail = async (req, res) => {

  let user_id = req.body.user_id;
  let api_key = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key);

  if (result == true) {

    let key = req.headers["key"];

    if (!key) {
      return res.json({ status: "fail", message: "key_not_found" });
    }

    if (!req.body.device_id || !req.body.user_id) {
      return res.json({ status: "fail", message: "invalid_params" });
    }

    let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


    if (checkKey === "expired") {
      return res.json({ status: "fail", message: "key_expired" });
    }

    if (!checkKey) {
      return res.json({ status: "fail", message: "invalid_key" });
    }

    if (user_id == null || user_id == "") {
      return res.json({ status: "error", message: "user_id is null" });
    }

    let user = await UserModel.findOne(
      {
        _id: user_id
      }
    );

    if (user == null) {
      return res.json({ status: "error", message: "user is null" });
    }
    else {

      let email = user.email;
      let phone = user.phone_number;
      let twofa = user.twofa;

      let check1 = "";
      let check3 = "";


      if (email != undefined && email != null && email != "") {
        check1 = await MailVerification.findOne({
          user_id: user_id,
          reason: "remove_email",
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
            user_id: user_id,
            reason: "remove_email",
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

      if (twofa != undefined && twofa != null && twofa != "") {

        if (req.body.twofapin == undefined || req.body.twofapin == null || req.body.twofapin == "") {
          return res.json({ status: "fail", message: "verification_failed, send 'twofapin'", showableMessage: "Wrong 2FA Pin" });
        }

        let resultt = await authFile.verifyToken(req.body.twofapin, twofa);

        if (resultt === false) {
          return res.json({ status: "fail", message: "verification_failed", showableMessage: "Wrong 2FA Pin" });
        }
      }

      if (check1 != "") {
        check1.status = 1;
        check1.save();
      }

      if (check3 != "") {
        check3.status = 1;
        check3.save();
      }





      if (user.phone_number == null || user.phone_number == "") {
        return res.json({ status: "error", message: "user phone is null", showableMessage: "You can't remove your email before adding phone number" });
      }
      else {
        user.email = null;
        user.save();
        mailer.sendMail(user.email, "Email removed", "Email removed", "Your email has been removed. If you did not do this, please contact us immediately.");
        return res.json({ status: "success", message: "email removed", showableMessage: "Email removed" });
      }
    }

  }
  else {
    res.json("error");
  }

};

module.exports = removeEmail;
const User = require("../../models/User");
var authFile = require("../../auth.js");
const SMSVerification = require("../../models/SMSVerification");
const EmailVerification = require("../../models/MailVerification");
const ChangeLogsModel = require("../../models/ChangeLogs");

const changeEmail = async function (req, res) {
  var user_id = req.body.user_id;

  var newEmail = req.body.new_email;

  let newMailPin = req.body.newMailPin;

  var api_key_result = req.body.api_key;

  let result2 = "";
  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    if (user != null) {
      var email = user["email"];
      var phone = user["phone"];


      let check1 = "";
      let check2 = "";
      let check3 = "";

      if (email != undefined && email != null && email != "") {

        check1 = await EmailVerification.findOne({
          user_id: user_id,
          reason: "change_email",
          pin: req.body.mailPin,
          status: 0
        }).exec();

        if (!check1) return res.json({ status: "fail", message: "verification_failed", showableMessage: "Wrong Mail Pin" });


      }

      if (phone != undefined && phone != null && phone != "") {
        check3 = await SMSVerification.findOne({
          user_id: user_id,
          reason: "change_email",
          pin: req.body.smsPin,
          status: 0
        }).exec();

        if (!check3) return res.json({ status: "fail", message: "verification_failed", showableMessage: "Wrong SMS Pin" });


      }

      check2 = await EmailVerification.findOne({
        user_id: user_id,
        reason: "change_email_new",
        pin: newMailPin,
        status: 0
      }).exec();

      if (!check2) return res.json({ status: "fail", message: "verification_failed", showableMessage: "Wrong New Mail Pin" });


      if (check1 != "") {
        check1.status = 1;
        check1.save();
      }

      if (check2 != "") {
        check2.status = 1;
        check2.save();
      }

      if (check3 != "") {
        check3.status = 1;
        check3.save();
      }




      const filter = { _id: user_id, status: "1" };

      const update = { email: newEmail };
      let doc = await User.findOneAndUpdate(filter, update).exec();

      if (doc != null) {

        let changeLog = new ChangeLogsModel({
          user_id: user_id,
          type: "Change E-Mail",
          device: req.body.device ?? "Unknown",
          ip: req.body.ip ?? "Unknown",
          city: req.body.city ?? "Unknown",
        });
        changeLog.save();

        res.json({ status: "success", data: "update_success" });
      } else {
        res.json({ status: "fail", message: "update_fail", showableMessage: "Update Failed" });
      }

    } else {
      res.json({ status: "fail", message: "user_not_found", showableMessage: "User not Found" });
    }

  }
};

module.exports = changeEmail;

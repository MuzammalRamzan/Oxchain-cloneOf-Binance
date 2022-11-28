const User = require("../../models/User");
var authFile = require("../../auth.js");
const SMSVerification = require("../../models/SMSVerification");
const EmailVerification = require("../../models/MailVerification");

const changeEmail = async function (req, res) {
  var user_id = req.body.user_id;

  var newEmail = req.body.new_email;

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

      if (email != null && phone != null) {
        let emailCheck = await EmailVerification.findOne({
          user_id: user_id,
          status: 0,
          pin: req.body.emailPin,
          reason: "change_email",
        });

        let phoneCheck = await SMSVerification.findOne({
          user_id: user_id,
          status: 0,
          pin: req.body.phonePin,
          reason: "change_email",
        });

        if (emailCheck != null && phoneCheck != null) {
          result2 = true;
        } else {
          result2 = false;
        }
      } else {
        if (email != null) {
          let emailCheck = await EmailVerification.findOne({
            user_id: user_id,
            status: 0,
            pin: req.body.emailPin,
            reason: "change_email",
          });

          if (emailCheck != null) {
            result2 = true;
          } else {
            result2 = false;
          }
        } else if (phone != null) {
          let phoneCheck = await SMSVerification.findOne({
            user_id: user_id,
            status: 0,
            pin: req.body.phonePin,
            reason: "change_email",
          });

          if (phoneCheck != null) {
            result2 = true;
          } else {
            result2 = false;
          }
        }
      }

      const filter = { _id: user_id, status: 1 };

      console.log(result2);
      if (result2 === true) {
        const update = { email: newEmail };
        let doc = await User.findOneAndUpdate(filter, update).exec();

        if (doc != null) {
          res.json({ status: "success", data: "update_success" });
        } else {
          res.json({ status: "fail", message: "update_fail", showableMessage: "Update Failed" });
        }
      } else {
        res.json({ status: "fail", message: "verification_failed", showableMessage: "Verification Failed" });
      }
    } else {
      res.json({ status: "fail", message: "user_not_found", showableMessage: "User not Found" });
    }
  }
};

module.exports = changeEmail;

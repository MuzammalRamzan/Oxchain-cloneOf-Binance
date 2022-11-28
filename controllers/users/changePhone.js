const User = require("../../models/User");
var authFile = require("../../auth.js");
const SMSVerification = require("../../models/SMSVerification");
const EmailVerification = require("../../models/MailVerification");

const changePhone = async function (req, res) {
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var country_code = req.body.country_code;
  var newPhone = req.body.phone;

  let result2 = "";
  var api_key_result = req.body.api_key;

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
          reason: "change_phone",
        });

        let phoneCheck = await SMSVerification.findOne({
          user_id: user_id,
          status: 0,
          pin: req.body.phonePin,
          reason: "change_phone",
        });

        if (emailCheck != null && phoneCheck != null) {
          result2 = true;
          await EmailVerification.updateOne(
            {
              user_id: user_id,
              _id: emailCheck._id,
              status: 0,
              reason: "change_phone",
            },
            { status: 1 }
          );
          await SMSVerification.updateOne(
            {
              user_id: user_id,
              _id: phoneCheck._id,
              status: 0,
              reason: "change_phone",
            },
            { status: 1 }
          );
        } else {
          result2 = false;
        }
      } else {
        if (email != null) {
          let emailCheck = await EmailVerification.findOne({
            user_id: user_id,
            status: 0,
            pin: req.body.emailPin,
            reason: "change_phone",
          });

          if (emailCheck != null) {
            result2 = true;

            await EmailVerification.updateOne(
              {
                user_id: user_id,
                _id: emailCheck._id,
                status: 0,
                reason: "change_phone",
              },
              { status: 1 }
            );
          } else {
            result2 = false;
          }
        } else if (phone != null) {
          let phoneCheck = await SMSVerification.findOne({
            user_id: user_id,
            status: 0,
            pin: req.body.phonePin,
            reason: "change_phone",
          });

          if (phoneCheck != null) {
            result2 = true;

            await SMSVerification.updateOne(
              {
                user_id: user_id,
                _id: phoneCheck._id,
                status: 0,
                reason: "change_phone",
              },
              { status: 1 }
            );
          } else {
            result2 = false;
          }
        }
      }

      const filter = { _id: user_id, status: 1 };

      if (result2 === true) {
        const update = { phone: newPhone };
        let doc = await User.findOneAndUpdate(filter, update).exec();

        if (doc != null) {
          res.json({ status: "success", data: "update_success" });
        } else {
          res.json({ status: "fail", message: "update_fail", showableMessage: "Update Failed" });
        }
      } else {
        res.json({ status: "fail", message: "verification_failed", showableMessage: "Verification Failed" });
      }
    }
  } else {
    res.json({ status: "fail", message: "user_not_found", showableMessage: "User not Found" });
  }
};

module.exports = changePhone;

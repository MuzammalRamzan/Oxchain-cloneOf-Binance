const UserModel = require("../../models/User");
var authFile = require("../../auth.js");
const SMSVerificationModel = require("../../models/SMSVerification");
const MailVerificationModel = require("../../models/MailVerification");

const update2fa = async function (req, res) {
  var user_id = req.body.user_id;
  var twofa = req.body.twofa;
  var twofapin = req.body.twofapin;
  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  let user = await UserModel.findOne({
    _id: user_id,
    status: 1,
  }).exec();

  if (user == null) return res.json({ status: "fail", message: "user_not_found", showableMessage: "User Not Found" });



  if (result === true) {
    const filter = { _id: user_id };
    const update = { twofa: twofa };

    var result2 = await authFile.verifyToken(twofapin, twofa);

    if (result2 === true) {

      let check1 = "";
      let check3 = "";

      var email = user["email"];
      var phone = user["phone"];

      if (email != undefined && email != null && email != "") {

        if (req.body.mailPin == undefined || req.body.mailPin == null || req.body.mailPin == "") {
          return res.json({
            status: "fail",
            message: "verification_failed",
            showableMessage: "Wrong Mail Pin",
          });
        }
        check1 = await MailVerificationModel.findOne({
          user_id: user_id,
          reason: "update_2fa",
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

        if (req.body.smsPin == undefined || req.body.smsPin == null || req.body.smsPin == "") {
          return res.json({
            status: "fail",
            message: "verification_failed",
            showableMessage: "Wrong SMS Pin",
          });
        }
        check3 = await SMSVerificationModel.findOne
          ({
            user_id: user_id,
            reason: "update_2fa",
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




      UserModel.findOneAndUpdate(filter, update, (err, doc) => {
        if (err) {
          console.log(err);
          res.json({ status: "fail", message: err });
        } else {

          if (email != undefined && email != null && email != "") {

            check1.status = 1;
            check1.save();
          }

          if (phone != undefined && phone != null && phone != "") {
            check3.status = 1;
            check3.save();
          }

          res.json({ status: "success", data: "2fa_updated" });
        }
      });
    } else {
      res.json({ status: "fail", message: "wrong_auth_pin", showableMessage: "Wrong Auth Pin" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
  }
};

module.exports = update2fa;

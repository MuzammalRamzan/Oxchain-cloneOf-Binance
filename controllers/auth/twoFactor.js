const User = require("../../models/User");
const Device = require("../../models/Device");
const LoginLogs = require("../../models/LoginLogs");
var authFile = require("../../auth.js");
const MailVerificationModel = require("../../models/MailVerification");
const SmsVerificationModel = require("../../models/SMSVerification");
const mailer = require("../../mailer");
var utilities = require("../../utilities");

const twoFactor = async function (req, res) {
  var twofapin = req.body.twofapin;
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var result = await authFile.apiKeyChecker(api_key_result);
  var mailPin = req.body.mailPin;
  var smsPin = req.body.smsPin;
  var wantToTrust = req.body.wantToTrust;
  var log_id = req.body.log_id;


  let key = req.headers['key'];

  var ip = req.headers["client-ip"] || "null";
  if (result === true) {

    var user = await User.findOne({
      _id: user_id,
    }).exec();

    if (user != null) {

      let check1 = false;
      let check2 = false;

      var twofa = user["twofa"];

      if (user.twofa != null && user.twofa != undefined && user.twofa != "") {
        var result2 = await authFile.verifyToken(twofapin, twofa);

        if (result2 === false) {
          return res.json({ status: "fail", message: "2fa_failed", showableMessage: "Wrong 2fa pin" });
        }
      }

      let loginLogCheck = await LoginLogs.findOne({
        user_id: user._id,
        status: "completed"
      }).exec();

      let deviceCheckForKey = await Device.findOne({
        user_id: user._id,
        deviceId: req.body.device_id,
      }).exec();

      if (deviceCheckForKey == null) {
        return res.json({ status: "fail", message: "device_not_found", showableMessage: "Device not found" });
      }


      let deviceCheck = await Device.findOne({
        user_id: user._id,
        status: 1,
        deviceId: req.body.device_id,
      }).exec();


      if (deviceCheck == null) {

        if (user.email != null && user.email != undefined && user.email != "") {

          check1 = await MailVerificationModel.findOne({
            user_id: user_id,
            reason: "login_verification",
            pin: mailPin,
          }).exec();

          if (check1 == null) {
            return res.json({ status: "fail", message: "mail_verification_failed", showableMessage: "Wrong mail pin" });
          }
        }
        else {
          if (user.phone != null && user.phone != undefined && user.phone != "") {

            check2 = await SmsVerificationModel.findOne({
              user_id: user_id,
              reason: "login_verification",
              pin: smsPin,
            }).exec();

            if (check2 == null) {
              return res.json({ status: "fail", message: "sms_verification_failed", showableMessage: "Wrong sms pin" });
            }
          }
        }
      }




      if (check1 != false) {

        check1.status = 1;
        await check1.save();

      }

      if (check2 != false) {
        check2.status = 1;
        await check2.save();
      }


      var loginLog = await LoginLogs.find({
        user_id: user_id,
        deviceId: req.body.device_id,
      }).exec();

      let device = await Device.find({
        user_id: user_id,
        deviceId: req.body.device_id,
        status: 0
      }).exec();



      if (loginLog.length > 0) {

        //update all login logs
        await LoginLogs.updateMany({
          user_id: user_id,
          deviceId: req.body.device_id,
        }, {
          $set: {
            status: "completed",
          },
        });
      }

      if (device.length > 0) {

        await Device.updateMany({
          user_id: user_id,
          deviceId: req.body.device_id,
        }, {
          $set: {
            status: 1
          },
        });
      }


      await mailer.sendMail(
        user.email,
        'Login',
        'Successfully logged in from ' + ip
      );

      let deviceKey = "";
      if (deviceCheck == null) {
        deviceKey = deviceCheckForKey.key;
      } else {
        deviceKey = deviceCheck.key;
      }



      return res.json({
        status: "success", data: {
          key: deviceKey,
        }, showableMessage: "Login Success"
      });


    } else {
      return res.json({ status: "fail", message: "login_failed", showableMessage: "Login Failed" });
    }
  } else {
    return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
  }
};

module.exports = twoFactor;

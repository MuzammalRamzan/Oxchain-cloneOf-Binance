const User = require("../../models/User");
const Referral = require("../../models/Referral");
const SMSVerification = require("../../models/SMSVerification");
const EmailVerification = require("../../models/MailVerification");
const UserRef = require("../../models/UserRef");
const utilities = require("../../utilities");

const registerController = async (req, res) => {
  var registerType = req.body.registerType;
  var data = req.body.data;
  var pin = req.body.pin;

  var emailUnique = "true";
  var phoneUnique = "true";
  var refStatus = "false";
  var reffer = req.body.reffer;
  if (reffer) {
    refStatus = "yes";
  } else {
    refStatus = "no";
  }

  let newUser;


  if (registerType == "email" && pin != '0') {
    let checkEmailPin = await EmailVerification.findOne({
      email: data,
      pin: pin,
      reason: "register_mail",
      status: 0
    }).exec();

    if (checkEmailPin == null) {
      res.json({ status: "fail", message: "pin_not_match", showableMessage: "Pin not match" });
      return;
    } else {
      EmailVerification.findOneAndUpdate(
        { email: data, reason: "register_mail" },
        { status: "1" },
        function (err, room) {
          if (err) {
            console.log(err);
          } else {
            console.log("pin status updated");
          }
        }
      );
    }
  }

  if (registerType == "phone" && pin !== '0') {
    let checkPhonePin = await SMSVerification.findOne({
      country_code: req.body.country_code,
      phone: data,
      pin: pin,
      reason: "register_sms",
      status: 0
    }).exec();

    if (checkPhonePin == null) {
      res.json({ status: "fail", message: "pin_not_match", showableMessage: "Pin not match" });
      return;
    } else {
      SMSVerification.findOneAndUpdate(
        { phone: data, reason: "register_sms" },
        { status: "1" },
        function (err, room) {
          if (err) {
            console.log(err);
          } else {
            console.log("pin status updated");
          }
        }
      );
    }
  }

  async function uniqueChecker() {
    if (registerType == "email") {
      let emailC = await User.findOne({ email: req.body.data }).exec();
      if (emailC != null) {
        emailUnique = "false";
      }
    } else {
      let phoneC = await User.findOne({
        phone_number: req.body.data,
      }).exec();
      console.log(phoneC);
      if (phoneC != null) {
        phoneUnique = "false";
      }
    }
  }

  async function register() {
    if (emailUnique == "true" && phoneUnique == "true") {
      if (registerType == "email") {
        newUser = new User({
          email: data,
          password: utilities.hashData(req.body.password),
          api_key_result: req.body.api_key,
          status: 1,
        });
      } else {
        newUser = new User({
          country_code: "90",
          phone_number: req.body.data,
          password: utilities.hashData(req.body.password),
          api_key_result: req.body.api_key,
          status: 1,
        });
      }
      console.log("Bura 1");
      let usr = await newUser.save();
      console.log("Bura 2");
      if (refStatus == "yes") {
        let user = await UserRef.findOne({ refCode: reffer }).exec();

        if (user != null) {
          var newReferral = new Referral({
            user_id: usr._id,
            reffer: reffer,
          });
          newReferral.save();
        } else {
          res.json({ status: "fail", message: "referral_not_found", showableMessage: "Referral not found" });
        }
      }
      var regUserId = usr._id;
      // make unique control
      var refCode = utilities.makeId(10);
      const newRef = new UserRef({
        user_id: regUserId,
        refCode: refCode,
      });
      await newRef.save();
      res.json({ status: "success", data: newRef });
    } else {
      var uniqueArray = [];
      uniqueArray.push({
        emailUnique: emailUnique,
        phoneUnique: phoneUnique,
        response: "not_unique",
      });
      res.json({ status: "fail", message: uniqueArray[0] });
    }
  }

  uniqueChecker().then(() => {
    register();
  });
};

module.exports = registerController;

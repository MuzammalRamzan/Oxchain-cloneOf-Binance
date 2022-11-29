const User = require("../../models/User");
const Referral = require("../../models/Referral");
const RegisterMail = require("../../models/RegisterMail");
const RegisterSMS = require("../../models/RegisterSMS");
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
    let checkEmailPin = await RegisterMail.findOne({
      email: data,
      pin: pin,
    }).exec();

    if (checkEmailPin == null) {
      res.json({ status: "fail", message: "pin_not_match", showableMessage: "Pin not match" });
      return;
    } else {
      RegisterMail.findOneAndUpdate(
        { email: data },
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
    let checkPhonePin = await RegisterSMS.findOne({
      phone: data,
      pin: pin,
    }).exec();

    if (checkPhonePin == null) {
      res.json({ status: "fail", message: "pin_not_match", showableMessage: "Pin not match" });
      return;
    } else {
      RegisterSMS.findOneAndUpdate(
        { phone: data },
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

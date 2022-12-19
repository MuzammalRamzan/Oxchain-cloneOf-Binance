const SecurityKey = require("../../models/SecurityKey");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");
const User = require("../../models/User");
const RegisterMail = require("../../models/RegisterMail");
const SMSVerification = require("../../models/SMSVerification");
const MailVerification = require("../../models/MailVerification");

const addSecurityKey = async function (req, res) {
  var user_id = req.body.user_id;
  var security_key = utilities.hashData(req.body.security_key);
  var api_key_result = req.body.api_key;
  var trade = req.body.trade;
  var wallet = req.body.wallet;
  var deposit = req.body.deposit;
  var withdraw = req.body.withdraw;
  var twofapin = req.body.twofapin;

  console.log("2");

  const result = await authFile.apiKeyChecker(api_key_result);
  if (!result) return res.json({ status: "fail", message: "403 Forbidden" });

  const securityKey = await SecurityKey.findOne({
    user_id: user_id,
    status: 1,
  }).lean();

  if (securityKey)
    return res.json({ status: "success", data: "secury_key_active" });

  const user = await User.findOne({ _id: user_id }).lean();
  let twofaCheck;
  let emailCheck;
  let phoneCheck;

  if (user && user.twofa) {
    twofaCheck = await authFile.verifyToken(twofapin, twofa);
    if (!twofaCheck) return res.json({ status: "fail", message: "2fa_failed" });

  } else {
    if (user.email != null) {
      emailCheck = await MailVerification.findOne({
        user_id: user_id,
        pin: req.body.mailPin,
        reason: "addSecurityKey",
        status: "0",
      }).lean();

      if (!emailCheck) return res.json({ status: "fail", message: "2fa_failed", showableMessage: "Wrong Mail pin" });
    }

    if (user.phone_number != null) {
      phoneCheck = await SMSVerification.findOne({
        user_id: user_id,
        pin: req.body.phonePin,
        reason: "addSecurityKey",
        status: "0",
      }).lean();

      if (!phoneCheck) return res.json({ status: "fail", message: "2fa_failed", showableMessage: "Wrong SMS pin" });
    }
  }

  const newSecurityKey = new SecurityKey({
    user_id: user_id,
    key: security_key,
    status: 1,
    trade: trade,
    wallet: wallet,
    deposit: deposit,
    withdraw: withdraw,
  });
  await newSecurityKey.save();

  if (emailCheck) {
    await MailVerification.updateOne({ _id: emailCheck._id }, { status: "1" });
  }

  if (phoneCheck) {
    await SMSVerification.updateOne
      ({ _id: phoneCheck._id }, { status: "1" });
  }
  return res.json({ status: "success", message: "security_key_added" });
};

module.exports = addSecurityKey;

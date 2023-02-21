const SecurityKey = require("../../models/SecurityKey");
var authFile = require("../../auth.js");
const User = require("../../models/User");
const RegisterMail = require("../../models/RegisterMail");
const RegisterSMS = require("../../models/RegisterSMS");
const utilities = require("../../utilities.js");
const MailVerification = require("../../models/MailVerification");
const SMSVerification = require("../../models/SMSVerification");

const updateSecurityKey = async function (req, res) {
  var user_id = req.body.user_id;
  var security_key = req.body.security_key;
  var api_key_result = req.body.api_key;
  var trade = req.body.trade;
  var wallet = req.body.wallet;
  var deposit = req.body.deposit;
  var withdraw = req.body.withdraw;

  var twofapin = req.body.twofapin ?? null;

  let phonePin = req.body.phonePin ?? null;
  let mailPin = req.body.mailPin ?? null;

  const result = await authFile.apiKeyChecker(api_key_result);
  if (!result) return res.json({ status: "fail", message: "403 Forbidden" });

  const user = await User.findOne({ _id: user_id }).exec();
  let twofaCheck;
  let emailCheck = "";
  let phoneCheck = "";

  if (!user) return res.json({ status: "fail", message: "user_not_found", showableMessage: "User not found" });

  if (user.twofa != null) {
    twofaCheck = await authFile.verifyToken(twofapin, user.twofa);
    if (!twofaCheck) return res.json({ status: "fail", message: "failed", showableMessage: "Wrong 2FA pin" });
  }

  if (user.email != null) {
    emailCheck = await MailVerification.findOne({
      user_id: user_id,
      pin: mailPin,
      reason: "updateSecurityKey",
      status: "0",
    }).exec();
    if (!emailCheck) return res.json({ status: "fail", message: "failed", showableMessage: "Wrong Mail pin" });
  }

  if (user.phone_number != null) {
    phoneCheck = await SMSVerification.findOne({
      user_id: user_id,
      pin: phonePin,
      reason: "updateSecurityKey",
      status: "0",
    }).exec();
    if (!phoneCheck) return res.json({ status: "fail", message: "failed", showableMessage: "Wrong SMS pin" });
  }


  const securityKey = await SecurityKey.findOne({
    user_id: user_id,
    status: "1",
    _id: req.body.id,
  }).exec();

  if (!securityKey)
    return res.json({ status: "fail", message: "security_key_not_found", showableMessage: "Security key not found" });

  const filter = { _id: req.body.id, status: "1" };


  if (security_key != null) {
    await SecurityKey.findOneAndUpdate(filter, {
      wallet: wallet,
      deposit: deposit,
      withdraw: withdraw,
      trade: trade,
      key: utilities.hashData(security_key)
    });
  }
  else {
    await SecurityKey.findOneAndUpdate(filter, {
      wallet: wallet,
      deposit: deposit,
      withdraw: withdraw,
      trade: trade,
    });
  }

  if (emailCheck) {
    emailCheck.status = "1";
    await emailCheck.save();

  }

  if (phoneCheck) {
    phoneCheck.status = "1";
    await phoneCheck.save();
  }


  return res.json({ status: "success", data: "update_success", showableMessage: "Security key updated" });
};

module.exports = updateSecurityKey;

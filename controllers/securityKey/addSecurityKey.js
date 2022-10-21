const SecurityKey = require("../../models/SecurityKey");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");
const User = require("../../models/Test");
const RegisterMail = require("../../models/RegisterMail");
const RegisterSMS = require("../../models/RegisterSMS");

const addSecurityKey = async function (req, res) {
  var user_id = req.body.user_id;
  var security_key = utilities.hashData(req.body.security_key);
  var api_key_result = req.body.api_key;
  var trade = req.body.trade;
  var wallet = req.body.wallet;
  var deposit = req.body.deposit;
  var withdraw = req.body.withdraw;
  var twofapin = req.body.twofapin;

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

  if (user && user.twofa) {
    twofaCheck = await authFile.verifyToken(twofapin, twofa);
  } else {
    twofaCheck = await RegisterMail.findOne({
      email: user.email,
      pin: twofapin,
      status: "1",
    }).lean();
    if (!twofaCheck)
      twofaCheck = await RegisterSMS.findOne({
        phone_number: user.phone_number,
        pin: twofapin,
        status: "1",
      }).lean();
  }
  if (!twofaCheck) return res.json({ status: "fail", message: "2fa_failed" });

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

  return res.json({ status: "success", data: "" });
};

module.exports = addSecurityKey;

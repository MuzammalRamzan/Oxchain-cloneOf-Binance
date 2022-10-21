const SecurityKey = require("../../models/SecurityKey");
var authFile = require("../../auth.js");
const User = require("../../models/Test");
const RegisterMail = require("../../models/RegisterMail");
const RegisterSMS = require("../../models/RegisterSMS");

const updateSecurityKey = async function (req, res) {
  var user_id = req.body.user_id;
  var security_key = req.body.security_key;
  var api_key_result = req.body.api_key;
  var trade = req.body.trade;
  var wallet = req.body.wallet;
  var deposit = req.body.deposit;
  var withdraw = req.body.withdraw;

  var twofapin = req.body.twofapin;

  const result = await authFile.apiKeyChecker(api_key_result);
  if (!result) return res.json({ status: "fail", message: "403 Forbidden" });

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

  const securityKey = await SecurityKey.findOne({
    user_id: user_id,
    status: "1",
    _id: req.body.id,
  }).lean();

  if (!securityKey)
    return res.json({ status: "fail", message: "security_key_not_found" });

  const filter = { _id: req.body.id, status: "1" };
  const update = {
    wallet: wallet,
    deposit: deposit,
    withdraw: withdraw,
    trade: trade,
  };
  await SecurityKey.findOneAndUpdate(filter, update);

  return res.json({ status: "success", data: "update_success" });
};

module.exports = updateSecurityKey;

const User = require("../../models/User");
const RegisterMail = require("../../models/RegisterMail");
const RegisterSMS = require("../../models/RegisterSMS");
const SecurityKey = require("../../models/SecurityKey");
var authFile = require("../../auth.js");

const deleteSecurityKey = async (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var twofapin = req.body.twofapin;

  const result = await authFile.apiKeyChecker(api_key_result);
  if (!result) return res.json({ status: "fail", message: "403 Forbidden" });

  const user = await User.findOne({ _id: user_id }).lean();
  let twofaCheck;

  if (user && user.twofa) {
    twofaCheck = await authFile.verifyToken(twofapin, user.twofa);
  } else {
    twofaCheck = await RegisterMail.findOne({
      email: user.email,
      pin: twofapin,
    }).lean();
    if (!twofaCheck)
      twofaCheck = await RegisterSMS.findOne({
        phone_number: user.phone_number,
        pin: twofapin,
      }).lean();
  }
  if (!twofaCheck) return res.json({ status: "fail", message: "2fa_failed", showableMessage: "Authentication failed" });

  await SecurityKey.findOneAndUpdate(
    { user_id: user_id, _id: req.body.key_id },
    { status: 0 }
  );

  return res.json({ status: "success", data: "" });
};

module.exports = deleteSecurityKey;

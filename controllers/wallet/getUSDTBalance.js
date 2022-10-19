const Wallet = require("../../models/Wallet");
var authFile = require("../../auth.js");

const getUSDTBalance = async function (req, res) {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var list = await Wallet.findOne({
      user_id: req.body.user_id,
      coin_id: "62bc116eb65b02b777c97b3d",
    }).exec();
    if (list == null) {
      res.json({ status: "fail", message: "no wallet" });
      return;
    }

    res.json({ status: "success", data: list.amount });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
};

module.exports = getUSDTBalance;

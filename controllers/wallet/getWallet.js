const Wallet = require("../../models/Wallet");
const Pairs = require("../../models/Pairs");
var authFile = require("../../auth.js");

const getWallet = async function (req, res) {
  var api_key_result = req.body.api_key;
  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var _wallets = await Wallet.find({ user_id: req.body.user_id }).exec();
    var wallets = new Array();
    for (var i = 0; i < _wallets.length; i++) {
      let item = _wallets[i];
      let pairInfo = await Pairs.findOne({ symbolOneID: item.coin_id }).exec();
      if (pairInfo == null) continue;
      wallets.push({
        id: item._id,
        coin_id: item.coin_id,

        balance: item.amount,
        address: item.address,
        symbolName: pairInfo.name,
      });
    }
    res.json({ status: "success", data: wallets });
  } else {
    res.json({ status: "fail", message: "not_found" });
  }
};

module.exports = getWallet;

const Wallet = require("../../models/Wallet");
const Pairs = require("../../models/Pairs");
var authFile = require("../../auth.js");
const CoinList = require("../../models/CoinList");

const ApiKeysModel = require("../../models/ApiKeys");
const ApiRequest = require("../../models/ApiRequests");

const getWallet = async function (req, res) {



  var api_key_result = req.body.api_key;

  let api_result = await authFile.apiKeyChecker(api_key_result);
  let apiRequest = "";

  if (api_result === false) {

    let key = req.headers["key"];

    if (!key) {
      return res.json({ status: "fail", message: "key_not_found" });
    }

    if (!req.body.device_id || !req.body.user_id) {
      return res.json({ status: "fail", message: "invalid_params (key, user id, device_id)" });
    }

    let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


    if (checkKey === "expired") {
      return res.json({ status: "fail", message: "key_expired" });
    }

    if (!checkKey) {
      return res.json({ status: "fail", message: "invalid_key" });
    }
    
    let checkApiKeys = "";

    checkApiKeys = await ApiKeysModel.findOne({
      api_key: api_key_result,
      get_balance: "1"
    }).exec();

    if (checkApiKeys != null) {
      apiRequest = new ApiRequest({
        api_key: api_key_result,
        request: "getBalance",
        ip: req.body.ip ?? req.connection.remoteAddress,
        user_id: checkApiKeys.user_id,
      });
      await apiRequest.save();
    }
    else {
      res.json({ status: "fail", message: "Forbidden 403" });
      return;
    }
  }

  var _wallets = await Wallet.find({
    user_id: req.body.user_id
  }).exec();

  var wallets = new Array();

  for (var i = 0; i < _wallets.length; i++) {

    let item = _wallets[i];

    let coinInfo = await CoinList.findOne({ _id: item.coin_id }).exec();

    if (coinInfo == null) continue;

    if (coinInfo.name == "Margin") continue;

    wallets.push({
      id: item._id,
      coin_id: item.coin_id,
      balance: item.amount,
      symbolName: coinInfo.symbol + "/USDT",
      symbol: coinInfo.symbol,
      name: coinInfo.name,
      icon: coinInfo.image_url,
    });
  }

  res.json({ status: "success", data: wallets });



};

module.exports = getWallet;

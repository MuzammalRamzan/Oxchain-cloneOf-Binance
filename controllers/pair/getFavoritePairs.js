const FavoriteCoin = require("../../models/FavoriteCoin");
const Pairs = require("../../models/Pairs");
const CoinList = require("../../models/CoinList");
var authFile = require("../../auth");

const GetFavoritePairs = async (req, res) => {
  try {

    let result = await authFile.apiKeyChecker(req.body.api_key);
    if (result == false) {
      return res.json({ status: "fail", message: "403 Forbidden" });
    }

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

    let user_id = req.body.user_id;
    let page = req.body.page;
    let favs = await FavoriteCoin.find({ user_id: user_id, page: page });

    let returnData = [];
    for (let i = 0; i < favs.length; i++) {
      let coinlist = await CoinList.findOne({ _id: favs[i].coin_id });

      returnData.push({
        coin_id: favs[i].coin_id,
        pair_name: coinlist.symbol + "/USDT",
      });
    }
    res.json({ status: "success", data: returnData });
  } catch (err) {
    res.json({ status: "fail", msg: err.message });
  }
};
module.exports = GetFavoritePairs;

const FavoriteCoin = require("../../models/FavoriteCoin");
const Pairs = require("../../models/Pairs");
const CoinList = require("../../models/CoinList");

const GetFavoritePairs = async (req, res) => {
  try {
    let user_id = req.body.user_id;
    let favs = await FavoriteCoin.find({ user_id: user_id });

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

const FavoriteCoin = require("../../models/FavoriteCoin");
const Pairs = require("../../models/Pairs");

const SetFavoritePair = async (req, res) => {
  try {
    let user_id = req.body.user_id;
    let coin_id = req.body.coin_id;
    
    let pairData = await Pairs.findOne({
      name: coin_id.replace('_', '/'),
    });

    if(pairData == null) {
      res.json({ status: "fail", msg: "invalid coin" });
      return;
    }

    let check = await FavoriteCoin.findOne({
      user_id: user_id,
      coin_id: pairData.symbolOneID,
    });
    if (check == null) {
      let save = new FavoriteCoin({
        user_id: user_id,
        coin_id: pairData.symbolOneID,
      });
      await save.save();
      res.json({ status: "success", data: "OK" });
    } else {
      await check.remove();
      res.json({ status: "success", data: "OK" });
    }
  } catch (err) {
    res.json({ status: "fail", msg: err.message });
  }
};
module.exports = SetFavoritePair;

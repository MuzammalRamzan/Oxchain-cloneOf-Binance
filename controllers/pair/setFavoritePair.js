const FavoriteCoin = require("../../models/FavoriteCoin");
const Pairs = require("../../models/Pairs");
const UserModel = require("../../models/User");

const SetFavoritePair = async (req, res) => {
  try {
    let user_id = req.body.user_id;
    let coin_id = req.body.coin_id;
    let page = req.body.page;
    let removeAll = req.body.removeAll;


    if (user_id == null) {
      res.json({ status: "fail", msg: "invalid user" });
      return;
    }

    let userCheck = await UserModel.findOne({ _id: user_id });
    if (userCheck == null) {
      res.json({ status: "fail", msg: "invalid user" });
      return;
    }

    if (removeAll == "true") {

      await FavoriteCoin.deleteMany({ user_id: user_id });

      return res.json({ status: "success", data: "OK" });

    }

    let pairData = await Pairs.findOne({
      name: coin_id.replace('_', '/'),
    });

    if (pairData == null) {
      res.json({ status: "fail", msg: "invalid coin" });
      return;
    }

    let check = await FavoriteCoin.findOne({
      user_id: user_id,
      coin_id: pairData.symbolOneID,
      page: page,
    });
    if (check == null) {
      let save = new FavoriteCoin({
        user_id: user_id,
        coin_id: pairData.symbolOneID,
        page: page,
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

const FavoriteCoin = require("../../models/FavoriteCoin");
const Pairs = require("../../models/Pairs");
const UserModel = require("../../models/User");
var authFile = require("../../auth");

const SetFavoritePair = async (req, res) => {
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
      return res.json({ status: "fail", message: "invalid_params" });
    }

    let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


    if (checkKey === "expired") {
      return res.json({ status: "fail", message: "key_expired" });
    }

    if (!checkKey) {
      return res.json({ status: "fail", message: "invalid_key" });
    }

    let user_id = req.body.user_id;
    let symbol = req.body.symbol;
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
      name: symbol.replace('_', '/'),
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

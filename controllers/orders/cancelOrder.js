const Wallet = require("../../models/Wallet");
const Pairs = require("../../models/Pairs");
const Orders = require("../../models/Orders");
var authFile = require("../../auth.js");

const cancelOrder = async function (req, res) {
  var user_id = req.body.user_id;
  var order_id = req.body.order_id;
  var pair_id = req.body.pair_id;

  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
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
    const filter = { user_id: user_id, _id: order_id };
    const update = { status: "2" };
    var pair = await Pairs.findOne({ id: pair_id }).exec();

    if (pair != null) {
      var symbolTwoID = pair.symbolTwoID;
      var symbolOneID = pair.symbolOneID;

      var wallet = await Wallet.findOne({
        user_id: user_id,
        coin_id: symbolTwoID,
      }).exec();

      if (wallet != null) {
        var balance = wallet.amount;
        let order = await Orders.findOne(filter).exec();

        if (order != null) {
          var priceAmount = order.priceAmount;
          var newBalance = balance + priceAmount;
          var update2 = { amount: newBalance };
          Wallet.findOneAndUpdate(
            { user_id: user_id, coin_id: symbolTwoID },
            update2,
            (err, doc) => {
              if (err) {
                res.json({ status: "fail", message: error });
              } else {
                Orders.findOneAndUpdate(filter, update, (err, doc) => {
                  if (err) {
                    res.json({ status: "fail", message: err });
                  } else {
                    res.json({ status: "success", data: "cancelled" });
                  }
                });
              }
            }
          );
        } else {
          res.json({ status: "fail", message: "pair_not_found" });
        }
      }
    } else {
      res.json({ status: "fail", message: "wallet_not_found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = cancelOrder;

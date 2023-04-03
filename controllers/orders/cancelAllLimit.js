const Wallet = require("../../models/Wallet");
const Pairs = require("../../models/Pairs");

const MarginOrder = require("../../models/MarginOrder");
const Orders = require("../../models/Orders");

var authFile = require("../../auth");
const cancelAllLimit = async function (req, res) {


  let api_key_result = req.body.api_key;
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

    var user_id = req.body.user_id;
    if (user_id == null || user_id == '')
      return res.json({ status: 'fail', message: "user not found" });
    let orders = await Orders.find({
      user_id: user_id,
      status: 1,
      $or: [
        {
          type: "limit",
        },
        {
          type: "stop_limit",
        }
      ]

    });


    for (var i = 0; i < orders.length; i++) {
      let order = orders[i];
      let wallet = null;

      try {
        let amount = parseFloat(order.amount);
        if (amount == null || amount == '') {
          order.status = -1;
          await order.save();
          continue;
        }
        let pair = await Pairs.findOne({ symbolOneID: order.pair_id }).exec();

        if (order.method == "buy") {
          wallet = await Wallet.findOne({
            coin_id: pair.symbolTwoID,
            user_id: order.user_id,
          });
          if (wallet == null) {
            order.status = -1;
            await order.save();
            continue;
          }
          wallet.amount = parseFloat(wallet.amount) + (parseFloat(order.target_price) * amount);
          await wallet.save();
          order.status = -1;
          await order.save();
        } else {
          wallet = await Wallet.findOne({
            coin_id: pair.symbolOneID,
            user_id: order.user_id,
          });
          if (wallet == null) {
            order.status = -1;
            await order.save();
            continue;
          }
          wallet.amount = parseFloat(wallet.amount) + parseFloat(amount);
          await wallet.save();
          order.status = -1;
          await order.save();

        }
      } catch (err) {
        console.log(err.message);
        return res.json({ status: 'fail', message: err.message });

      }
    }
    return res.json({ status: 'success', data: 'ok' });

  } else {
    return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
  }

};

module.exports = cancelAllLimit;

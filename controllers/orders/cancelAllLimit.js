const Wallet = require("../../models/Wallet");
const Pairs = require("../../models/Pairs");

const MarginOrder = require("../../models/MarginOrder");
const Orders = require("../../models/Orders");

const cancelAllLimit = async function (req, res) {


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

  }).exec();
  for (var i = 0; i < orders.length; i++) {
    let order = orders[i];
    let wallet = null;

    try {
      let amount = parseFloat(order.amount);
      if (amount == null || amount == '') {
        order.status = 2;
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
          order.status = 2;
          await order.save();
          continue;
        }
        wallet.amount = parseFloat(wallet.amount) + (parseFloat(order.target_price) * amount);
        await wallet.save();
      } else {
        wallet = await Wallet.findOne({
          coin_id: pair.symbolOneID,
          user_id: order.user_id,
        });
        if (wallet == null) {
          order.status = 2;
          await order.save();
          continue;
        }
        wallet.amount = parseFloat(wallet.amount) + parseFloat(amount);
        await wallet.save();
        order.status = 2;
        await order.save();

      }
    } catch (err) {
      console.log(order);
      console.log(wallet);
      console.log(err.message);
      return res.json({ status: 'fail', message: err.message });
      return;

    }
  }
  return res.json({ status: 'success', data: 'ok' });
};

module.exports = cancelAllLimit;

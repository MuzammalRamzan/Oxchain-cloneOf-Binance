const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");
var authFile = require("../../auth.js");

const cancelAllFutureLimit = async function (req, res) {

  let user_id = req.body.user_id;
  if (user_id == null || user_id == '') return res.json({ status: "false", message: "User not found" });
  var api_key_result = req.body.api_key;
  var result = await authFile.apiKeyChecker(api_key_result);
  if (result == false) {
    res.json({ status: "false", message: "Forbidden 403" });
    return;
  }

  let orders = await FutureOrder.find({
    user_id: user_id,
    status: 1,
    $or: [
      {
        method: "limit",
      },
      {
        method: "stop_limit",
      }
    ]

  });

  for (var o = 0; o < orders.length; o++) {
    let order = orders[o];
    order.status = -1;
    if (order.FutureOrder == null) {

      if (order.isFallOutWallet) {
        let userBalance = await FutureWalletModel.findOne({
          user_id: user_id,
        }).exec();

        userBalance.amount = userBalance.amount + order.usedUSDT;
        await userBalance.save();
      }
    }
    await order.save();

  }



  res.json({ status: "success", message: "removed" });
};

module.exports = cancelAllFutureLimit;

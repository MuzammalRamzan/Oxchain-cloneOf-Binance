const { default: axios } = require("axios");
const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");

const FutureAmountClose = async (req, res) => {
  let user_id = req.body.user_id;
  let order_id = req.body.order_id;
  let amount = req.body.amount;

  let order = await FutureOrder.findOne({
    _id: order_id,
    user_id: user_id,
    method: "market",
    status: 0,
  });

  if (order == null) {
    res.json({ status: "fail", message: "Order not found" });
    return;
  }

  let wallet = await FutureWalletModel.findOne({ user_id: user_id });
  if (wallet == null) {
    res.json({ status: "fail", message: "User not found" });
    return;
  }
  let binanceData = await axios(
    "http://18.130.193.166:8542/price?symbol=" +
      order.pair_name.replace("/", "")
  );
  let marketPrice = parseFloat(binanceData.data.data.ask);

  amount = parseFloat(amount);

  if (order.amount < amount) {
    res.json({ status: "fail", message: "Amount is too big" });
    return;
  }

  let usdtPrice = parseFloat(order.amount) * marketPrice;

  let usedUSDT = order.usedUSDT;
  let pnl = order.pnl;

  let oran = amount / parseFloat(usedUSDT + pnl);

  let cikarilacakUSDT = parseFloat(usedUSDT) * oran;
  let cikarilacakPnl = parseFloat(pnl) * oran;

  order.usedUSDT = parseFloat(usedUSDT) - cikarilacakUSDT;

  if (order.pnl > 0) {
    order.pnl = parseFloat(pnl) - cikarilacakPnl;
  } else {
    order.pnl = parseFloat(pnl) + cikarilacakPnl;
  }

  if(order.amount == amount){
    order.status = 1;
  }
  wallet.amount = parseFloat(wallet.amount) + usdtPrice;
  order.amount = parseFloat(order.amount) - amount;
  await order.save();
  await wallet.save();
  res.send({ status: "success", data: "OK" });
};

module.exports = FutureAmountClose;

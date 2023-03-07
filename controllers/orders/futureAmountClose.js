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

  let pairname = order.pair_name.replace("/", "");
  let binanceData = await axios(
    "http://global.oxhain.com:8542/price?symbol=" + pairname
  );

  let marketPrice = parseFloat(binanceData.data.data.ask);

  amount = parseFloat(amount);

  if (order.amount < amount) {
    res.json({ status: "fail", message: "Amount is too big" });
    return;
  }

  order.amount = parseFloat(order.amount) - amount;
  if (order.amount <= 0) {
    order.status = 1;
  }

  let totalUsdt = parseFloat(amount / parseFloat(order.leverage)) * marketPrice;
  let withOutTotalUsdt =
    (parseFloat(amount) / parseFloat(order.leverage)) * marketPrice;
  wallet.amount = parseFloat(wallet.amount) + withOutTotalUsdt + order.pnl;
  order.usedUSDT = parseFloat(order.usedUSDT) - totalUsdt;

  await order.save();
  await wallet.save();
  res.json({ status: "success", data: "OK" });
  /*
  let usdtPrice = parseFloat(order.amount) * marketPrice;

  let usedUSDT = order.usedUSDT;
  let pnl = order.pnl;

  let oran = parseFloat(amount) / parseFloat(usedUSDT + pnl);

  console.log("oran:" + oran);

  let cikarilacakUSDT =
    (parseFloat(usedUSDT) * oran * marketPrice) / order.leverage;
  let cikarilacakPnl = parseFloat(pnl) * oran;

  order.usedUSDT = parseFloat(usedUSDT) - cikarilacakUSDT;
  order.amount = parseFloat(order.amount) - amount;
  */
  /*
  if (order.type == 'buy') {
    if (order.pnl > 0) {
      //order.pnl = parseFloat(pnl) + cikarilacakPnl;
      order.pnl = parseFloat(pnl);
    } else {
      order.pnl = parseFloat(pnl) - cikarilacakPnl;
  
    }
  } else {
    if (order.pnl > 0) {
      order.pnl = parseFloat(pnl) - cikarilacakPnl;
    } else {
      order.pnl = parseFloat(pnl) + cikarilacakPnl;

    }
  }
*/
  /*
  if (order.amount <= 0 || order.amount <= amount) {
    order.status = 1;
  }



  wallet.amount = parseFloat(wallet.amount) + cikarilacakUSDT;

  console.log("cikarilacakUSDT : ", cikarilacakUSDT);
  console.log("cikarilacakPnl : ", cikarilacakPnl);
  await order.save();
  await wallet.save();
  res.json({ status: "success", data: "OK" });
  */
};

module.exports = FutureAmountClose;

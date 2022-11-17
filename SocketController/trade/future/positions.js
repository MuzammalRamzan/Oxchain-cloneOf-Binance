const FutureOrder = require("../../../models/FutureOrder");
const FutureWalletModel = require("../../../models/FutureWalletModel");
const MarginWalletId = "62ff3c742bebf06a81be98fd";
const FuturePositions = async (ws, user_id) => {
    let orders = await FutureOrder.find({ user_id: user_id, method:"market", status: 0 });
    let assets = await GetFutureLiqPrice(orders);
    ws.send(JSON.stringify({page:"future", type: 'positions', content: assets }));

    FutureOrder.watch([{ $match: { operationType: { $in: ['insert', 'update', 'remove', 'delete'] } } }]).on('change', async data => {
        let orders = await FutureOrder.find({ user_id: user_id, method:"market", status: 0 });
        let assets = await GetFutureLiqPrice(orders);
        ws.send(JSON.stringify({ page:"future", type: 'positions', content: assets }));
    });

}
async function GetFutureLiqPrice(orders) {

    for (var i = 0; i < orders.length; i++) {
       let order = orders[i];
       if (order.status == 1) continue;
       if (order.method == 'market') {
          if (order.future_type == 'isolated') {
             if (order.type == 'buy') {
 
                order.liqPrice = (order.open_price - (order.open_price / (order.leverage * 1.0)));
                orders[i] = order;
             } else {
                order.liqPrice = (order.open_price + (order.open_price / (order.leverage * 1.0)));
                orders[i] = order;
             }
          }
          else if (order.future_type == 'cross') {
             orders[i] = await GetFutureLiqPrice(order);
          }
       }
    }
    return orders;
 
 }


async function GetFutureLiqPrice(order) {
    let getOpenOrders = await FutureOrder.aggregate([
       {
          $match: { user_id: order.user_id, status: 0, method: "market", future_type: "cross" },
       },
 
       {
          $group: {
             _id: "$user_id",
             total: { $sum: "$pnl" },
             usedUSDT: { $sum: "$usedUSDT" },
          },
       },
    ]);
 
    let wallet = await FutureWalletModel.findOne({ user_id: order.user_id }).exec();
    
    let totalWallet = wallet.amount;
 
    if (totalWallet < 0) {
       totalWallet = 0;
    }
 
 
 
    let order_total = 0;
    let order_usedUSDT = 0;
    if (getOpenOrders.length > 0) {
       order_total = getOpenOrders[0].total
       order_usedUSDT = getOpenOrders[0].usedUSDT;
    }
 
 
    let kasa = (totalWallet + (order_total - order.pnl) + order_usedUSDT);
    console.log("-------");
    console.log(kasa);
    console.log(order_usedUSDT);
    console.log(totalWallet);
    console.log("-------");
    let liqPrice = 0.0;
    if (order.type == 'buy')
       liqPrice = order.open_price - ((kasa / order_usedUSDT) * (order.open_price / (order.leverage * 1.0)));
 
    else
       liqPrice = order.open_price + ((kasa / order_usedUSDT) * (order.open_price / (order.leverage * 1.0)));
    if (liqPrice < 0) {
       liqPrice *= -1;
    }
    order.liqPrice = liqPrice;
    return order;
 }
 
module.exports = FuturePositions;
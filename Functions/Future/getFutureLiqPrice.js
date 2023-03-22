const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");

async function GetFutureLiqPrice(orders) {
    let assets = [];
    for (var i = 0; i < orders.length; i++) {
      let order = orders[i];
      if (order.status == 1) continue;
      if (order.method == "market") {
        if (order.future_type == "isolated") {
          if (order.type == "buy") {
            if (order.adjusted != 0) {
              let anaPara = order.usedUSDT;
  
              let adjusted = order.adjusted;
              let liqHesaplayici = order.open_price / (order.leverage * 1.0);
  
              let anaParaBoluAdjusted =
                parseFloat(anaPara) / parseFloat(adjusted);
  
              let AdjustedLiq =
                (parseFloat(adjusted) * parseFloat(liqHesaplayici)) / anaPara;
  
            
            
              order.liqPrice =
                order.open_price -
                (order.usedUSDT) * (order.open_price / (order.leverage * 1.0)) + AdjustedLiq;
              orders[i] = order;
            } else {
              order.liqPrice = order.open_price - (order.usedUSDT) * (order.open_price / (order.leverage * 1.0));
              if(order.liqPrice < 0) {
                order.liqPrice *= -1;
              }
              orders[i] = order;
            }
          } else {
            if (order.adjusted != 0) {
              let anaPara = order.usedUSDT;
  
              let adjusted = order.adjusted;
              let liqHesaplayici = order.open_price / (order.leverage * 1.0);
  
              let anaParaBoluAdjusted =
                parseFloat(anaPara) / parseFloat(adjusted);
  
              let AdjustedLiq =
                (parseFloat(adjusted) * parseFloat(liqHesaplayici)) / anaPara;
  
              order.liqPrice = order.open_price +
              (order.usedUSDT) * (order.open_price / (order.leverage * 1.0)) + AdjustedLiq;
              orders[i] = order;
            } else {
              order.liqPrice = order.open_price +
              (order.usedUSDT) * (order.open_price / (order.leverage * 1.0)) ;
              orders[i] = order;
            }
          }
        } else if (order.future_type == "cross") {
          orders[i] = await GetFutureCrossLiqPrice(order);
        }
      }
      let mark_price =
      order.type == "buy"
        ? global.MarketData[order.pair_name.replace("/", "")].ask
        : global.MarketData[order.pair_name.replace("/", "")].bid;
      let side = order.type == "buy" ? 1.0 : -1.0;
      let lastPrice = global.MarketData[order.pair_name.replace("/", "")].ask;
      let pnl = order.amount * side * (lastPrice - order.open_price);
      let initialMargin = (lastPrice - order.open_price) * side * order.amount;
      let imr = 1.0 / order.leverage;
      let entryMargin = initialMargin / (parseFloat(order.usedUSDT * order.leverage) * 1.0 / parseFloat(lastPrice) * imr);
      //let initialMargin = parseFloat(((lastPrice) - order.open_price) * side * order.usedUSDT);
      let wallet = await FutureWalletModel.findOne({user_id : order.user_id});
      let roe =  wallet.amount / parseFloat(pnl);
      //roe = parseFloat(pnl) / parseFloat(order.usedUSDT) * 100;
      roe = splitLengthNumber(roe)
      
      assets.push({
        _id: order._id,
        symbol: order.pair_name,
        leverage: order.leverage,
        side: order.type,
        size: parseFloat(order.amount) * mark_price,
        future_type: order.future_type,
        entry_price: order.open_price,
        mark_price: mark_price,
        liq_price: order.liqPrice,
        margin_ratio: (order.usedUSDT * 100) / mark_price,
        roe: roe,
        margin: order.usedUSDT,
        tp: order.tp,
        sl: order.sl,
        adjusted: order.adjusted,
        pnl: order.pnl,
      });
    }
    return assets;
  }
  
  async function GetFutureCrossLiqPrice(order) {
    
    if (order == null || order.length == 0) return 0;
    let getOpenOrders = await FutureOrder.aggregate([
      {
        $match: {
          user_id: order.user_id,
          status: 0,
          method: "market",
          future_type: "cross",
        },
      },
  
      {
        $group: {
          _id: "$user_id",
          total: { $sum: "$pnl" },
          usedUSDT: { $sum: "$usedUSDT" },
        },
      },
    ]);
    
    let wallet = await FutureWalletModel.findOne({
      user_id: order.user_id,
    }).exec();
  
    let totalWallet = wallet.amount;
  
    if (totalWallet < 0) {
      totalWallet = 0;
    }
  
    let order_total = 0;
    let order_usedUSDT = 0;
    if (getOpenOrders.length > 0) {
      order_total = getOpenOrders[0].total;
      order_usedUSDT = getOpenOrders[0].usedUSDT;
    }
  
    let kasa = totalWallet + (order_total - order.pnl) + order_usedUSDT;
    
    let liqPrice = 0.0;
    if (order.type == "buy")
    
      liqPrice =
        order.open_price -
        (kasa / order_usedUSDT) * (order.open_price / (order.leverage * 1.0));
    else
      liqPrice =
        order.open_price +
        (kasa / order_usedUSDT) * (order.open_price / (order.leverage * 1.0));
    if (liqPrice < 0) {
      liqPrice *= -1;
    }
    order.liqPrice = liqPrice;
    return order;
  }
  function splitLengthNumber(q) {
    return q.toString().length > 4 ? parseFloat(q.toString().substring(0, 4)) : q;
  }
  
  module.exports = GetFutureLiqPrice;
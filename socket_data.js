"use strict";
const WebSocket = require("ws");
const WebSocketServer = require("ws").Server;
const wss = new WebSocketServer({ port: 7010 });
const MarginOrder = require("./models/MarginOrder");
const Wallet = require("./models/Wallet");
const mongoose = require("mongoose");
const Orders = require("./models/Orders");
require("dotenv").config();
const Connection = require("./Connection");
const Pairs = require("./models/Pairs");
const CoinList = require("./models/CoinList");
const Device = require("./models/Device");
const SpotOpenOrders = require("./SocketController/trade/spot/spot_open_orders");
const SpotOrderHistory = require("./SocketController/trade/spot/spot_order_history");
const SpotTradeHistory = require("./SocketController/trade/spot/trade_history");
const CrossOpenOrders = require("./SocketController/trade/cross/cross_open_orders");
const CrossOrderHistory = require("./SocketController/trade/cross/cross_order_history");
const CrossPositions = require("./SocketController/trade/cross/cross_positions");
const CrossFunds = require("./SocketController/trade/cross/cross_funds");
const SpotFunds = require("./SocketController/trade/spot/spot_funds");
const DerivativesFunds = require("./SocketController/trade/derivatives/getDerivatives");
const IsolatedFunds = require("./SocketController/trade/isolated/isolated_funds");
const IsolatedOpenOrders = require("./SocketController/trade/isolated/isolated_open_orders");
const IsolatedOrderHistory = require("./SocketController/trade/isolated/isolated_order_history");
const IsolatedPositions = require("./SocketController/trade/isolated/isolated_positions");
const IsolatedTradeHistory = require("./SocketController/trade/isolated/isolated_trade_history");
const CrossTradeHistory = require("./SocketController/trade/cross/cross_trade_history");
const FutureWalletModel = require("./models/FutureWalletModel");
const FutureOrder = require("./models/FutureOrder");
const FuturePositions = require("./SocketController/trade/future/positions");
const FutureOpenOrders = require("./SocketController/trade/future/open_orders");
const FutureTradeHistory = require("./SocketController/trade/future/trade_history");
const Withdraw = require("./models/Withdraw");
const FutureAssets = require("./SocketController/trade/future/future_funds");
const FutureOrderHistory = require("./SocketController/trade/future/order_history");
const express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
const FutureTransactionHistory = require("./SocketController/trade/future/transaction_history");
const MarginCrossWallet = require("./models/MarginCrossWallet");
const MarginIsolatedWallet = require("./models/MarginIsolatedWallet");
const BinanceAPI = require("./BinanceAPI");
const CheckLogoutDevice = require("./SocketController/device/check_logout_device");
var route = express();

route.use(cors());
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));
route.get("/price", (req, res) => {
  var symbol = req.query.symbol;
  if (symbol == null) {
    res.json({ 'status': 'fail', 'msg': 'symbol not found' });
    return;
  }
  let data = global.MarketData[symbol];
  res.json({ 'status': 'success', 'data': data });
});


route.listen(8542, () => {
  console.log("Server Ayakta");
});



var mongodbPass = process.env.MONGO_DB_PASS;
const MarginWalletId = "62ff3c742bebf06a81be98fd";
global.MarketData = {};
/*
let w = new Withdraw({
   amount: 100,
   coin_id: "62fb45483f8c1ffba43e4813",
   fee : 0.55,
   tx_id: "deneme 123",
   to: "TNDf74535gfsdfs",
   status: 1,
   user_id : "630dcee419b6e73400cf7006",
   type: "",

});
w.save();
*/
async function fillMarketPrices() {
  let coinList = await CoinList.find({});
  try {
    var b_ws = new WebSocket("wss://stream.binance.com/stream");

    for (var k = 0; k < coinList.length; k++) {
      global.MarketData[coinList[k].symbol + "USDT"] = { bid: 0.0, ask: 0.0 };
    }

    const initSocketMessage = {
      method: "SUBSCRIBE",
      params: ["!ticker@arr"],
      // params: ["!miniTicker@arr"],
      id: 1,
    };

    b_ws.onopen = (event) => {
      b_ws.send(JSON.stringify(initSocketMessage));
    };

    // Reconnect connection when disconnect connection
    b_ws.onclose = () => {
      b_ws.send(JSON.stringify(initSocketMessage));
    };
    b_ws.onmessage = function (event) {
      const data = JSON.parse(event.data).data;
      if (data != null && data != "undefined") {
        for (var m = 0; m < data.length; m++) {
          let x = data[m];
          global.MarketData[x.s] = { bid: x.b, ask: x.a };
        }
      }
    };
  } catch (err) {
    console.log(err.message);
  }
}
fillMarketPrices();

async function test() {
  await Connection.connection();
  console.log("DB Connect");
  //await FutureWalletModel.updateMany({amount : 1000});
  wss.on("connection", async (ws) => {
    console.info("websocket connection open");
    if (ws.readyState === ws.OPEN) {
      ws.send(
        JSON.stringify({
          msg1: "WELCOME TO OXHAIN",
        })
      );
      ws.on("message", async (data) => {
        let json = JSON.parse(data);
        if (json.page == "trade") {
          GetBinanceData(ws, json.pair);
          GetMarginBalance(ws, json.user_id);
          GetWallets(ws, json.user_id);
        } else if (json.page == "all_prices") {
          GetAllPrices(ws);
        }
        else if (json.page == 'devices') {
          CheckLogoutDevice(ws, json.user_id);
        }
        else if (json.page == "spot_open_orders") {
          if (json.user_id != null && json.user_id != "undefined") {
            SpotOpenOrders(ws, json.user_id);
          }
        } else if (json.page == "spot_order_history") {
          if (json.user_id != null && json.user_id != "undefined") {
            SpotOrderHistory(ws, json.user_id);
          }
        } else if (json.page == "spot_trade_history") {
          if (json.user_id != null && json.user_id != "undefined") {
            SpotTradeHistory(ws, json.user_id);
          }
        } else if (json.page == "spot_funds") {
          if (json.user_id != null && json.user_id != "undefined") {
            SpotFunds(ws, json.user_id);
          }
        }
        else if (json.page == 'derivatives_wallet') {
          if (json.user_id != null && json.user_id != "undefined") {
            DerivativesFunds(ws, json.user_id);
          }
        }
        else if (json.page == 'cross') {
          if (json.user_id != null && json.user_id != "undefined") {
            GetCrossWallet(ws, json.user_id);
          }

        } else if (json.page == "cross_open_orders") {
          if (json.user_id != null && json.user_id != "undefined") {
            CrossOpenOrders(ws, json.user_id);
          }
        } else if (json.page == "cross_trade_history") {
          if (json.user_id != null && json.user_id != "undefined") {
            CrossTradeHistory(ws, json.user_id);
          }
        } else if (json.page == "cross_order_history") {
          if (json.user_id != null && json.user_id != "undefined") {
            CrossOrderHistory(ws, json.user_id);
          }
        } else if (json.page == "cross_positions") {
          if (json.user_id != null && json.user_id != "undefined") {
            CrossPositions(ws, json.user_id);
          }
        } else if (json.page == "cross_funds") {
          if (json.user_id != null && json.user_id != "undefined") {
            CrossFunds(ws, json.user_id);
          }
        } else if (json.page == 'isolated') {
          if (json.user_id != null && json.user_id != "undefined") {
            GetIsolatedWallet(ws, json.user_id);
          }

        }

        else if (json.page == "isolated_open_orders") {
          if (json.user_id != null && json.user_id != "undefined") {
            IsolatedOpenOrders(ws, json.user_id);
          }
        } else if (json.page == "isolated_trade_history") {
          if (json.user_id != null && json.user_id != "undefined") {
            IsolatedTradeHistory(ws, json.user_id);
          }
        } else if (json.page == "isolated_order_history") {
          if (json.user_id != null && json.user_id != "undefined") {
            IsolatedOrderHistory(ws, json.user_id);
          }
        } else if (json.page == "isolated_positions") {
          if (json.user_id != null && json.user_id != "undefined") {
            IsolatedPositions(ws, json.user_id);
          }
        } else if (json.page == "isolated_funds") {
          if (json.user_id != null && json.user_id != "undefined") {
            IsolatedFunds(ws, json.user_id);
          }
        } else if (json.page == "future") {
          GetBinanceData(ws, json.pair);
          GetBinanceFutureData(ws, json.pair);
          GetFutureBalance(ws, json.user_id);
        } else if (json.page == "future_positions") {
          FuturePositions(ws, json.user_id);
        } else if (json.page == "future_open_orders") {
          FutureOpenOrders(ws, json.user_id);
        } else if (json.page == "future_order_history") {
          let filter = [];
          if (json.filter != null) filter = json.filter;
          FutureOrderHistory(ws, json.user_id, filter);
        } else if (json.page == "future_trade_history") {
          let filter = [];
          if (json.filter != null) filter = json.filter;
          FutureTradeHistory(ws, json.user_id, filter);
        } else if (json.page == "future_transaction_history") {
          let filter = [];
          if (json.filter != null) filter = json.filter;
          FutureTransactionHistory(ws, json.user_id, filter);
        } else if (json.page == "future_assets") {
          if (json.user_id != null && json.user_id != "undefined") {
            FutureAssets(ws, json.user_id);
          }
        } else if (json.page == "spot_assets") {
          let coinList = await CoinList.find({});
          let wallet = await Wallet.find({ user_id: json.user_id });
          let totalBtcValue = 0.0;
          let totalUsdValue = 0.0;

          let btcPrice = 0.0;
          var b_ws = new WebSocket("wss://stream.binance.com/stream");

          const initSocketMessage = {
            method: "SUBSCRIBE",
            params: ["!ticker@arr"],
            // params: ["!miniTicker@arr"],
            id: 1,
          };

          b_ws.onopen = (event) => {
            b_ws.send(JSON.stringify(initSocketMessage));
          };

          // Reconnect connection when disconnect connection
          b_ws.onclose = () => {
            b_ws.send(JSON.stringify(initSocketMessage));
          };
          let walletData = {};
          wallet.forEach(async (key, value) => {
            let getCoinInfo = coinList.filter((x) => x._id == key.coin_id)[0];
            walletData[getCoinInfo.symbol] = {
              symbol: getCoinInfo.symbol,
              name: getCoinInfo.name,
              network: getCoinInfo.network,
              icon: getCoinInfo.image_url,
              balance: 0.0,
              amount: key.amount,
            };
          });

          b_ws.onmessage = function (event) {
            const data = JSON.parse(event.data).data;
            if (data != null && data != "undefined") {
              totalUsdValue = 0.0;
              totalBtcValue = 0.0;
              for (var value in walletData) {
                let getBtc = data.filter((x) => x.s == "BTCUSDT");
                if (getBtc.length > 0) {
                  btcPrice = getBtc[0].a;
                }
                if (value == "Margin") {
                  walletData[value].balance = walletData[value].amount;
                  totalUsdValue += walletData[value].amount;
                } else if (value == "USDT") {
                  walletData[value].balance = walletData[value].amount;
                  totalUsdValue += walletData[value].amount;
                } else {
                  let item = data.filter((x) => x.s == value + "USDT");
                  if (item.length > 0) {
                    walletData[value].balance =
                      parseFloat(walletData[value].amount) * item[0].a;
                    totalUsdValue +=
                      parseFloat(walletData[value].amount) * item[0].a;
                  }
                }
              }
              totalBtcValue = totalUsdValue / btcPrice;
              ws.send(
                JSON.stringify({
                  type: "balances",
                  content: {
                    wallets: walletData,
                    totalUSD: totalUsdValue,
                    totalBTC: totalBtcValue,
                  },
                })
              );
            }
          };
        }
      });
    }
  });
}

test();
//main();
//binanceTest();
async function binanceTest() {
  let api = new BinanceAPI();
  api.Withdraw("TRX", "TWZXswJvAKHaUcdhMZy2JA319TQobYhcJ1", "TRC20", 10);
}

async function SetLogoutDevice(ws, user_id, device_id) {
  let change = await Device.findOneAndUpdate(
    { _id: device_id, user_id: user_id },
    { $set: { status: 0 } }
  );
  ws.send(JSON.stringify({ type: "logout", content: { device: device_id } }));
}

async function GetDeviceStatus(ws, user_id) {
  let devices = await Device.find({ user_id: user_id });
  ws.send(JSON.stringify({ type: "devices", content: devices }));
  let isInsert = Device.watch([
    { $match: { operationType: { $in: ["insert"] } } },
  ]).on("change", async (data) => {
    devices = await Device.find({ user_id: user_id });
    ws.send(JSON.stringify({ type: "devices", content: devices }));
  });
  let isUpdate = Device.watch([
    { $match: { operationType: { $in: ["update"] } } },
  ]).on("change", async (data) => {
    devices = await Device.find({ user_id: user_id });
    ws.send(JSON.stringify({ type: "devices", content: devices }));
  });
  let isRemove = Device.watch([
    { $match: { operationType: { $in: ["remove"] } } },
  ]).on("change", async (data) => {
    devices = await Device.find({ user_id: user_id });
    ws.send(JSON.stringify({ type: "devices", content: devices }));
  });

  let isDelete = Device.watch([
    { $match: { operationType: { $in: ["delete"] } } },
  ]).on("change", async (data) => {
    devices = await Device.find({ user_id: user_id });
    ws.send(JSON.stringify({ type: "spot_orders", content: devices }));
  });
}

async function GetBinanceFutureData(ws, pair) {
  if (pair == "" || pair == null || pair == "undefined") return;
  var b_ws = new WebSocket("wss://fstream.binance.com/ws/");
  // BNB_USDT => bnbusdt
  const noSlashPair = pair.replace("_", "").toLowerCase();
  const initSocketMessage = {
    method: "SUBSCRIBE",
    params: [
      `${noSlashPair}@markPrice`,
    ],
    // params: ["!miniTicker@arr"],
    id: 1,
  };

  b_ws.onopen = (event) => {
    b_ws.send(JSON.stringify(initSocketMessage));
  };

  // Reconnect connection when disconnect connection
  b_ws.onclose = () => {
    b_ws.send(JSON.stringify(initSocketMessage));
  };

  b_ws.onmessage = function (event) {
    const data = JSON.parse(event.data);
    if (data != null && data != "undefined") {
      if (data.e === "markPriceUpdate") {
        ws.send(JSON.stringify({ type: "future_header", content: { "mark": data.p, "index": data.i } }));

      }
    }
  };
}

async function GetBinanceData(ws, pair) {
  if (pair == "" || pair == null || pair == "undefined") return;
  var b_ws = new WebSocket("wss://stream.binance.com/stream");

  // BNB_USDT => bnbusdt
  const noSlashPair = pair.replace("_", "").toLowerCase();

  const initSocketMessage = {
    method: "SUBSCRIBE",
    params: [
      `${noSlashPair}@aggTrade`,
      `${noSlashPair}@bookTicker`,
      `${noSlashPair}@trade`,
      "!miniTicker@arr",
    ],
    // params: ["!miniTicker@arr"],
    id: 1,
  };

  b_ws.onopen = (event) => {
    b_ws.send(JSON.stringify(initSocketMessage));
  };

  // Reconnect connection when disconnect connection
  b_ws.onclose = () => {
    b_ws.send(JSON.stringify(initSocketMessage));
  };

  b_ws.onmessage = function (event) {
    const data = JSON.parse(event.data).data;
    if (data != null && data != "undefined") {
      if (data.A && data.a && data.b && data.B && !data.e) {
        ws.send(JSON.stringify({ type: "order_books", content: data }));
      } else if (data.e === "aggTrade") {
        ws.send(JSON.stringify({ type: "prices", content: data }));
      } else if (data.e === "trade") {
        ws.send(JSON.stringify({ type: "trade", content: data }));
      } else if (data[0].e === "24hrMiniTicker") {
        // console.log(data);
        ws.send(JSON.stringify({ type: "market", content: data }));
      }
    }
  };
}

async function GetAllPrices(ws) {
  let coinList = await CoinList.find({});
  var b_ws = new WebSocket("wss://stream.binance.com/stream");

  for (var k = 0; k < coinList.length; k++) {
    global.MarketData[coinList[k].symbol + "USDT"] = { bid: 0.0, ask: 0.0 };
  }

  const initSocketMessage = {
    method: "SUBSCRIBE",
    params: ["!ticker@arr"],
    // params: ["!miniTicker@arr"],
    id: 1,
  };

  b_ws.onopen = (event) => {
    b_ws.send(JSON.stringify(initSocketMessage));
  };

  // Reconnect connection when disconnect connection
  b_ws.onclose = () => {
    b_ws.send(JSON.stringify(initSocketMessage));
  };
  b_ws.onmessage = function (event) {
    const data = JSON.parse(event.data).data;
    if (data != null && data != "undefined") {
      for (var m = 0; m < data.length; m++) {
        let x = data[m];
        global.MarketData[x.s] = { bid: x.b, ask: x.a };
      }
    }
  };
}

async function CalculateMarginBalance(user_id) {
  let totalPNL = 0.0;
  let getOpenOrders = await MarginOrder.aggregate([
    {
      $match: {
        user_id: user_id,
        status: 0,
        method: "market",
        margin_type: "cross",
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
  let wallet = await Wallet.findOne({
    user_id: user_id,
    coin_id: MarginWalletId,
  }).exec();
  if (getOpenOrders.length == 0) return wallet.amount;
  if (wallet == null) return 0;
  let balance = wallet.amount + getOpenOrders[0].total;
  if (balance < 0) return 0;
  return balance;
}

async function CalculateFutureBalance(user_id) {
  let totalPNL = 0.0;

  let getOpenOrders = await FutureOrder.aggregate([
    {
      $match: {
        user_id: user_id,
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
  let wallet = await FutureWalletModel.findOne({ user_id: user_id }).exec();
  if (getOpenOrders.length == 0) return wallet.amount;
  if (wallet == null) return 0;
  let balance = parseFloat(wallet.amount) + parseFloat(getOpenOrders[0].total);
  if (balance < 0) return 0;
  return balance;
}

async function GetFutureBalance(ws, user_id) {
  let balance = await CalculateFutureBalance(user_id);
  if (balance <= 0) {
    ws.send(JSON.stringify({ type: "future_balance", content: 0.0 }));
  } else {
    ws.send(JSON.stringify({ type: "future_balance", content: balance }));
  }

  let isUpdate = FutureWalletModel.watch([
    { $match: { operationType: { $in: ["update"] } } },
  ]).on("change", async (data) => {
    balance = await CalculateFutureBalance(user_id);
    if (balance <= 0) {
      ws.send(JSON.stringify({ type: "future_balance", content: 0.0 }));
    } else {
      ws.send(JSON.stringify({ type: "future_balance", content: balance }));
    }
  });
}

async function GetMarginBalance(ws, user_id) {
  let balance = await CalculateMarginBalance(user_id);
  if (balance <= 0) {
    ws.send(JSON.stringify({ type: "margin_balance", content: 0.0 }));
  } else {
    ws.send(JSON.stringify({ type: "margin_balance", content: balance }));
  }
  let isUpdate = Wallet.watch([
    { $match: { operationType: { $in: ["update"] } } },
  ]).on("change", async (data) => {
    balance = await CalculateMarginBalance(user_id);
    if (balance <= 0) {
      ws.send(JSON.stringify({ type: "margin_balance", content: 0.0 }));
    } else {
      ws.send(JSON.stringify({ type: "margin_balance", content: balance }));
    }
  });
}

async function SendWallet(ws, _wallets) {
  var wallets = new Array();
  for (var i = 0; i < _wallets.length; i++) {
    let item = _wallets[i];

    let pairInfo = await Pairs.findOne({ symbolOneID: item.coin_id }).exec();
    if (pairInfo == null) continue;
    wallets.push({
      id: item._id,
      coin_id: item.coin_id,

      balance: item.amount,
      address: item.address,
      symbolName: pairInfo.name,
    });
  }
  ws.send(JSON.stringify({ type: "wallet", content: wallets }));
}

async function GetWallets(ws, user_id) {
  let wallet = await Wallet.find({ user_id: user_id }).exec();
  SendWallet(ws, wallet);

  let isInsert = Wallet.watch([
    { $match: { operationType: { $in: ["insert"] } } },
  ]).on("change", async (data) => {
    //orders = data;
    wallet = await Wallet.find({ user_id: user_id }).exec();
    SendWallet(ws, wallet);
  });
  let isUpdate = Wallet.watch([
    { $match: { operationType: { $in: ["update"] } } },
  ]).on("change", async (data) => {
    wallet = await Wallet.find({ user_id: user_id }).exec();
    SendWallet(ws, wallet);
  });
  let isRemove = Wallet.watch([
    { $match: { operationType: { $in: ["remove"] } } },
  ]).on("change", async (data) => {
    wallet = await Wallet.find({ user_id: user_id }).exec();
    SendWallet(ws, wallet);
  });

  let isDelete = Wallet.watch([
    { $match: { operationType: { $in: ["delete"] } } },
  ]).on("change", async (data) => {
    wallet = await Wallet.find({ user_id: user_id }).exec();
    SendWallet(ws, wallet);
  });
}


async function GetIsolatedWallet(ws, user_id) {
  let wallet = await MarginIsolatedWallet.find({ user_id: user_id });
  SendIsolatedWallet(ws, wallet);
  MarginIsolatedWallet.watch([{
    $match: { operationType: { $in: ['insert', 'update', 'delete', 'remove'] } }
  }]).on('change', async (data) => {
    let wallet = await MarginIsolatedWallet.find({ user_id: user_id });
    SendIsolatedWallet(ws, wallet);
  });
}

async function SendIsolatedWallet(ws, _wallets) {
  var wallets = new Array();
  for (var i = 0; i < _wallets.length; i++) {
    let item = _wallets[i];

    let pairInfo = await Pairs.findOne({ symbolOneID: item.coin_id }).exec();
    if (pairInfo == null) continue;
    wallets.push({
      id: item._id,
      coin_id: item.coin_id,

      balance: item.amount,
      address: item.address,
      symbolName: pairInfo.name,
    });
  }
  ws.send(JSON.stringify({ page: "margin", type: "isolated_wallet", content: wallets }));
}


async function GetCrossWallet(ws, user_id) {
  let wallet = await MarginCrossWallet.find({ user_id: user_id });
  SendCrossWallet(ws, wallet);
  MarginCrossWallet.watch([{
    $match: { operationType: { $in: ['insert', 'update', 'delete', 'remove'] } }
  }]).on('change', async (data) => {
    let wallet = await MarginCrossWallet.find({ user_id: user_id });
    SendCrossWallet(ws, wallet);
  });
}

async function SendCrossWallet(ws, _wallets) {
  var wallets = new Array();
  for (var i = 0; i < _wallets.length; i++) {
    let item = _wallets[i];

    let pairInfo = await Pairs.findOne({ symbolOneID: item.coin_id }).exec();
    if (pairInfo == null) continue;
    wallets.push({
      id: item._id,
      coin_id: item.coin_id,

      balance: item.amount,
      address: item.address,
      symbolName: pairInfo.name,
    });
  }
  ws.send(JSON.stringify({ page: "margin", type: "cross_wallet", content: wallets }));
}

async function GetOrders(ws, user_id, type, filter) {
  let request = { user_id: user_id };
  if (type != "") request["type"] = type;

  if (filter.date != "" && filter.finalDate != "") {
    let date = new Date(filter.date);
    let finalDate = new Date(filter.finalDate);
    request["createdAt"] = { $gte: date, $lte: finalDate };
  } else {
    if (filter.date != "") {
      let date = new Date(filter.date);
      request["createdAt"] = { $gte: date, $lte: new Date() };
    }
  }

  let orders = await Orders.find(request).exec();
  ws.send(JSON.stringify({ type: "spot_orders", content: orders }));
  let isInsert = Orders.watch([
    { $match: { operationType: { $in: ["insert"] } } },
  ]).on("change", async (data) => {
    //orders = data;
    orders = await Orders.find(request).exec();
    ws.send(JSON.stringify({ type: "spot_orders", content: orders }));
  });
  let isUpdate = Orders.watch([
    { $match: { operationType: { $in: ["update"] } } },
  ]).on("change", async (data) => {
    if (data.updateDescription.updatedFields.type == "market") {
      ws.send(
        JSON.stringify({
          type: "filled_spot_order",
          content: { order_id: data.documentKey._id },
        })
      );
    }
    orders = await Orders.find(request).exec();
    ws.send(JSON.stringify({ type: "spot_orders", content: orders }));
  });
  let isRemove = Orders.watch([
    { $match: { operationType: { $in: ["remove"] } } },
  ]).on("change", async (data) => {
    orders = await Orders.find(request).exec();
    ws.send(JSON.stringify({ type: "spot_orders", content: orders }));
  });

  let isDelete = Orders.watch([
    { $match: { operationType: { $in: ["delete"] } } },
  ]).on("change", async (data) => {
    orders = await Orders.find(request).exec();
    ws.send(JSON.stringify({ type: "spot_orders", content: orders }));
  });
}

async function GetMarginOrders(
  ws,
  user_id,
  margin_order_type,
  margin_order_method_type
) {
  let request = { user_id: user_id, status: { $gt: -3 } };

  if (margin_order_type != null && margin_order_type != "")
    request["margin_type"] = margin_order_type;
  if (margin_order_method_type != null && margin_order_method_type != "")
    request["method"] = margin_order_method_type;

  let orders = await MarginOrder.find(request).exec();

  ws.send(
    JSON.stringify({
      type: "margin_orders",
      content: await GetLiqPrice(orders),
    })
  );
  let isInsert = MarginOrder.watch([
    { $match: { operationType: { $in: ["insert"] } } },
  ]).on("change", async (data) => {
    //orders = data;
    orders = await MarginOrder.find(request).exec();
    ws.send(
      JSON.stringify({
        type: "margin_orders",
        content: await GetLiqPrice(orders),
      })
    );
  });
  let isUpdate = MarginOrder.watch([
    { $match: { operationType: { $in: ["update"] } } },
  ]).on("change", async (data) => {
    orders = await MarginOrder.find(request).exec();
    ws.send(
      JSON.stringify({
        type: "margin_orders",
        content: await GetLiqPrice(orders),
      })
    );
  });
  let isRemove = MarginOrder.watch([
    { $match: { operationType: { $in: ["remove"] } } },
  ]).on("change", async (data) => {
    orders = await MarginOrder.find(request).exec();
    ws.send(
      JSON.stringify({
        type: "margin_orders",
        content: await GetLiqPrice(orders),
      })
    );
  });

  let isDelete = MarginOrder.watch([
    { $match: { operationType: { $in: ["delete"] } } },
  ]).on("change", async (data) => {
    orders = await MarginOrder.find(request).exec();
    ws.send(
      JSON.stringify({
        type: "margin_orders",
        content: await GetLiqPrice(orders),
      })
    );
  });
}

async function GetCrossLiqPrice(order) {
  let getOpenOrders = await MarginOrder.aggregate([
    {
      $match: {
        user_id: order.user_id,
        status: 0,
        method: "market",
        margin_type: "cross",
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

  let wallet = await Wallet.findOne({
    user_id: order.user_id,
    coin_id: MarginWalletId,
  }).exec();
  /*
   
   Giriş Fiyatı - ( (kasa/ used USDT) x (giriş fiyatı / kaldıraç) )
   
   
   
   cross için kasa hesaplanırken tüm pozisyonların pnl i + usedUSDT si + marginWalletAmount
   */
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

async function GetLiqPrice(orders) {
  for (var i = 0; i < orders.length; i++) {
    let order = orders[i];
    if (order.status == 1) continue;
    if (order.method == "market") {
      if (order.margin_type == "isolated") {
        if (order.type == "buy") {
          order.liqPrice =
            order.open_price - order.open_price / (order.leverage * 1.0);
          orders[i] = order;
        } else {
          order.liqPrice =
            order.open_price + order.open_price / (order.leverage * 1.0);
          orders[i] = order;
        }
      } else if (order.margin_type == "cross") {
        orders[i] = await GetCrossLiqPrice(order);
      }
    }
  }
  return orders;
}

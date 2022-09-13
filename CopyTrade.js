const { createHash } = require("crypto");
const Deposits = require("./models/Deposits");
const NotificationTokens = require("./models/NotificationTokens");
var notifications = require("./notifications.js");
const Wallet = require("./models/Wallet");
const CopyTrade = require("./models/CopyTrade");

async function test() {
  var user_id = "630dfda89f2fa5aad18a0c43";
  var spotTrade = "1";
  var marginTrade = "1";
  var traderId = "630dcee419b6e73400cf7006";

  const newOrder = new CopyTrade({
    user_id: user_id,
    spotTradeAuth: spotTrade,
    marginTradeAuth: marginTrade,
    traderId: traderId,
    status: "1",
  });

  let wallets = await CopyTrade.findOne({
    user_id: user_id,
  }).exec();

  if (wallets == null) {
    newOrder.save();
    console.log("yes");
  } else {
    console.log("no");
  }
}

async function updateTrade() {
  var user_id = "630dcee419b6e73400cf7006";
  var spotTrade = "0";
  var marginTrade = "0";

  let wallets = await CopyTrade.findOne({
    user_id: user_id,
  }).exec();

  if (wallets == null) {
    console.log("no");
  } else {
    await CopyTrade.findOneAndUpdate(
      { user_id: user_id },
      { spotTradeAuth: spotTrade, marginTradeAuth: marginTrade }
    );
    console.log("yes");
  }
}

module.exports = {
  test: test,
  updateTrade: updateTrade,
};

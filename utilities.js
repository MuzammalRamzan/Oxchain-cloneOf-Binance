const { createHash } = require("crypto");
const Deposits = require("./models/Deposits");
const NotificationTokens = require("./models/NotificationTokens");
var notifications = require("./notifications.js");
const Wallet = require("./models/Wallet");
const mailer = require("./mailer");
const User = require("./models/User");
const Network = require("./models/Network");
function hashData(string) {
  return createHash("sha256").update(string).digest("hex");
}

function makeId(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function addDeposit(
  user_id,
  coin_name,
  amount,
  address,
  txid,
  coin_id,
  networkId,
  fromAddress = ""
) {
  const newDeposit = new Deposits({
    user_id: user_id,
    coin_id: coin_id,
    amount: amount,
    tx_id: txid,
    address: address,
    status: 1,
    currency: coin_name,
    netowrk_id : networkId,
    fromAddress: fromAddress
  });

  NotificationTokens.findOne({
    user_id: user_id,
  }).then(async (response) => {
    if (response == null) {
      newDeposit.save(async function (err, room) {
        if (err) {
          console.log(err);
        } else {
          Wallet.findOneAndUpdate(
            { user_id: user_id, coin_id: coin_id },
            { $inc: { amount: amount } },
            (err, doc) => {
              if (err) {
                console.log(err);
              }
            }
          );
          let userInfo = await User.findOne({_id : user_id});
          let networkInfo = await Network.findOne({_id : networkId}); 
          let html = "<p>New deposit added</p>\n<b>User :</b> " + userInfo.email + "</b><br>";
          html += "<b>Coin : </b> " + coin_name + " (" + networkInfo.symbol + ")<br>";
          html += "<b>Amount : </b> " + amount + "<br>";
          html += "<b>Hash : </b> " + txid + "<br>";
          
          mailer.sendMail("support@oxhain.com", "New Deposit ("+coin_name+")", html);
          mailer.sendMail("f.damar@hotmail.com", "New Deposit ("+coin_name+")", html);
        }
      });
    } else {
      var token = response["token_id"];
      newDeposit.save(function (err, room) {
        if (err) {
          console.log(err);
        } else {
          var body =
            "You have received a deposit of " +
            amount +
            " " +
            coin_name +
            " from " +
            address;
          notifications.sendPushNotification(token, body);
          Wallet.findOneAndUpdate(
            { user_id: user_id, address: address },
            { $inc: { amount: amount } },
            (err, doc) => {
              if (err) {
                console.log(err);
              }
            }
          );
        }
      });
    }
  });
}

module.exports = {
  hashData: hashData,
  makeId: makeId,
  addDeposit: addDeposit,
};

const { createHash } = require("crypto");
const Deposits = require("./models/Deposits");
const NotificationTokens = require("./models/NotificationTokens");
var notifications = require("./notifications.js");

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

async function addDeposit(user_id, coin_id, amount, address, txid) {
  const newDeposit = new Deposits({
    user_id: user_id,
    coin_id: coin_id,
    amount: amount,
    tx_id: txid,
    address: address,
    status: 1,
  });

  NotificationTokens.findOne({
    user_id: user_id,
  }).then((response) => {
    if (response == null) {
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
            coin_id +
            " from " +
            address;
          notifications.sendPushNotification(token, body);
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

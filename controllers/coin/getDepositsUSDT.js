const CoinList = require("../../models/CoinList");
var utilities = require("../../utilities.js");

const getDepositsUSDT = (req, res) => {
  var coin_id = "62bc116eb65b02b777c97b3d";
  var user_id = "62a89a7bebd4b6fca58d18a0";
  var amount = 10;
  var address = "THPvaUhoh2Qn2y9THCZML3H815hhFhn5YC";
  var txid = "253f666b515d1668a7e0088130732ea1c2336825aa92638c2c8b88a9e66f2ab3";

  //find deposits here, then call addDeposit Function in while loop.
  CoinList.findOne({
    coin_id: coin_id,
  }).then((coin) => {
    if (coin != null) {
      var coin_symbol = coin["symbol"];
      utilities.addDeposit(user_id, coin_symbol, amount, address, txid);
    }
  });
  res.json({ status: "success", data: "" });
};

module.exports = getDepositsUSDT;

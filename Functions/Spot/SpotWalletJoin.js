const Pairs = require("../../models/Pairs");

async function SpotWalletJoin(_wallets) {
  var wallets = new Array();
  for (var i = 0; i < _wallets.length; i++) {
    let item = _wallets[i];
    let pairInfo = await Pairs.findOne({ symbolOneID: item.coin_id }).exec();
    if (pairInfo == null) continue;
    wallets.push({
      id: item._id,
      coin_id: item.coin_id,
      balance: splitLengthNumber(item.amount),
      symbolName: pairInfo.name,
    });
  }
  return wallets;

}
function splitLengthNumber(q) {
  return q.toString().length > 10 ? parseFloat(q.toString().substring(0, 10)) : q;
}

module.exports = SpotWalletJoin;
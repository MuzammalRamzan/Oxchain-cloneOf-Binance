const Pairs = require("../../models/Pairs");
const Wallet = require("../../models/Wallet")

const GetSpotWallet = async (sockets, user_id) => {
    let wallet = await Wallet.find({ user_id: user_id }).exec();
    SendWallet(sockets, wallet, user_id);
    Wallet.watch([
        { $match: { operationType: { $in: ["insert", "update", "remove", "delete"] } } },
    ]).on("change", async (data) => {
        wallet = await Wallet.find({ user_id: user_id }).exec();
        SendWallet(sockets, wallet, user_id);
    });

}

async function SendWallet(sockets, _wallets, user_id) {
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
    sockets.in(user_id).emit("wallets", wallets);
    
  }
  
  module.exports = GetSpotWallet;
const calculateFutureFund = require("../../../Functions/Future/calculateFutureFunds");
const CoinList = require("../../../models/CoinList");
const FutureOrder = require("../../../models/FutureOrder");
const FutureWalletModel = require("../../../models/FutureWalletModel");

const FutureAssets = async (sockets, user_id) => {
    
    let wallets = await FutureWalletModel.find({ user_id: user_id, status: 1 });
    let assets = await calculateFutureFund(wallets,user_id);
    
    sockets.in(user_id).emit("future_assets",{ page:"future", type: 'assets', content: assets });
    
}

module.exports = FutureAssets;
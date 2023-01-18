const MarginIsolatedWallet = require("../../models/MarginIsolatedWallet");
const SendIsolatedWallet = require("./sendIsolatedWallet");

const GetIsolatedWallet = async(sockets, user_id)  => {
    
    let wallet = await MarginIsolatedWallet.find({ user_id: user_id });
    SendIsolatedWallet(sockets, wallet, user_id);
    
    MarginIsolatedWallet.watch([{
        $match: { operationType: { $in: ['insert', 'update', 'delete', 'remove'] } }
    }]).on('change', async (data) => {
        let wallet = await MarginIsolatedWallet.find({ user_id: user_id });
        SendIsolatedWallet(sockets, wallet, user_id);
    });

}

module.exports = GetIsolatedWallet;
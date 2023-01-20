const MarginCrossWallet = require("../../models/MarginCrossWallet");
const SendCrossWallet = require("./sendCrossWallet");

const GetCrossWallet = async(sockets, user_id) => {
    
    let wallet = await MarginCrossWallet.find({ user_id: user_id });
    SendCrossWallet(sockets, wallet, user_id);
    MarginCrossWallet.watch([{
        $match: { operationType: { $in: ['insert', 'update', 'delete', 'remove'] } }
    }]).on('change', async (data) => {
        let wallet = await MarginCrossWallet.find({ user_id: user_id });
        SendCrossWallet(sockets, wallet, user_id);
    });
}
module.exports = GetCrossWallet;
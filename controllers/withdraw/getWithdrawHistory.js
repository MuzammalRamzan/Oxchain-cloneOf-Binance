const CoinList = require("../../models/CoinList");
const Network = require("../../models/Network");
const Withdraw = require("../../models/Withdraw");

const GetWithdrawHistory = async (req, res) => {
    let uid = req.body.user_id;
    if (uid == null || uid == '') return res.json({ status: 'fail', message: 'User not found' });
    let filter = { user_id: uid };

    if (req.body.coin != 'all') {
        filter['coin_id'] = req.body.coin_id;
    }
    if (req.body.status != 'all') {
        filter['status'] = req.body.status;
    }

    if (req.body.firstDate != null && req.body.endDate != null) {
        filter.createdAt = { $gte: req.body.firstDate, $lte: req.body.endDate };
    }
    let list = await Withdraw.find(filter);
    let data = [];

    for (var i = 0; i < list.length; i++) {
        
        let coinInfo = await CoinList.findOne({ _id: list[i].coin_id });
        var network = {
            id: "",
            name: ""
        };
        if (list[i].netowrk_id != null) {
            let networkInfo = await Network.findOne({ _id: list[i].netowrk_id });
            network = {
                id: list[i].netowrk_id,
                name: networkInfo.symbol,
            };
        }

        data.push({
            id: list[i]._id,
            coin: {
                id: list[i].coin_id,
                name: coinInfo.symbol,
            },
            network: network,
            hash: list[i].tx_id,
            fee: list[i].fee,
            amount: list[i].amount,
            fromAddress: list[i].fromAddress,
            toAddress: list[i].address,
            date: list[i].createdAt,
            status: list[i].status,
        });
    }
    res.json({ status: 'success', data: data });
}

module.exports = GetWithdrawHistory;
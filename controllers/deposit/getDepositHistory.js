const CoinList = require("../../models/CoinList");
const Deposits = require("../../models/Deposits");
const Network = require("../../models/Network");

const GetDepositHistory = async(req,res) => {
    let uid = req.body.user_id;
    if(uid == null || uid == '') return res.json({status : 'fail', message : 'User not found'});
    let filter = {user_id : uid};
    
    if(req.body.coin != 'all') {
        filter['coin_id'] = req.body.coin;
    }
    if(req.body.status != 'all') {
        filter['status'] = req.body.status;
    }

     

    if(req.body.firstDate != null && req.body.endDate != null) {
        filter.createdAt = { $gte: req.body.firstDate, $lte: req.body.endDate };
    }
    let list = await Deposits.find(filter);
    let data = [];
    console.log(filter);
    for(var i = 0; i < list.length; i++) {
        let coinInfo = await CoinList.findOne({_id : list[i].coin_id});
        let networkInfo = await Network.findOne({_id : list[i].netowrk_id});
        data.push({
            id : list[i]._id,
            coin : {
                id : list[i].coin_id,
                name : coinInfo.symbol,
            },
            network : {
                id : list[i].netowrk_id,
                name : networkInfo.symbol,
            },
            hash : list[i].tx_id,
            fee : list[i].fee,
            amount : list[i].amount,
            fromAddress : list[i].fromAddress,
            toAddress : list[i].address,
            date : list[i].createdAt,
            status : list[i].status,
        });
    }
    res.json({status : 'success', data : data});

}
module.exports = GetDepositHistory;
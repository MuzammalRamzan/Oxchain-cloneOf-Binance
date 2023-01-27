const Deposits = require("../../models/Deposits");

const GetDepositHistory = async(req,res) => {
    let uid = req.body.user_id;
    if(uid == null || uid == '') return res.json({status : 'fail', message : 'User not found'});
    let filter = {user_id : uid};
    
    if(req.body.coin != 'all') {
        filter['currency'] = req.body.coin;
    }
    if(req.body.status != 'all') {
        filter['status'] = req.body.status;
    }

     

    if(req.body.firstDate != null && req.body.endDate != null) {
        filter.createdAt = { $gte: req.body.firstDate, $lte: req.body.endDate };
    }
    console.log(filter);
    let list = await Deposits.find(filter);
    res.json({status : 'success', data : list});

}
module.exports = GetDepositHistory;
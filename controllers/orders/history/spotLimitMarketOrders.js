const Orders = require("../../../models/Orders");

const SpotLimitMarketOrders = async(req,res) => {
    let uid = req.body.user_id;
    if(uid == null || uid == '') return res.json({status : 'fail', message : 'User not found'});
    let filter = {};
    filter.user_id = uid;
    let coinName = "";
    if(req.body.pairOne != 'all') {
        if(req.body.pairSecond != '') {
            coinName = req.body.pairOne + "/" + req.body.pairSecond;
        }
    }

    if(req.body.direction != 'all') {
        filter.method = req.body.direction;
    }

    if(req.body.orderType != 'all') {
        filter.type = req.body.orderType;
        if(req.body.orderType == 'limit') {
            filter.type =  {$and : [{type : 'limit'}, {type : 'stop_limit'}]};
        }
        
    }
    
    if(req.body.status != 'all') {
        filter.type = req.body.status;
    }
    

    let list = await Orders.find(filter);
    return res.json({status : 'success', data : list});
}
const Orders = require("../../../models/Orders");

const SpotTradeHistory = async (req, res) => {
    let uid = req.body.user_id;
    if (uid == null || uid == '') return res.json({ status: 'fail', message: 'User not found' });
    if (req.body.direction == null || req.body.direction == '') return res.json({ status: 'fail', message: 'Direction not found' });
    if (req.body.pairOne == null || req.body.pairOne == '') return res.json({ status: 'fail', message: 'Symbol type not found' });
    if (req.body.orderType == null || req.body.orderType == '') return res.json({ status: 'fail', message: 'Order  type not found' });
    if (req.body.status == null || req.body.status == '') return res.json({ status: 'fail', message: 'Status type not found' });
    let filter = {};
    filter.user_id = uid;
    let coinName = "";
    if (req.body.pairOne != 'all') {
        if (req.body.pairSecond != '') {
            coinName = req.body.pairOne + "/" + req.body.pairSecond;
        }
    }

    if (req.body.direction != 'all') {
        filter.method = req.body.direction;
    }

    if (req.body.orderType != 'all') {
        filter.type = req.body.orderType;
        if (req.body.orderType == 'limit') {
            filter.type = { $and: [{ type: 'limit' }, { type: 'stop_limit' }] };
        }

    }

    if (req.body.status != 'all') {
        filter.type = req.body.status;
    }
    console.log(req.body.firstDate)
    if (req.body.firstDate != null && req.body.endDate != null) {
        filter.createdAt = {
            $gte: req.body.firstDate,
            $lt: req.body.endDate,
        }
    }

    let list = await Orders.find(filter);
    return res.json({ status: 'success', data: list });
}

module.exports = SpotTradeHistory;
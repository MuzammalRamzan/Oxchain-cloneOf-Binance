const Orders = require("../../../models/Orders");

const SpotOrderHistory = async (req, res) => {
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
        filter.status = req.body.status;
    }
    if (req.body.firstDate != null && req.body.endDate != null) {
        filter.createdAt = {
            $gte: req.body.firstDate,
            $lt: req.body.endDate,
        }
    }

    let orders = await Orders.find(filter);
    let list = [];
    for (let k = 0; k < orders.length; k++) {
        let o = orders[k];
        list.push({
            'spot_pairs': o.pair_name,
            'order_type': o.type,
            'direction': o.method,
            'avg_filled_price': o.open_price,
            'order_price': o.open_price,
            'order_qty': o.amount,
            'filled_qty': filled_qty(o.type, o.status, o.amount),
            'unfilled_qty': unfilled_qty(o.type, o.status, o.amount),
            'order_status': convertOrderStatus(o.type, o.status),
            'order_time': o.createdAt,
            'order_id': o._id,
        });
    }
    return res.json({ status: 'success', data: list });
}
const filled_qty = (type, status, amount) => {
    if (status == -1) return 0;
    else if (status == 0 && type == 'limit') return amount;
    else if (status == 0 && type == 'market') return amount;
    else if (status == 1 && type == 'limit') return 0;
    else return amount;
}
const unfilled_qty = (type, status, amount) => {
    if (status == -1) return amount;
    else if (status == 0 && type == 'limit') return 0;
    else if (status == 0 && type == 'market') return 0;
    else if (status == 1 && type == 'limit') return amount;
    else return amount;
}
const convertOrderStatus = (type, status) => {
    if (status == -1) return "Cancelled";
    else if (status == 0 && type == 'limit') return "Filled";
    else if (status == 0 && type == 'market') return "Market";
    else if (status == 1 && type == 'limit') return "Limit Order";
    else return status;
}

module.exports = SpotOrderHistory;
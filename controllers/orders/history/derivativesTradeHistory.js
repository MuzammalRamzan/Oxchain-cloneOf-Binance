const FutureOrder = require("../../../models/FutureOrder");

const DerivativesTradeHistory = async (req, res) => {
    let uid = req.body.user_id;
    if (uid == null || uid == '') return res.json({ status: 'fail', message: 'User not found' });
    if (req.body.symbol == null || req.body.symbol == '') return res.json({ status: 'fail', message: 'Symbol not found' });
    if (req.body.orderType == null || req.body.orderType == '') return res.json({ status: 'fail', message: 'Order  type not found' });
    if (req.body.status == null || req.body.status == '') return res.json({ status: 'fail', message: 'Status type not found' });
    let filter = {};
    filter.user_id = uid;
    let coinName = "";
    if (req.body.symbol != 'all') {
        filter.pair_name = req.body.symbol;
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

    if (req.body.firstDate != null && req.body.endDate != null) {
        filter.createdAt = {
            $gte: req.body.firstDate,
            $lt: req.body.endDate,
        }
    }

    console.log(filter);

    let orders = await FutureOrder.find(filter);
    let list = [];
    for (let k = 0; k < orders.length; k++) {
        let o = orders[k];
        list.push({
            'contracts': o.pair_name,
            'leverage': o.leverage,
            'filled_type': 'Order',
            'filled_total': o.amount,
            'filled_price': o.open_price,
            'direction': o.type,
            'order_price': o.open_price,
            'trigger_price': o.target_price ?? o.open_price,
            'order_price': o.type,
            'order_type': o.future_type,
            'order_status': convertOrderStatus(o.type, o.status),
            'order_time': o.open_time,
            'order_no': o._id,
        });
    }
    return res.json({ status: 'success', data: list });

}
const convertOrderStatus = (type, status) => {
    if (status == -1) return "Cancelled";
    else if (status == 0 && type == 'limit') return "Filled";
    else if (status == 0 && type == 'market') return "Market";
    else if (status == 1 && type == 'limit') return "Limit Order";
    else return status;
}
module.exports = DerivativesOrderHistory;
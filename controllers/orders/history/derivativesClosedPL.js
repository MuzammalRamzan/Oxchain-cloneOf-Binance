const FutureOrder = require("../../../models/FutureOrder");

const DerivativesClosedPNL = async (req, res) => {
    let uid = req.body.user_id;
    if (uid == null || uid == '') return res.json({ status: 'fail', message: 'User not found' });
    if (req.body.symbol == null || req.body.symbol == '') return res.json({ status: 'fail', message: 'Symbol not found' });

    let filter = {};
    filter.user_id = uid;
    let coinName = "";
    if (req.body.symbol != 'all') {
        filter.pair_name = req.body.symbol;
    }


    if (req.body.firstDate != null && req.body.endDate != null) {
        filter.createdAt = {
            $gte: req.body.firstDate,
            $lt: req.body.endDate,
        }
    }

    filter.method = 'market';
    filter.status = 1;

    let orders = await FutureOrder.find(filter);
    let list = [];
    let totalPNL = 0.0;
    for (let k = 0; k < orders.length; k++) {
        let o = orders[k];
        totalPNL += parseFloat(o.pnl);

        list.push({
            'contracts': o.pair_name,
            'closing_direction': o.type,
            'qty': o.amount,
            'entry_price': o.open_price,
            'exit_price': o.close_price,
            'pnl': o.pnl,
            'exit_type': 'Close',
            'trade_time': o.open_time,
        });
    }

    return res.json({ status: 'success', data: { 'total_pnl': totalPNL, 'list': list } });
}
const convertOrderStatus = (type, status) => {
    if (status == -1) return "Cancelled";
    else if (status == 0 && type == 'limit') return "Filled";
    else if (status == 0 && type == 'market') return "Market";
    else if (status == 1 && type == 'limit') return "Limit Order";
    else return status;
}
module.exports = DerivativesClosedPNL;
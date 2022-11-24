const FutureOrder = require("../../models/FutureOrder");

const UpdateStop = async (req, res) => {
    let user_id = req.body.user_id;
    let order_id = req.body.order_id;
    let sl = req.body.sl ?? 0.0;
    let tp = req.body.tp ?? 0.0;

    let getOrder = await FutureOrder.findOne({ _id: order_id, user_id: user_id });
    if (getOrder == null) {
        res.json({ status: 'fail', message: 'Order not found' });
        return;
    }

    if (getOrder.type == 'buy') {
        if (sl != 0 && getOrder.open_price < sl) {
            res.json({ status: 'fail', message: 'Stop Loss must be below the opening price' });
            return;
        }
        getOrder.sl = sl;
        if (tp != 0 && getOrder.open_price > tp) {
            res.json({ status: 'fail', message: 'Take Profil must be above the opening price' });
            return;
        }
        console.log(tp);
        getOrder.tp = tp;
        await getOrder.save();
        res.json({ status: 'success', data: 'OK' });
        return;
    }
    else if (getOrder.type == 'sell') {
        if (sl != 0 && getOrder.open_price > sl) {
            res.json({ status: 'fail', message: 'Stop Loss must be above the opening price' });
            return;
        }
        getOrder.sl = sl;
        if (tp != 0 && getOrder.open_price < tp) {
            res.json({ status: 'fail', message: 'Take Profil must be below the opening price' });
            return;
        }
        getOrder.tp = tp;
        await getOrder.save();
        res.json({ status: 'success', data: 'OK' });
        return;
    } else {
        res.json({ status: 'fail', message: 'Not Response' });
        return;
    }
}

module.exports = UpdateStop;
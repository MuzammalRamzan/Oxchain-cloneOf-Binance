const FutureOrder = require("../../models/FutureOrder");
var authFile = require("../../auth.js");

const UpdateStop = async (req, res) => {

    let api_key_result = req.body.api_key;
    let result = await authFile.apiKeyChecker(api_key_result);
    if (result == false) {
        return res.json({ 'status': "fail", 'message': 'Forbidden 403' });
    }

    let key = req.headers["key"];

    if (!key) {
        return res.json({ status: "fail", message: "key_not_found" });
    }

    if (!req.body.device_id || !req.body.user_id) {
        return res.json({ status: "fail", message: "invalid_params (key, user id, device_id)" });
    }

    let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


    if (checkKey === "expired") {
        return res.json({ status: "fail", message: "key_expired" });
    }

    if (!checkKey) {
        return res.json({ status: "fail", message: "invalid_key" });
    }

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
const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");

const AdjustMargin = async (req, res) => {
    let order_id = req.body.order_id;
    let user_id = req.body.user_id;
    let amount = parseFloat(req.body.amount) ?? 0.0;
    let type = req.body.type;


    let order = await FutureOrder.findOne({ user_id: user_id, _id: order_id });

    if (order == null) {
        res.json({ status: "fail", message: "Invalid Order" });
        return;
    }

    if (type == 'add') {
        let wallet = await FutureWalletModel.find({ user_id: user_id });
        let max = parseFloat(wallet.amount);
        if (amount >= max) {
            res.json({ status: "fail", message: "Invalid Amount" });
            return;
        }
        order.usedUSDT += amount;
        await order.save();
        wallet.amount = parseFloat(wallet.amount) - amount;
        await wallet.save();
        res.json({ status: "success", data: "OK" });
        return;
    }

    else if (type == 'remove') {

        let orderSize = (order.open_price * order.amount) * order.leverage;
        let max = (orderSize - order.usedUSDT) + order.pnl;
        if (amount > max) {
            res.json({ status: "fail", message: "Invalid Amount" });
            return;
        }

        order.usedUSDT -= amount;
        await order.save();
        wallet.amount = parseFloat(wallet.amount) + amount;
        await wallet.save();
        res.json({ status: "success", data: "OK" });
        return;
    }

}

module.exports = AdjustMargin;

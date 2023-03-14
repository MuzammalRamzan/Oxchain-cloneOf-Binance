const { default: axios } = require("axios");
const FutureOrder = require("../../models/FutureOrder");
const FutureWalletModel = require("../../models/FutureWalletModel");

const FuturePercentClose = async (req, res) => {
    let user_id = req.body.user_id;
    let order_id = req.body.order_id;
    let percent = req.body.percent ?? 0.0;

    let order = await FutureOrder.findOne({ _id: order_id, user_id: user_id, method: 'market', status: 0 });

    if (order == null) {
        res.json({ status: 'fail', message: 'Order not found' });
        return;
    }

    let wallet = await FutureWalletModel.findOne({ user_id: user_id });
    if (wallet == null) {
        res.json({ status: 'fail', message: 'User not found' });
        return;
    }
    let binanceData = await axios("http://global.oxhain.com:8542/price?symbol=" + order.pair_name.replace('/', ''));
    let marketPrice = parseFloat(binanceData.data.data.ask);

    console.log(order.amount, percent, marketPrice);

    percent = parseFloat(percent);
    if (percent == 100) {
        order.status = 1;
        await order.save();
        wallet.amount = splitLengthNumber(parseFloat(wallet.amount) + (parseFloat(order.usedUSDT) + parseFloat(order.pnl)));
        await wallet.save();
        res.send({ status: 'success', data: 'OK' });


    } else {

        let orderTotal = order.usedUSDT + order.pnl;
        let totalUSDT = parseFloat(orderTotal) * percent / 100.0;
        let totalAmount = parseFloat(order.amount) * percent / 100.0;
        order.usedUSDT = splitLengthNumber(order.usedUSDT + order.pnl);
        order.pnl = 0;
        order.usedUSDT = splitLengthNumber(parseFloat(totalUSDT));
        order.amount = splitLengthNumber(parseFloat(order.amount) - totalAmount);
        await order.save();
        console.log(wallet.amount, (orderTotal - totalUSDT));
        wallet.amount = splitLengthNumber(parseFloat(wallet.amount) + (orderTotal - totalUSDT));
        await wallet.save();

        res.send({ status: 'success', data: 'OK' });
    }


}
function splitLengthNumber(q) {
    return q.toString().length > 10 ? parseFloat(q.toString().substring(0, 10)) : q;
}

module.exports = FuturePercentClose;
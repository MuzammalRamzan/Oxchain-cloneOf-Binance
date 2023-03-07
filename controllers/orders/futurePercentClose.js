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
        wallet.amount = parseFloat(wallet.amount) + (parseFloat(order.amount) * marketPrice);
        await wallet.save();
        res.send({ status: 'success', data: 'OK' });


    } else {
        console.log(order.amount, percent);
        let total = parseFloat(order.amount) * percent / 100.0;
        order.amount = parseFloat(order.amount) - total;
        await order.save();
        wallet.amount = parseFloat(wallet.amount) + (total * marketPrice);
        await wallet.save();
        res.send({ status: 'success', data: 'OK' });
    }


}

module.exports = FuturePercentClose;
const setFeeCredit = require("../../../controllers/bonus/setFeeCredit");
const Orders = require("../../../models/Orders");
const Wallet = require("../../../models/Wallet");
const SetTradeVolumeAndRefProgram = require("../../setTradeVolumeAndRefProgram");

const AddMarketBuyOrder = async (req, res, getPair, price, api_result, apiRequest) => {
    let percent = parseFloat(req.body.percent);

    var fromWallet = await Wallet.findOne({
        coin_id: getPair.symbolOneID,
        user_id: req.body.user_id,
    }).exec();
    var towallet = await Wallet.findOne({
        coin_id: getPair.symbolTwoID,
        user_id: req.body.user_id,
    }).exec();
    let balance = towallet.amount;
    amount = (balance * percent / 100.0) / price;
    if(amount <= 0) {
        return res.json({ status: "fail", message: "Invalid amount" });
    }
    let total = amount * price;

    if (balance < total) {
        return res.json({ status: "fail", message: "Invalid  balance" });
    }
    const fee = splitLengthNumber((total * getPair.spot_fee) / 100.0);
    const feeToAmount = splitLengthNumber((fee / price));
    const buyAmount = splitLengthNumber((amount - feeToAmount));

    const orders = new Orders({
        pair_id: getPair.symbolOneID,
        second_pair: getPair.symbolTwoID,
        pair_name: getPair.name,
        user_id: req.body.user_id,
        amount: buyAmount,
        open_price: price,
        feeUSDT: fee,
        feeAmount: feeToAmount,
        type: "market",
        method: "buy",
        target_price: 0,
    });



    let saved = await orders.save();
    if (saved) {
        fromWallet.amount = parseFloat(fromWallet.amount) + parseFloat(buyAmount);
        towallet.amount = parseFloat(towallet.amount) - parseFloat(total);

        await fromWallet.save();
        await towallet.save();
        if (api_result === false) {
            apiRequest.status = 1;
            await apiRequest.save();
        }

        await SetTradeVolumeAndRefProgram({ order_id: saved._id, user_id: req.body.user_id, trade_from: "spot", trade_type: "buy", amount: amount, totalUSDT: splitLengthNumber(total) })
        await setFeeCredit(req.body.user_id, getPair.symbolTwoID, fee);
        return res.json({ status: "success", data: saved });
    } else {
        return res.json({ status: "fail", message: "Unknow error" });
    }

}
function splitLengthNumber(q) {
    return q.toString().length > 10 ? parseFloat(q.toString().substring(0, 10)) : q;
  }
module.exports = AddMarketBuyOrder;
const Orders = require("../../../models/Orders");
const Wallet = require("../../../models/Wallet");

const AddLimitSellOrder = async (req, res, getPair, api_result, apiRequest) => {
    let percent = parseFloat(req.body.percent);
    let target_price = parseFloat(req.body.target_price);

    var fromWallet = await Wallet.findOne({
        coin_id: getPair.symbolOneID,
        user_id: req.body.user_id,
    }).exec();
    let balance = parseFloat(fromWallet.amount);
    amount = (fromWallet.amount * parseFloat(percent)) / 100.0;
    amount = splitLengthNumber(amount);
    if(amount <= 0) {
        return res.json({ status: "fail", message: "Invalid amount" });
    }
    if (balance < amount) {
        return res.json({ status: "fail", message: "Invalid  balance" });
    }

    const orders = new Orders({
        pair_id: getPair.symbolOneID,
        second_pair: getPair.symbolTwoID,
        pair_name: getPair.name,
        user_id: req.body.user_id,
        amount: amount,
        open_price: 0,
        type: "limit",
        method: "sell",
        target_price: target_price,
        status: 1,
    });
    let saved = await orders.save();
    if (saved) {
        fromWallet.amount = fromWallet.amount - amount;
        await fromWallet.save();
        if (api_result === false) {
          apiRequest.status = 1;
          await apiRequest.save();
        }
        return res.json({ status: "success", data: saved });
    } else {
        return res.json({ status: "fail", message: "Unknow error" });
    }
}
function splitLengthNumber(q) {
    return q.toString().length > 10 ? parseFloat(q.toString().substring(0, 10)) : q;
  }
module.exports = AddLimitSellOrder;
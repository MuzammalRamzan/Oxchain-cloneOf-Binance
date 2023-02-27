const Orders = require("../../../models/Orders");
const Wallet = require("../../../models/Wallet");

const AddStopLimitBuyOrder = async (req, res, getPair, api_result, apiRequest, price) => {
    let percent = parseFloat(req.body.percent);
    let target_price = parseFloat(req.body.target_price);
    let stop_limit = parseFloat(req.body.stop_limit);


    if (stop_limit < target_price) {
        return res.json({
          status: "fail",
          message:
            "The limit price cannot be more than the stop price Buy limit order must be below the price",
        });
      }
      if (target_price >= price) {
        return res.json({
          status: "fail",
          message: "Buy limit order must be below the price",
        });
      }

    var towallet = await Wallet.findOne({
        coin_id: getPair.symbolTwoID,
        user_id: req.body.user_id,
    }).exec();

    let balance = towallet.amount;
    let amount = (balance * percent / 100.0) / target_price;
    if(amount <= 0) {
        return res.json({ status: "fail", message: "Invalid amount" });
    }
    let total = amount * stop_limit;

    if (balance < total) {
        return res.json({ status: "fail", message: "Invalid  balance" });
    }

    const orders = new Orders({
        pair_id: getPair.symbolOneID,
        second_pair: getPair.symbolTwoID,
        pair_name: getPair.name,
        user_id: req.body.user_id,
        amount: amount,
        stop_limit: stop_limit,
        open_price: 0,
        type: "stop_limit",
        method: "buy",
        target_price: target_price,
        status: 1,
    });
    let saved = await orders.save();
    if (saved) {
        towallet.amount = towallet.amount - total;
        await towallet.save();
        if (api_result === false) {
            apiRequest.status = 1;
            await apiRequest.save();
        }
        return res.json({ status: "success", data: saved });
    } else {
        return res.json({ status: "fail", message: "Unknow error" });
    }
}

module.exports = AddStopLimitBuyOrder;
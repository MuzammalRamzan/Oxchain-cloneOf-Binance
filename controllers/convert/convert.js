var authFile = require("../../auth.js");
const User = require("../../models/User");
const { default: axios } = require("axios");
const FutureWalletModel = require("../../models/FutureWalletModel");
const FutureAssets = require('../../controllers/GetUserBalances/SocketController/futuer_funds')


const convert = async (req, res) => {
    var api_key_result = req.body.api_key;
    var user_id = req.body.user_id;
    var value = req.body.coin
    var amount = req.body.amount

    var result = await authFile.apiKeyChecker(api_key_result);
    if (result === true) {


        let wallet = await FutureWalletModel.findOne({
            user_id: user_id,
        }).exec();
        console.log("wallet", wallet)
        const futureAccountFunds = await FutureAssets(user_id);

        console.log("futureAccountFunds", futureAccountFunds)

        if (wallet.amount >= amount) {
            let priceData = await axios("http://18.130.193.166:8542/price?symbol=" + value + "USDT");
            let btcPrice = priceData.data.data.ask;
            console.log("priceData", btcPrice)
            btcPrice = amount / btcPrice;
            // wallet.amount = btcPrice;
            // wallet.symbol = value


            res.json({ status: "success", message: "converted", data: btcPrice });
        }
        // newData.save().then(() => {
        //     res.json({ status: "success", message: "Ticket generated", showableMessage: "Ticket generated" });
        // });
    }
    else {
        return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "403 Forbidden" });
    }

};

module.exports = convert;
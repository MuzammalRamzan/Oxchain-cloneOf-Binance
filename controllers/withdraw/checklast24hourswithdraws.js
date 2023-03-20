const UserModel = require("../../models/User");
const OneStepWithdrawModel = require("../../models/OneStepWithdraw");
var authFile = require("../../auth.js");
const axios = require("axios");
const CoinList = require("../../models/CoinList");
const Withdraws = require("../../models/Withdraw");



const withdraw = async (req, res) => {

    let { user_id } = req.body;

    let result = await authFile.apiKeyChecker(req.body.api_key);
    if (result == false) {
        return res.json({ status: "fail", message: "403 Forbidden" });
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


    if (!user_id) {
        return res.json(
            {
                status: "fail",
                message: "user_id is required",

            }
        );
    }

    let last24HoursWithdraw = await Withdraws.find({
        user_id: user_id,
        createdAt: {
            $gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        },
    }).exec();

    if (last24HoursWithdraw.length == 0) return res.json(
        {
            status: "success",
            message: "last 24 hours withdraw USDT amount",
            data: 0
        }
    );

    let last24HoursWithdrawAmount = 0;

    for (let i = 0; i < last24HoursWithdraw.length; i++) {

        //calcualate amount in usdt
        let price = 0;
        let coinInfo = await CoinList.findOne({ _id: last24HoursWithdraw[i].coin_id }).exec();
        if (coinInfo.symbol == "USDT") {
            price = 1;
        }

        else {

            let getPrice = await axios("http://global.oxhain.com:8542/price?symbol=" + coinInfo.symbol + "USDT");
            price = getPrice.data.data.ask;
        }

        let amountUSDT = parseFloat(last24HoursWithdraw[i].amount) * parseFloat(price);

        last24HoursWithdrawAmount += amountUSDT;
    }

    return res.json(
        {
            status: "success",
            message: "last 24 hours withdraw USDT amount",
            data: last24HoursWithdrawAmount
        }
    );


}

module.exports = withdraw;
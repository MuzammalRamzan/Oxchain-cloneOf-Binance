const UserModel = require('../../models/User');
const FutureOrderModel = require('../../models/FutureOrder');
const authFile = require('../../auth.js');
const FutureWalletModel = require('../../models/FutureWalletModel');

const changeCrossLeverage = async (req, res) => {


    const { user_id } = req.body;

    var api_key_result = req.body.api_key;
    let result = await authFile.apiKeyChecker(api_key_result);
    if (result !== true) {
        res.json({ status: "fail", message: "Forbidden 403" });
        return;
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

    let FutureOrderCheck = await FutureOrderModel.findOne(
        {
            future_type: "cross",
            user_id: user_id,
            //status 0 if method is market, status 1 if method is limit, we need to check both
            $or: [
                { status: 0, method: "market" },
                { status: 1, method: "limit" }
            ]

        }
    ).exec();

    let leverage = 1;

    if (FutureOrderCheck) {
        leverage = FutureOrderCheck.leverage;
    }





    return res.json({
        status: "success",
        message: "Leverage fetched",
        leverage: leverage
    });


}

module.exports = changeCrossLeverage;
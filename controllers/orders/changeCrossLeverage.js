const UserModel = require('../../models/User');
const FutureOrderModel = require('../../models/FutureOrder');
const authFile = require('../../auth.js');
const FutureWalletModel = require('../../models/FutureWalletModel');

const changeCrossLeverage = async (req, res) => {


    const { user_id, leverage } = req.body;

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


    //find user balance
    let UserBalance = await FutureWalletModel.findOne(
        {
            user_id: user_id
        }
    ).exec();

    if (!UserBalance) {
        return res.json({
            status: "failed",
            message: "User not found"
        });
    }


    let UserCheck = await UserModel.findOne(
        {
            _id: user_id
        }
    ).exec();

    if (!UserCheck) {
        return res.json({
            status: "failed",
            message: "User not found"
        });
    }

    let balance = UserBalance.amount;



    let FutureOrderCheck = await FutureOrderModel.find(
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








    for (var i = 0; i < FutureOrderCheck.length; i++) {

        let order = FutureOrderCheck[i];

        //first we need to check if the user has enough balance to change the leverage
        //if the user has enough balance, we can change the leverage
        //if the user does not have enough balance, we cannot change the leverage

        let usedUSDT = order.usedUSDT;
        let size = usedUSDT * order.leverage;

        //to keep the size the same, we need to calculate the new usedUSDT
        let newUsedUSDT = size / leverage;

        //now we need to check if the user has enough balance to change the leverage
        if (balance < newUsedUSDT - usedUSDT) {
            return res.json({
                status: "failed",
                message: "Not enough balance to change leverage",
                showableMessage: "Balance is not enough to change leverage"
            });
        }

        //now we need to update the user balance
        let newBalance = balance - newUsedUSDT + usedUSDT;


        balance = newBalance;

    }



    //do another check to see if the user has enough balance to change the leverage
    if (balance < 0) {
        return res.json({
            status: "failed",
            message: "Not enough balance to change leverage",
            showableMessage: "Balance is not enough to change leverage"
        });
    }
    else {
        //update the user balance
        await FutureWalletModel.updateOne(
            {
                user_id: user_id
            },
            {
                amount: balance
            }
        ).exec();

        for (var j = 0; j < FutureOrderCheck.length; j++) {



            let orderFix = FutureOrderCheck[j];

            let usedUSDTFix = orderFix.usedUSDT;
            let sizeFix = usedUSDTFix * orderFix.leverage;

            //to keep the size the same, we need to calculate the new usedUSDT
            let newUsedUSDTFix = sizeFix / leverage;

            //now we need to update the order
            await FutureOrderModel.updateOne(
                {
                    _id: orderFix._id
                },
                {
                    leverage: leverage,
                    usedUSDT: newUsedUSDTFix,
                    required_margin: newUsedUSDTFix,
                }
            ).exec();
        }
    }


    return res.json({
        status: "success",
        message: "Leverage changed successfully",
        showableMessage: "Leverage changed successfully"
    });




}

module.exports = changeCrossLeverage;
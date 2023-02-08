const UserModel = require('../../models/User');
const ApiKeyModel = require('../../models/ApiKeys');
let MailVerification = require('../../models/MailVerification');
let SMSVerification = require('../../models/SMSVerification');


const editApiKey = async (req, res) => {

    const { api_key, key_id, user_id, trade, deposit, withdraw, transfer, get_balance, futures, status } = req.body;

    if (!api_key) return res.json({ status: 'error', message: 'Api key is null' });
    if (!user_id) return res.json({ status: 'error', message: 'User id is null' });


    //user_id regex
    const user_id_regex = /^[0-9a-fA-F]{24}$/;
    if (!user_id_regex.test(user_id)) return res.json({ status: 'error', message: 'User id is not valid' });

    let checkUser = await UserModel.findOne(
        {
            _id: user_id
        }
    );

    if (!checkUser) return res.json({ status: 'error', message: 'User not found' });

    var email = checkUser["email"];
    var phone = checkUser["phone_number"];
    let check1 = "";
    let check3 = "";

    if (email != undefined && email != null && email != "") {
        check1 = await MailVerification.findOne({
            user_id: user_id,
            reason: "edit_api_key",
            pin: req.body.mailPin,
            status: 0,
        }).exec();
        if (!check1)
            return res.json({
                status: "fail",
                message: "verification_failed",
                showableMessage: "Wrong Mail Pin",
            });

    }

    if (phone != undefined && phone != null && phone != "") {
        check3 = await SMSVerification.findOne
            ({
                user_id: user_id,
                reason: "edit_api_key",
                pin: req.body.smsPin,
                status: 0,
            }).exec();

        if (!check3)
            return res.json({
                status: "fail",
                message: "verification_failed",
                showableMessage: "Wrong SMS Pin",
            });
    }

    let checkApi = await ApiKeyModel.findOne(
        {
            _id: key_id,
            user_id: user_id
        }
    );

    if (!checkApi) return res.json({ status: 'error', message: 'Api key not found' });


    if (trade) {
        checkApi.trade = trade;
    }

    if (deposit) {
        checkApi.deposit = deposit;
    }

    if (withdraw) {
        checkApi.withdraw = withdraw;
    }

    if (transfer) {
        checkApi.transfer = transfer;
    }

    if (get_balance) {
        checkApi.get_balance = get_balance;
    }

    if (futures) {
        checkApi.futures = futures;
    }

    if (status) {
        if (!status == "1" && !status == "0" && !status == 0 && !status == 1) {
            return res.json({ status: 'error', message: 'Status is not valid' });
        }
        checkApi.status = status;
    }

    await checkApi.save();

    if (check1) {
        check1.status = 1;
        await check1.save();
    }

    if (check3) {
        check3.status = 1;
        await check3.save();
    }


    return res.json({ status: 'success', message: 'Api key updated', showableMessage: "Api key updated" });

}

module.exports = editApiKey;
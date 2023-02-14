const UserModel = require('../../models/User');
const WalletModel = require('../../models/Wallet');
const CoinListModel = require('../../models/CoinList');
var authFile = require("../../auth.js");
const SMSVerification = require("../../models/SMSVerification");
const MailVerification = require("../../models/MailVerification");
var mailer = require("../../mailer.js");

const Transfer = async (req, res) => {

    const { amount, user_id, to_user_id, coin_id } = req.body;

    var api_key_result = req.body.api_key;

    var result = await authFile.apiKeyChecker(api_key_result);


    if (result === true) {

        //check id mongodb regex
        const checkId = /^[0-9a-fA-F]{24}$/;

        if (!checkId.test(user_id)) {
            return res.json({ status: "failed", message: "Invalid user id", showableMessage: "Invalid user id." })
        }

        if (!checkId.test(to_user_id)) {
            return res.json({ status: "failed", message: "Invalid user id", showableMessage: "Invalid user id." })
        }

        if (!checkId.test(coin_id)) {
            return res.json({ status: "failed", message: "Invalid coin id", showableMessage: "Invalid coin id." })
        }

        if (user_id == to_user_id) {
            return res.json({ status: "failed", message: "Reciever and sender can't be same.", showableMessage: "Reciever and sender can't be same." })
        }

        let coinListCheck = await CoinListModel.findOne({ _id: coin_id, status: 1 });

        if (!coinListCheck) {
            return res.json({ status: "failed", message: "Coin not found", showableMessage: "Coin not found." })
        }

        let userCheck = await UserModel.findOne({ _id: user_id, status: 1 });

        if (!userCheck) {
            return res.json({ status: "failed", message: "Sender not found", showableMessage: "Sender not found." })
        }

        let toUserCheck = await UserModel.findOne({
            _id: to_user_id,
            status: 1
        });

        if (!toUserCheck) {
            return res.json({ status: "failed", message: "Reciever not found", showableMessage: "Reciever not found." })
        }

        let walletCheck = await WalletModel.findOne({
            user_id: user_id,
            coin_id: coin_id,
            status: 1
        });

        if (!walletCheck) {
            return res.json({ status: "failed", message: "Sender wallet not found", showableMessage: "Sender wallet not found." })
        }

        let toWalletCheck = await WalletModel.findOne({
            user_id: to_user_id,
            coin_id: coin_id,
            status: 1
        });

        if (!toWalletCheck) {
            return res.json({ status: "failed", message: "Reciever wallet not found", showableMessage: "Reciever wallet not found." })
        }

        if (amount < 0) {
            return res.json({ status: "failed", message: "Amount can't be negative", showableMessage: "Amount can't be negative." })
        }

        if (parseFloat(walletCheck.amount, 8) < parseFloat(amount, 8)) {
            return res.json({ status: "failed", message: "Insufficient balance", showableMessage: "Insufficient balance." })
        }

        var email = userCheck["email"];
        var phone = userCheck["phone_number"];
        let check1 = "";
        let check3 = "";

        if (email != undefined && email != null && email != "") {
            check1 = await MailVerification.findOne({
                user_id: user_id,
                reason: "wallet_to_wallet_transfer",
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
                    reason: "wallet_to_wallet_transfer",
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

        if (check1 != "") {
            check1.status = 1;
            check1.save();
        }

        if (check3 != "") {
            check3.status = 1;
            check3.save();
        }




        let newWalletAmount = parseFloat(walletCheck.amount, 8) - parseFloat(amount, 8);
        let newToWalletAmount = parseFloat(toWalletCheck.amount, 8) + parseFloat(amount, 8);

        if (newWalletAmount < 0) {
            newWalletAmount = 0;
        }

        if (newToWalletAmount < 0) {
            newToWalletAmount = 0;
        }

        await WalletModel.updateOne({ _id: walletCheck._id }, { $set: { amount: newWalletAmount } });
        await WalletModel.updateOne({ _id: toWalletCheck._id }, { $set: { amount: newToWalletAmount } });


        if (toUserCheck.email) {

            mailer.sendMail(
                toUserCheck.email,
                "Transfer Successful",
                amount + " " + coinListCheck.symbol + " has been transferred to your account.",
                function (err, data) {
                    if (err) {
                        console.log("Error " + err);
                    } else {
                    }
                }
            );
        }

        if (userCheck.email) {

            
            mailer.sendMail(
                userCheck.email,
                "Transfer Successful",
                amount + " " + coinListCheck.symbol + " has been transferred from your account.",
                function (err, data) {
                    if (err) {
                        console.log("Error " + err);
                    } else {
                    }
                }
            );
        }

        return res.json({ status: "success", message: "Transfer successful", showableMessage: "Transfer successful." })




    }
    else {
        return res.json({ status: "failed", message: "Api key not valid", showableMessage: "Api key not valid." })
    }






}

module.exports = Transfer;
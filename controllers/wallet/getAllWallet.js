const UserModel = require('../../models/User');
const WalletModel = require('../../models/Wallet');
const FutureWalletModel = require('../../models/FutureWalletModel');
const MarginIsolatedWallet = require('../../models/MarginIsolatedWallet');
const MarginCrossWallet = require('../../models/MarginCrossWallet');

const authFile = require('../../auth.js');

const getAllWallets = async function (req, res) {

    const { user_id, api_key } = req.body;

    const result = await authFile.apiKeyChecker(api_key);

    if (!result) return res.json({ status: "fail", message: "403 Forbidden" });

    if (!user_id) {
        return res.json({ status: "fail", message: "fill_all_blanks" });
    }

    if (user_id.length != 24) {
        return res.json({ status: "fail", message: "invalid_user_id" });
    }

    let userCheck = await UserModel.findOne({
        _id: user_id
    }).exec();


    if (userCheck == null) {
        return res.json({ status: "fail", message: "User not found" });
    }

    let wallets = await WalletModel.findOne({
        user_id: user_id,
        coin_id: "62bc116eb65b02b777c97b3d"
    }).exec();

    let futureWallets = await FutureWalletModel.findOne({
        user_id: user_id,
        coin_id: "62ff3c742bebf06a81be98fd"
    }).exec();

    let marginIsolatedWallets = await MarginIsolatedWallet.findOne({
        user_id: user_id,
        coin_id: "62bc116eb65b02b777c97b3d"
    }).exec();

    let marginCrossWallets = await MarginCrossWallet.findOne({
        user_id: user_id,
        coin_id: "62bc116eb65b02b777c97b3d"
    }).exec();



    let balanceArray =
        [
            {
                "type": "spot",
                "amount": wallets.amount ? wallets.amount : 0
            },
            {
                "type": "future",
                "amount": futureWallets.amount ? futureWallets.amount : 0

            },
            {
                "type": "margin_isolated",
                "amount": marginIsolatedWallets.amount ? marginIsolatedWallets.amount : 0
            },
            {
                "type": "margin_cross",
                "amount": marginCrossWallets.amount ? marginCrossWallets.amount : 0
            }
        ];

    return res.json({ status: "success", message: "success", data: balanceArray });





}

module.exports = getAllWallets;
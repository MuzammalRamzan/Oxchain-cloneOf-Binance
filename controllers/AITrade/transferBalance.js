const UserModel = require('../../models/User');
const AITradeWallet = require('../../models/AITradeWallet');
const authFile = require('../../auth');
let WalletModel = require('../../models/Wallet');
const AITransferLogs = require('../../models/AITransferLogs');

const transferBalance = async (req, res) => {

    const { user_id, api_key, amount } = req.body;

    if (!user_id || !api_key || !amount) {
        return res.json({
            status: "fail",
            message: "Please provide user_id, api_key and amount"
        });
    }

    if (user_id.length !== 24) {
        return res.json({
            status: "fail",
            message: "Invalid user_id"
        });
    }


    if (amount <= 0) {
        return res.json({
            status: "fail",
            message: "Invalid amount",
            showableMessage: "Amount must be greater than 0"
        });
    }

    var result = await authFile.apiKeyChecker(api_key);

    if (result === true) {

        let userCheck = await UserModel.findOne({ _id: user_id });

        if (!userCheck) {
            return res.json({
                status: "fail",
                message: "User not found"
            });
        }


        let walletCheck = await WalletModel.findOne({
            user_id: user_id,
            coin_id: "62bc116eb65b02b777c97b3d"
        }).exec();

        if (!walletCheck) {
            return res.json({
                status: "fail",
                message: "Wallet not found"
            });
        }

        if (walletCheck.amount < amount) {
            return res.json({
                status: "fail",
                message: "Insufficient balance"
            });
        }

        let wallet = await AITradeWallet.findOne({ user_id: user_id });

        if (!wallet) {
            return res.json({
                status: "fail",
                message: "Wallet not found"
            });
        }

        //make balance float
        let balance = parseFloat(wallet.balance);
        let amountFloat = parseFloat(amount);

        //add amount to balance
        wallet.balance = balance + amountFloat;

        await wallet.save();

        //subtract amount from wallet
        walletCheck.amount = walletCheck.amount - amountFloat;

        await walletCheck.save();


        let newTransferLog = new AITransferLogs({
            user_id: user_id,
            amount: amountFloat,
        });

        await newTransferLog.save();

        return res.json({
            status: "success",
            message: "Balance transferred successfully"
        });



    }

}

module.exports = transferBalance;

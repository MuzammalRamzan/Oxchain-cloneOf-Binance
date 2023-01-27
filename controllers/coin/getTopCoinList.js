var authenticator = require("authenticator");
const User = require("../../models/User");
const Wallet = require("../../models/Wallet");
const CoinList = require("../../models/CoinList");
const Referral = require("../../models/Referral");
const RegisterMail = require("../../models/RegisterMail");
const RegisterSMS = require("../../models/RegisterSMS");
const UserRef = require("../../models/UserRef");
const Pairs = require("../../models/Pairs");
const Orders = require("../../models/Orders");
const LoginLogs = require("../../models/LoginLogs");
const SecurityKey = require("../../models/SecurityKey");
const Notification = require("../../models/Notifications");
const ReadNotification = require("../../models/ReadNotifications");
const SMSVerification = require("../../models/SMSVerification");
const MailVerification = require("../../models/MailVerification");
const CopyLeaderRequest = require("../../models/CopyTradeLeaderRequest");
const axios = require("axios");
const NotificationTokens = require("../../models/NotificationTokens");
const Withdraws = require("../../models/Withdraw");
const RegisteredAddress = require("../../models/RegisteredAddress");
var authFile = require("../../auth.js");
var notifications = require("../../notifications.js");
var utilities = require("../../utilities.js");
var mailer = require("../../mailer.js");
var CopyTrade = require("../../CopyTrade.js");
const CopyTradeModel = require("../../models/CopyTrade");
const Connection = require("../../Connection");
const { Console } = require("console");
const { exit } = require("process");
const auth = require("../../auth.js");
const MarginOrder = require("../../models/MarginOrder");
const MarginWallet = require("../../models/MarginWallet");
const { ObjectId } = require("mongodb");
const { createHash, randomBytes } = require("crypto");

const MarginWalletId = "62ff3c742bebf06a81be98fd";

function parseCoins(coins, amounts) {
    return new Promise((resolve) => {
        let parsedCoins = [];

        for (let i = 0; i < coins.length; i++) {
            let a = coins[i].toObject();
            let select = amounts.filter((amount) => amount.coin_id == a._id);
            if (select != null && select.length > 0) {
                a.balance = select[0].amount;
            }
            parsedCoins.push(a);
        }
        resolve(parsedCoins);
    });
}

const getTopCoinList = async function (req, res) {
    var api_key_result = req.body.api_key;
    var user_id = req.body.user_id;

    var result = await authFile.apiKeyChecker(api_key_result);

    if (result === true) {
        var coins = await CoinList.find({}).exec();

        let amounst = await Wallet.find({});

        let result = await parseCoins(coins, amounst);
        // result = result.sort(
        //     (p1, p2) => (p1?.balance < p2?.balance) ? 1 : (p1?.balance > p2?.balance) ? -1 : 0);
        console.log("result", result)
        res.json({ status: "success", data: result });
    } else {
        res.json({ status: "fail", message: "Forbidden 403" });
    }
};

module.exports = getTopCoinList;


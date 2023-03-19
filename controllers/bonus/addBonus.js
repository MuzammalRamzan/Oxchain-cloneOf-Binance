const Wallet = require("../../models/Wallet");
var authFile = require("../../auth.js");
const Bonus = require("../../models/Bonus");
const MarginWalletId = "62ff3c742bebf06a81be98fd";
const addBonus = async (req, res) => {
    var api_key_result = req.body.api_key;
    var result = await authFile.apiKeyChecker(api_key_result);
    if (result === true) {

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
        let bonusType = req.body.bonusType;
        let amount = req.body.amount;
        let description = req.body.description ?? '';
        let user_id = req.body.user_id;
        let date = new Date();
        let expiration = new Date(date.setYear(date.getMonth() + 1));
        let wallet = await Wallet.findOne({ user_id: user_id, coin_id: MarginWalletId });
        if (wallet == null) {
            res.json({ 'status': false, 'message': 'Wallet not found' });
            return;
        }
        wallet.totalBonus = parseFloat(wallet.totalBonus) + parseFloat(amount);
        await wallet.save();
        let add = new Bonus({
            type: bonusType,
            amount: amount,
            description: description,
            expiration: expiration,
            user_id: user_id,
            status: 1,

        });

        await add.save();
        res.json({ 'status': true, 'data': '' });
        return;
    } else {
        res.json({ 'status': false, 'message': 'Not auth' });
        return;
    }
}

module.exports = addBonus;
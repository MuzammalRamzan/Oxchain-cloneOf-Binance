const AITradeParticipants = require("../../models/AITradeParticipants");
var authFile = require("../../auth.js");

const JoinAITrade = async (req, res) => {
    try {


        let result = await authFile.apiKeyChecker(req.body.api_key);
        if (result != true)
            return res.json({ status: "fail", message: "Invalid api key" });

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


        let uid = req.body.user_id;

        let symbol = req.body.symbol;

        let method = req.body.method;
        let type = req.body.type;
        let leverage = req.body.leverage;
        let closeType = req.body.closeType;
        let period = req.body.period;
        let maxOrder = req.body.maxOrder ?? 0.0;
        let sl = req.body.sl ?? 0.0;
        let tp = req.body.tp ?? 0.0;


        let validate = [uid, symbol, method, type, leverage, closeType, period];
        for (var i = 0; i < validate.length; i++) {
            if (validate[i] == null || validate[i] == '')
                return res.json({ status: 'fail', 'message': 'parameter not found' })
        }

        let check = await AITradeParticipants.findOne({ user_id: uid, symbol: symbol, period: period });
        if (check == null) {
            let save = AITradeParticipants({
                user_id: uid,
                symbol: symbol,
                method: method,
                type: type,
                period: period,
                leverage: leverage,
                closeType: closeType,
                sl: sl,
                tp: tp,
                maxOrder: maxOrder,
            });
            await save.save();
            return res.json({ status: 'success', 'data': save });
        }
        return res.json({ status: 'fail', 'message': 'already exists' })

    } catch (err) {
        return res.json({ status: 'fail', 'message': err.message })
    }
}

module.exports = JoinAITrade;
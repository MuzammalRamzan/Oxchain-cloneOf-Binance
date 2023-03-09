const AITradeParticipants = require("../../models/AITradeParticipants");

const JoinAITrade = async (req, res) => {
    try {
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

    } catch(err) {
        return res.json({ status: 'fail', 'message': err.message })
    }
}

module.exports = JoinAITrade;
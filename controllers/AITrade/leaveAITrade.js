const AITradeParticipants = require("../../models/AITradeParticipants");

var authFile = require("../../auth.js");


const LeaveAITrade = async (req, res) => {
    try {

        let result = await authFile.apiKeyChecker(req.body.api_key);
        if (result != true)
            return res.json({ status: "fail", message: "Invalid api key" });


        let key = req.headers["key"];

        if (!key) {
            return res.json({ status: "fail", message: "key_not_found" });
        }

        if (!req.body.device_id || !req.body.uid) {
            return res.json({ status: "fail", message: "invalid_params (key, user id, device_id)" });
        }

        let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.uid);


        if (checkKey === "expired") {
            return res.json({ status: "fail", message: "key_expired" });
        }

        if (!checkKey) {
            return res.json({ status: "fail", message: "invalid_key" });
        }



        let uid = req.body.uid;
        let obj_id = req.body.id;
        await AITradeParticipants.deleteOne({ user_id: uid, _id: obj_id });
        return res.json({ 'status': 'success', 'data': 'OK' });
    } catch (err) {
        return res.json({ 'status': 'fail', 'message': err.message });
    }
}

module.exports = LeaveAITrade;
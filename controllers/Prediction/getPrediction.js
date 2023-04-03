const PredictionModel = require('../../models/Prediction');
var authFile = require('../../auth.js');

const getPrediction = async (req, res) => {

    const { symbol, api_key } = req.body;

    const result = await authFile.apiKeyChecker(api_key);

    if (result === true) {

        let key = req.headers["key"];

        if (!key) {
            return res.json({ status: "fail", message: "key_not_found" });
        }

        if (!req.body.device_id || !req.body.user_id) {
            return res.json({ status: "fail", message: "invalid_params" });
        }

        let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


        if (checkKey === "expired") {
            return res.json({ status: "fail", message: "key_expired" });
        }

        if (!checkKey) {
            return res.json({ status: "fail", message: "invalid_key" });
        }


        let prediction = await PredictionModel.find({
            ...symbol && { coin_symbol: symbol },
        }).exec();

        if (prediction) {
            return res.json({ status: "success", data: prediction });
        }
        else {
            return res.json({ status: "fail", message: "Prediction not found", showableMessage: "Prediction not found" });
        }

    }
    else {
        return res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
    }

}

module.exports = getPrediction;
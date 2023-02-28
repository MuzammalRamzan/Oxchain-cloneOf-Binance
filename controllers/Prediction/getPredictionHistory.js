const PredictionHistoryModel = require('../../models/PredictionHistory');
var authFile = require('../../auth.js');

const getPrediction = async (req, res) => {

    const { symbol, api_key } = req.body;

    const result = await authFile.apiKeyChecker(api_key);

    if (result === true) {

        let prediction = await PredictionHistoryModel.find({
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
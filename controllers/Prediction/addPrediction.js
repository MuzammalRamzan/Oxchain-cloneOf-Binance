const PredictionModel = require('../../models/Prediction');
var authFile = require('../../auth.js');
const PredictionHistoryModel = require('../../models/PredictionHistory');

const addPrediction = async (req, res) => {

    const { symbol, prediction, api_key } = req.body;

    const result = await authFile.apiKeyChecker(api_key);

    if (result === true) {

        let predictionCheck = await PredictionModel.findOne({
            coin_symbol: symbol,
        }).exec();

        let newPredictionHistory = new PredictionHistoryModel({
            coin_symbol: symbol,
            prediction: prediction,
        });

        await newPredictionHistory.save();

        if (predictionCheck) {
            predictionCheck.prediction = prediction;
            await predictionCheck.save();
        }
        else {
            let newPrediction = new PredictionModel({
                coin_symbol: symbol,
                prediction: prediction,
            });
            await newPrediction.save();
        }

        return res.json({
            status: "success",
            message: "Prediction added",
            showableMessage: "Prediction added",
        });

    }


}

module.exports = addPrediction;
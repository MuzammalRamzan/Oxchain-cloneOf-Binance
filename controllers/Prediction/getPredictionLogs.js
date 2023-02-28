const Prediction = require('../../models/Prediction');
const PredictionHistory = require('../../models/PredictionHistory');

const log = async (req, res) => {





    let coinCheck = await Prediction.find({
    }).sort({ createdAt: -1 });


    //get different coin symbols from prediction history
    let coinSymbols = [];
    for (let i = 0; i < coinCheck.length; i++) {
        let data = coinCheck[i];
        if (!coinSymbols.includes(data.coin_symbol)) {
            coinSymbols.push(data.coin_symbol);
        }
    }

    console.log(coinSymbols);


    let generalDataArray = [];
    for (let i = 0; i < coinSymbols.length; i++) {
        let foreachPredictionData = [];
        let predictionHistoryData = await PredictionHistory.find({
            coin_symbol: coinSymbols[i],
        }).sort({ createdAt: -1 }).limit(4);

        let predictionData = await Prediction.find({
            coin_symbol: coinSymbols[i],
        }).sort({ createdAt: -1 }).limit(1);


        console.log(predictionHistoryData.length);


        for (let i = 0; i < predictionHistoryData.length - 1; i++) {

            let data = predictionHistoryData[i];

            let nextData = predictionHistoryData[i + 1];

            if (data.prediction == 1) {

                if (data.price < nextData.price) {
                    foreachPredictionData.push(
                        {
                            prediction: data.prediction,
                            price: nextData.price,
                            isSuccess: false,
                        }
                    )
                }
                else {
                    foreachPredictionData.push(
                        {
                            prediction: data.prediction,
                            price: nextData.price,
                            isSuccess: true,
                        }
                    )
                }
            }

            if (data.prediction == 0) {

                if (data.price > nextData.price) {
                    foreachPredictionData.push(
                        {
                            prediction: data.prediction,
                            isSuccess: false,
                            price: nextData.price,
                        }
                    )
                }
                else {
                    foreachPredictionData.push(
                        {
                            prediction: data.prediction,
                            isSuccess: true,
                            price: nextData.price,
                        }
                    )
                }
            }

        }
        foreachPredictionData.push(
            {
                prediction: predictionData[0].prediction,
                price: predictionData[0].price,
                isSuccess: "pending",
            });


        generalDataArray.push(
            {
                coin_symbol: coinSymbols[i],
                data: foreachPredictionData,
            }
        );

    }

    return res.json({
        status: "success",
        data: generalDataArray,
    });








}

module.exports = log;
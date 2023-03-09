const Prediction = require('../../models/Prediction');
const PredictionHistory = require('../../models/PredictionHistory');

const log = async (req, res) => {


    let predictionHistoryData = await PredictionHistory.find({
        coin_symbol: req.body.coin_symbol,
    }).sort({ createdAt: -1 }).limit(4);

    let predictionData = await Prediction.find({
        coin_symbol: req.body.coin_symbol,
    }).sort({ createdAt: -1 }).limit(1);


    let dataArray = [];

    console.log(predictionHistoryData.length);
    for (let i = 0; i < predictionHistoryData.length - 1; i++) {

        let data = predictionHistoryData[i];

        let nextData = predictionHistoryData[i + 1];

        if (data.prediction == 1) {

            if (data.price < nextData.price) {
                dataArray.push(
                    {
                        prediction: data.prediction,
                        price: nextData.price,
                        isSuccess: false,
                    }
                )
            }
            else {
                dataArray.push(
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
                dataArray.push(
                    {
                        prediction: data.prediction,
                        isSuccess: false,
                        price: nextData.price,
                    }
                )
            }
            else {
                dataArray.push(
                    {
                        prediction: data.prediction,
                        isSuccess: true,
                        price: nextData.price,
                    }
                )
            }
        }

    }


    console.log(predictionData);
    dataArray.push(
        {
            prediction: predictionData[0].prediction,
            price: predictionData[0].price,
            isSuccess: "pending",
        });


    return res.json(
        {
            status: "success",
            data: dataArray
        }
    )

}

module.exports = log;
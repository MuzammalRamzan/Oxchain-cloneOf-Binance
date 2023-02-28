const Prediction = require('../../models/Prediction');
const PredictionHistory = require('../../models/PredictionHistory');

const log = async (req, res) => {

    const { coin_symbol } = req.body;


    let predictionHistoryData = await PredictionHistory.find({
        coin_symbol: coin_symbol,
        createdAt: {
            $gte: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000)
        }
    }).sort({ createdAt: -1 });

    if (predictionHistoryData.length < 2) {
        return res.json({
            success: false,
            message: "Not enough data to calculate accuracy metrics"
        })
    }


    let dates = [];
    for (let i = 0; i < predictionHistoryData.length; i++) {
        let data = predictionHistoryData[i];
        let dateOnlyDayAndMonthAndYear = data.createdAt.toISOString().split('T')[0];
        if (!dates.includes(dateOnlyDayAndMonthAndYear)) {

            dates.push(dateOnlyDayAndMonthAndYear);
        }
    }
    console.log(dates);

    let dateArray = [];
    for (let i = 0; i < dates.length; i++) {
        let date = dates[i];
        dateArray.push({
            date: date,
            successCount: 0,
            failureCount: 0,
        })
    }

    for (let i = 0; i < PredictionHistory.length; i++) {

        let data = predictionHistoryData[i];
        let nextData = predictionHistoryData[i + 1];
        let dateOnlyDayAndMonthAndYear = data.createdAt.toISOString().split('T')[0];

        if (data.prediction == 1) {

            if (data.price < nextData.price) {
                for (let j = 0; j < dateArray.length; j++) {
                    if (dateArray[j].date == dateOnlyDayAndMonthAndYear) {
                        dateArray[j].failureCount++;
                    }
                }
            }
            else {
                for (let j = 0; j < dateArray.length; j++) {
                    if (dateArray[j].date == dateOnlyDayAndMonthAndYear) {
                        dateArray[j].successCount++;
                    }
                }
            }
        }

        if (data.prediction == 0) {
            if (data.price > nextData.price) {
                for (let j = 0; j < dateArray.length; j++) {
                    if (dateArray[j].date == dateOnlyDayAndMonthAndYear) {
                        dateArray[j].failureCount++;
                    }
                }
            }
            else {
                for (let j = 0; j < dateArray.length; j++) {
                    if (dateArray[j].date == dateOnlyDayAndMonthAndYear) {
                        dateArray[j].successCount++;
                    }
                }
            }
        }
    }

    return res.json({
        success: true,
        data: dateArray,
    })

}

module.exports = log;
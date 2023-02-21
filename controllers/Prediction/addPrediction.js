const PredictionModel = require('../../models/Prediction');
var authFile = require('../../auth.js');
const PredictionHistoryModel = require('../../models/PredictionHistory');

const AITradeSettingsModel = require('../../models/AITradeSettings');
const AITradeWalletModel = require('../../models/AITradeWallet');
const PairModel = require('../../models/Pairs');
const UserModel = require('../../models/User');
const OrderModel = require('../../models/Orders');
const Wallet = require('../../models/Wallet');
let axios = require('axios');
const AITradeLogsModel = require('../../models/AITradeLogs');




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


        const pairs = await PairModel.findOne({
            name: symbol + "/USDT"
        });

        if (pairs) {

            let setting = await AITradeSettingsModel.find({
                pair: pairs._id
            });

            if (setting) {

                for (let i = 0; i < setting.length; i++) {
                    let userCheck = await UserModel.findOne({
                        _id: setting[i].user_id
                    });

                    if (!userCheck) {
                        continue;
                    }


                    if (prediction == 1 || prediction == "1") {

                        let balance = parseFloat(setting[i].balance);

                        //give spot market order to user 
                        var urlPair = symbol + "USDT";
                        let url =
                            'http://18.170.26.150:8542/price?symbol=' + urlPair;
                        let result = await axios(url);
                        var price = result.data.data.ask;


                        if (balance == 0) {
                            continue;
                        }
                        //calculate coin amount to buy
                        let coinAmount = balance / price;

                        const orders = new AITradeLogsModel({
                            pair_id: pairs.symbolOneID,
                            second_pair: pairs.symbolTwoID,
                            pair_name: pairs.name,
                            user_id: userCheck._id,
                            amount: coinAmount,
                            open_price: price,
                            feeUSDT: 0,
                            feeAmount: 0,
                            type: "market",
                            method: "buy",
                        });


                        let saved = await orders.save();

                        if (saved) {

                            setting[i].balance = 0;
                            setting[i].coin_balance += coinAmount;
                            await setting[i].save();
                        }

                    }


                    if (prediction == 0 || prediction == "0") {

                        let coin_balance = parseFloat(setting[i].coin_balance);

                        //give spot market order to user 
                        var urlPair = symbol + "USDT";
                        let url =
                            'http://18.170.26.150:8542/price?symbol=' + urlPair;
                        let result = await axios(url);
                        var price = result.data.data.bid;


                        if (coin_balance == 0) {
                            continue;
                        }


                        let calculatedBalance = coin_balance * parseFloat(price, 8);

                        const orders = new AITradeLogsModel({
                            pair_id: pairs.symbolOneID,
                            second_pair: pairs.symbolTwoID,
                            pair_name: pairs.name,
                            user_id: userCheck._id,
                            amount: coin_balance,
                            open_price: price,
                            feeUSDT: 0,
                            feeAmount: 0,
                            type: "market",
                            method: "sell",
                        });

                        let saved = await orders.save();

                        if (saved) {

                            setting[i].balance += calculatedBalance;
                            setting[i].coin_balance = 0;
                            await setting[i].save();
                        }
                    }

                }
            }
        }


        return res.json({
            status: "success",
            message: "Prediction added",
            showableMessage: "Prediction added",
        });

    }


}

module.exports = addPrediction;
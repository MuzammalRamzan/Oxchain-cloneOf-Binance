const PredictionModel = require('../../models/Prediction');
var authFile = require('../../auth.js');
const PredictionHistoryModel = require('../../models/PredictionHistory');

const AITradeWalletModel = require('../../models/AITradeWallet');
const AIFutureModel = require('../../models/AIFutureModel');
const PairModel = require('../../models/Pairs');
const UserModel = require('../../models/User');
const OrderModel = require('../../models/Orders');
const Wallet = require('../../models/Wallet');
let axios = require('axios');
const AITradeLogsModel = require('../../models/AITradeLogs');
const PredictionHistory = require('../../models/PredictionHistory');

const addPrediction = async (req, res) => {
	const { symbol, prediction, api_key, priceData, interval } = req.body;

	const result = await authFile.apiKeyChecker(api_key);

	if (result === true) {
		let predicationHistory = await PredictionHistoryModel.findOne({
			coin_symbol: symbol,
			interval: interval,
		}).sort({ createdAt: -1 }).exec();

		let isSuccess;
		if (predicationHistory) {
			if (predicationHistory.prediction == 1) {
				if (priceData > predicationHistory.price) {
					isSuccess = 1;
				} else {
					isSuccess = 0;
				}
			}
			if (predicationHistory.prediction == 0) {
				if (priceData < predicationHistory.price) {
					isSuccess = 1;
				} else {
					isSuccess = 0;
				}
			}
			predicationHistory.isSuccess = isSuccess;
			predicationHistory.save();
		}
        let newPredictionHistory = new PredictionHistoryModel({
            coin_symbol: symbol,
            prediction: prediction,
            price: priceData,
            interval: interval,
            isSuccess: "pending",
        });
        await newPredictionHistory.save();
        return res.json({
			status: 'success',
			message: 'Prediction added',
			showableMessage: 'Prediction added successfully',
		});

		let predictionCheck = await PredictionModel.findOne({
			coin_symbol: symbol,
			interval: interval,
		}).exec();

		// let newPredictionHistory = new PredictionHistoryModel({
		// 	coin_symbol: symbol,
		// 	prediction: prediction,
		// 	price: priceData,
		// 	interval: interval,
		// });

		await newPredictionHistory.save();

        
		if (predictionCheck) {
			predictionCheck.prediction = prediction;
			predictionCheck.price = priceData;
			await predictionCheck.save();
		} else {
			let newPrediction = new PredictionModel({
				coin_symbol: symbol,
				prediction: prediction,
				price: priceData,
				interval: interval,
			});
			await newPrediction.save();
		}

		const pairs = await PairModel.findOne({
			name: symbol + '/USDT',
		});

		console.log(pairs);
		if (pairs) {
			let AIFutureModelCheck = await AIFutureModel.findOne({
				pair: symbol,
			}).exec();

			if (AIFutureModelCheck) {
				//3 method, biri otomatik (5 dk da bir veya 1 saatte bir pozisyonu kapatıp yenisini açar)
				//2. si manuel, emir açılır, verilen emirde max Order sayısı alınır, max order sayısı kadar emir oluşturulur, emirler kullanıcı isteyene kadar kapanmaz
				//3. sü tp/sl

				console.log(AIFutureModelCheck);
				for (let i = 0; i < AIFutureModelCheck.length; i++) {}
			}
		}

		return res.json({
			status: 'success',
			message: 'Prediction added',
			showableMessage: 'Prediction added',
		});
	}
};

module.exports = addPrediction;

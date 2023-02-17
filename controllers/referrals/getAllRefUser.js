const FeeModel = require('../../models/FeeModel');
const authFile = require('../../auth');
const UserRef = require('../../models/UserRef');
const FutureWalletModel = require('../../models/FutureWalletModel');
const TradeVolume = require('../../models/TradeVolumeModel');
const User = require('../../models/User');

const mongoose = require('mongoose');
const getAllRefUser = async (req, res) => {
	try {
		const apiKey = req.body.api_key;
		const page = req.body.page || 1;
		const limit = req.body.limit || 10;
		const isAuthenticated = await authFile.apiKeyChecker(apiKey);
		if (!isAuthenticated) {
			return res.status(403).json({
				status: 'fail',
				message: '403 Forbidden',
				showableMessage: 'Forbidden 403, Please provide valid api key',
			});
		}

		// Set the number of records to be returned per page
		const startIndex = (page - 1) * limit;
		const totalDocs = await UserRef.countDocuments();
		let refUsers = await UserRef.find().skip(startIndex).limit(limit).lean();
		const userIds = refUsers.map((refUser) => refUser.user_id);
		const userTotals = [];
		for (let i = 0; i < userIds.length; i++) {
			const futureSum = await FutureWalletModel.aggregate([
				{
					$match: {
						user_id: {
							$eq: userIds[i],
						},
					},
				},
				{
					$group: {
						_id: null,
						totalFutureVolume: { $sum: '$amount' },
					},
				},
			]);
			const sum = await TradeVolume.aggregate([
				{
					$match: {
						user_id: {
							$eq: userIds[i],
						},
					},
				},
				{
					$group: {
						_id: null,
						totalSpotVolume: { $sum: '$totalUSDT' },
					},
				},
			]);

			const fees = await FeeModel.aggregate([
				{
					$match: {
						to_user_id: mongoose.Types.ObjectId(userIds[i]),
					},
				},
				{
					$group: {
						_id: null,
						totalAmount: { $sum: '$amount' },
					},
				},
			]);
			console.log(futureSum, sum);
			const commision = fees.length > 0 ? fees[0].totalAmount : 0;
			const futureTotal =
				futureSum.length > 0 ? futureSum[0].totalFutureVolume : 0;
			const spotTotal = sum.length > 0 ? sum[0].totalSpotVolume : 0;
			const user = await User.findOne({ _id: userIds[i] });

			userTotals.push({
				user: user,
				userId: userIds[i],
				commission: commision,
				futureSum: futureTotal,
				spotSum: spotTotal,
				trades: futureSum.length + sum.length,
			});
		}
		res.json({
			status: 'success',
			message: 'Users Referral Data',
			data: {
				totalPages: Math.ceil(totalDocs / limit),
				currentPage: page,
				userTotals: userTotals,
			},
		});
	} catch (error) {
		return res.status(500).json({
			status: 'fail',
			message: 'Internal Server Error',
			showableMessage: error.message,
		});
	}
};

module.exports = getAllRefUser;
